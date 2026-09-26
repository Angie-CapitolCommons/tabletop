// The canonical app uses the existing Replit room table. Rooms saved under an
// older content version are discarded at startup: the app is pre-session and
// holds no data worth keeping, and old-shape rooms would break the screens.
import pg from "pg";
import { CONTENT_VERSION, scenarios, meterStart } from "./content/index.js";

let pool;
const phases = new Set(["posed", "challenge", "revise", "score", "consequence"]);

function validRoom(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return false;
  if (r.scenarioId !== null && !scenarios[r.scenarioId]) return false;
  const nodes = r.scenarioId ? scenarios[r.scenarioId].nodes : [];
  if (!Number.isInteger(r.nodeIndex) || r.nodeIndex < 0 ||
      (r.scenarioId ? r.nodeIndex >= nodes.length : r.nodeIndex !== 0)) return false;
  if (!phases.has(r.phase) || typeof r.briefed !== "boolean" ||
      !Number.isFinite(r.startedAt) || !Number.isFinite(r.posedAt)) return false;
  for (const field of ["records", "elderTurns", "roleAssignments", "meter"]) {
    if (!r[field] || typeof r[field] !== "object" || Array.isArray(r[field])) return false;
  }
  if (Object.keys(meterStart).some((key) => !Number.isFinite(r.meter[key]))) return false;
  if (Object.values(r.records).some((entry) =>
    !entry || typeof entry !== "object" || !("firstAnswer" in entry) ||
    !("revisedAnswer" in entry) || typeof entry.held !== "boolean" ||
    typeof entry.skipped !== "boolean" || !entry.timings)) return false;
  return true;
}

