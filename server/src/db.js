// Database setup using Node's built-in SQLite (node:sqlite).
//
// We use the built-in module instead of a package like better-sqlite3 so there
// is NOTHING to compile and NO extra install step that can fail on Windows.
// It's synchronous (no async/await needed), which keeps the code simple.
// The whole database lives in a single file: data.db
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// The .db file is stored one level up, inside the /server folder.
const DB_PATH = join(__dirname, '..', 'data.db');

const db = new DatabaseSync(DB_PATH);

// WAL mode = better performance and safer concurrent reads/writes
// (important because several phones may use the app at once).
db.exec('PRAGMA journal_mode = WAL');
// Make sure foreign keys (relationships between tables) are enforced.
db.exec('PRAGMA foreign_keys = ON');

// Create the tables if they don't already exist.
// The hierarchy is: City -> Area -> Deal -> Buyers
db.exec(`
  CREATE TABLE IF NOT EXISTS cities (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS areas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    city_id     INTEGER NOT NULL,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS deals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id         INTEGER NOT NULL,
    plot_no         TEXT NOT NULL,
    width_ft        REAL,
    length_ft       REAL,
    gaj             REAL,
    status          TEXT NOT NULL DEFAULT 'available',
    asking_price    REAL,
    expected_price  REAL,
    seller_name     TEXT,
    seller_phone    TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS buyers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id       INTEGER NOT NULL,
    name          TEXT NOT NULL,
    phone         TEXT,
    offer_amount  REAL,
    note          TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
  );
`);

export default db;
