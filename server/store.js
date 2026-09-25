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

export async function initStore() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for durable rooms");
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
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
  const { rows } = await pool.query("SELECT room_number, scenario_id, state FROM tabletop_rooms");
  const restored = {};
  const claims = new Set();
  for (const row of rows) {
    if (row.state?.contentVersion !== CONTENT_VERSION) {
      console.warn(`Room ${row.room_number} was saved under older scenario content; starting it fresh.`);
      continue;
    }
    if (![1, 2, 3, 4].includes(row.room_number) || !validRoom(row.state) ||
        row.scenario_id !== row.state.scenarioId ||
        (row.scenario_id && claims.has(row.scenario_id))) {
      throw new Error(`invalid persisted room ${row.room_number}`);
    }
    if (row.scenario_id) claims.add(row.scenario_id);
    restored[row.room_number] = row.state;
  }
  return restored;
}

export async function saveRooms(rooms) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [number, state] of Object.entries(rooms)) {
      if (![1, 2, 3, 4].includes(Number(number)) || !validRoom(state))
        throw new Error(`invalid room state ${number}`);
      await client.query(
        `INSERT INTO tabletop_rooms (room_number, scenario_id, state, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (room_number) DO UPDATE SET
         scenario_id = EXCLUDED.scenario_id, state = EXCLUDED.state, updated_at = now()`,
        [Number(number), state.scenarioId, JSON.stringify(state)],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}