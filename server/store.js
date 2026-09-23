// Persistence: room state survives server restarts and redeploys.
// With DATABASE_URL (Replit Postgres), state is saved as one JSONB row per
// room plus debounced writes; without it (local dev), everything stays in
// memory. Session data is deletable on request: the full-reset endpoint
// clears the table too (PRD §13).
import pg from "pg";

let pool = null;
let saveTimer = null;
let pendingRooms = null;

export async function initStore() {
  if (!process.env.DATABASE_URL) {
    console.log("Store: in-memory only (no DATABASE_URL)");
    return null;
  }
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  await pool.query(
    `CREATE TABLE IF NOT EXISTS tabletop_rooms (
       room_number int PRIMARY KEY,
       data jsonb NOT NULL,
       updated_at timestamptz NOT NULL DEFAULT now()
     )`,
  );
  const { rows } = await pool.query("SELECT room_number, data FROM tabletop_rooms");
  const loaded = {};
  for (const r of rows) loaded[r.room_number] = r.data;
  console.log(`Store: Postgres connected, ${rows.length} room(s) restored`);
  return loaded;
}

export function saveRooms(rooms) {
  if (!pool) return;
  pendingRooms = rooms;
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    const snapshot = pendingRooms;
    pendingRooms = null;
    try {
      for (const [num, data] of Object.entries(snapshot)) {
        await pool.query(
          `INSERT INTO tabletop_rooms (room_number, data, updated_at) VALUES ($1, $2, now())
           ON CONFLICT (room_number) DO UPDATE SET data = $2, updated_at = now()`,
          [Number(num), JSON.stringify(data)],
        );
      }
    } catch (err) {
      console.error("Store: save failed:", err.message);
    }
  }, 400);
}

export async function clearStore() {
  if (!pool) return;
  try {
    await pool.query("DELETE FROM tabletop_rooms");
  } catch (err) {
    console.error("Store: clear failed:", err.message);
  }
}