export async function initStore({ freshRoom }) {
  makeFresh = freshRoom;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for durable rooms");
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
  // Small key/value store for session-wide results that aren't a room (the
  // admin themes run).
  await pool.query(`CREATE TABLE IF NOT EXISTS tabletop_meta (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  // Same columns as the existing Drizzle schema. Never truncate or rename live data.
  await pool.query(`CREATE TABLE IF NOT EXISTS tabletop_rooms (
    room_number integer PRIMARY KEY,
    scenario_id text,
    state jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  const columns = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'tabletop_rooms'`,
  );
  const names = new Set(columns.rows.map((row) => row.column_name));
  if (!names.has("state") || !names.has("scenario_id")) {
    if (!names.has("data")) throw new Error("Unknown room table layout; refusing to modify it");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const legacy = await client.query("SELECT room_number, data FROM tabletop_rooms");
      for (const row of legacy.rows) {
        if (![1, 2, 3, 4].includes(row.room_number) || !validRoom(row.data))
          throw new Error(`invalid legacy room ${row.room_number}; refusing migration`);
      }
      await client.query("ALTER TABLE tabletop_rooms ADD COLUMN IF NOT EXISTS state jsonb");
      await client.query("ALTER TABLE tabletop_rooms ADD COLUMN IF NOT EXISTS scenario_id text");
      await client.query("UPDATE tabletop_rooms SET state = data, scenario_id = data->>'scenarioId' WHERE state IS NULL");
      await client.query("ALTER TABLE tabletop_rooms ALTER COLUMN state SET NOT NULL");
      // Keep the legacy data column as a backup, but allow new rooms without it.
      await client.query("ALTER TABLE tabletop_rooms ALTER COLUMN data DROP NOT NULL");
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  // The database is the source of truth (any number of server instances can
  // serve requests). Make sure all four rooms exist, and start fresh any room
  // saved under older scenario content or in a shape the screens can't read.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT room_number, scenario_id, state FROM tabletop_rooms FOR UPDATE");
    const claims = new Set();
    for (const n of [1, 2, 3, 4]) {
      const row = rows.find((r) => r.room_number === n);
      const ok = row && row.state?.contentVersion === CONTENT_VERSION && validRoom(row.state) &&
        row.scenario_id === row.state.scenarioId && !(row.scenario_id && claims.has(row.scenario_id));
      if (ok) {
        if (row.scenario_id) claims.add(row.scenario_id);
        continue;
      }
      if (row) console.warn(`Room ${n} was saved under older scenario content or an unreadable shape; starting it fresh.`);
      const fresh = makeFresh();
      await client.query(
        `INSERT INTO tabletop_rooms (room_number, scenario_id, state, updated_at) VALUES ($1, NULL, $2, now())
         ON CONFLICT (room_number) DO UPDATE SET scenario_id = NULL, state = EXCLUDED.state, updated_at = now()`,
        [n, JSON.stringify(fresh)],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  // A scenario can be claimed by one room only, whichever server instance
  // takes the request.
  await pool
    .query("CREATE UNIQUE INDEX IF NOT EXISTS tabletop_rooms_one_claim ON tabletop_rooms (scenario_id) WHERE scenario_id IS NOT NULL")
    .catch((error) => { if (!/already exists/.test(error.message)) throw error; });
}

let makeFresh;
const readable = (row) => (row?.state?.contentVersion === CONTENT_VERSION ? row.state : makeFresh());

// Every room's claimed scenario, by room number (cheap: no state).
export async function readClaims(q = pool) {
  const { rows } = await q.query("SELECT room_number, scenario_id FROM tabletop_rooms");
  return Object.fromEntries(rows.map((r) => [r.room_number, r.scenario_id]));
}

// The rooms a read-only request needs, straight from the database.
export async function readRooms(nums) {
  const { rows } = await pool.query("SELECT room_number, state FROM tabletop_rooms WHERE room_number = ANY($1)", [nums]);
  return Object.fromEntries(nums.map((n) => [n, readable(rows.find((r) => r.room_number === n))]));
}

// Starts a transaction holding the rows for `nums` (in room order, so two
// transactions can't wait on each other). commit() writes only the rooms that
// changed; a second room claiming the same scenario fails with code 23505.
export async function beginRooms(nums) {
  const client = await pool.connect();
  let open = true;
  const end = async (sql) => {
    if (!open) return;
    open = false;
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  };
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT room_number, state FROM tabletop_rooms WHERE room_number = ANY($1) ORDER BY room_number FOR UPDATE",
      [nums],
    );
    const rooms = Object.fromEntries(nums.map((n) => [n, readable(rows.find((r) => r.room_number === n))]));
    const original = Object.fromEntries(nums.map((n) => [n, JSON.stringify(rooms[n])]));
    const claims = await readClaims(client);
    return {
      rooms,
      claims,
      async commit(next) {
        if (!open) throw new Error("the transaction already ended");
        try {
          for (const n of nums) {
            const state = next[n];
            if (JSON.stringify(state) === original[n]) continue;
            if (!validRoom(state)) throw new Error(`invalid room state ${n}`);
            await client.query(
              "UPDATE tabletop_rooms SET scenario_id = $2, state = $3, updated_at = now() WHERE room_number = $1",
              [n, state.scenarioId, JSON.stringify(state)],
            );
          }
        } catch (error) {
          await end("ROLLBACK");
          throw error;
        }
        await end("COMMIT");
      },
      rollback: () => end("ROLLBACK"),
    };
  } catch (error) {
    await end("ROLLBACK");
    throw error;
  }
}

// Load, change, and save rooms in one locked transaction. `fn` may return a
// value, and may throw to change nothing.
export async function withRooms(nums, fn) {
  const tx = await beginRooms(nums);
  let result;
  try {
    result = await fn(tx.rooms, tx.claims);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
  await tx.commit(tx.rooms);
  return result;
}

export async function loadMeta(key) {
  const { rows } = await pool.query("SELECT value FROM tabletop_meta WHERE key = $1", [key]);
  return rows[0]?.value ?? null;
}

export async function saveMeta(key, value) {
  await pool.query(
    `INSERT INTO tabletop_meta (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

// Starts a themes run unless one is already running (and not stale); returns
// false if another run holds it.
export async function claimThemes(job, staleBefore) {
  const { rowCount } = await pool.query(
    `INSERT INTO tabletop_meta (key, value, updated_at) VALUES ('themes', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
     WHERE tabletop_meta.value->>'status' IS DISTINCT FROM 'running'
        OR (tabletop_meta.value->>'startedAt')::bigint < $2`,
    [JSON.stringify(job), staleBefore],
  );
  return rowCount === 1;
}

// Records a run's result, only if that run is still the current one.
export async function finishThemes(id, value) {
  await pool.query(
    "UPDATE tabletop_meta SET value = $2, updated_at = now() WHERE key = 'themes' AND value->>'id' = $1",
    [id, JSON.stringify(value)],
  );
}
