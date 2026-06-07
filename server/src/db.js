// Database layer — PostgreSQL (works great with Supabase + Vercel).
//
// Why Postgres now? On Vercel the server runs as "serverless functions" that
// don't keep a local hard drive, so a SQLite file would be wiped between
// requests. A hosted Postgres (Supabase) keeps all data in one place so every
// device stays in sync.
//
// Connection:
//   - In production set DATABASE_URL to your Supabase connection string.
//   - With NO DATABASE_URL we fall back to an in-memory database (pg-mem) so you
//     can run/try the app locally with zero setup. NOTE: that in-memory data is
//     NOT saved — it resets when the server restarts. Use DATABASE_URL for real
//     data.
import pg from 'pg';

let pool;
let initPromise;

// Lazily create (and cache) the connection pool. Caching at module scope means
// a serverless function reuses the same pool across requests in a warm instance.
async function getPool() {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase requires SSL. We don't verify the chain (managed service).
      ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
      max: 3,
    });
  } else {
    // No database configured → in-memory Postgres for quick local testing.
    const { newDb } = await import('pg-mem');
    const adapter = newDb().adapters.createPg();
    pool = new adapter.Pool();
    console.warn(
      '[db] No DATABASE_URL set — using an in-memory database. Data will NOT be saved.'
    );
  }
  return pool;
}

// Run a query. Returns the pg result ({ rows, rowCount, ... }).
export async function query(text, params) {
  const p = await getPool();
  return p.query(text, params);
}

// Borrow a dedicated client for a transaction (BEGIN/COMMIT/ROLLBACK).
export async function getClient() {
  const p = await getPool();
  return p.connect();
}

// Create the tables if they don't already exist. Cached so it only runs once
// per warm instance, even though it's awaited on every request (cheap).
export function init() {
  if (!initPromise) initPromise = createSchema();
  return initPromise;
}

async function createSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS cities (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS areas (
      id          SERIAL PRIMARY KEY,
      city_id     INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS deals (
      id              SERIAL PRIMARY KEY,
      area_id         INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
      plot_no         TEXT NOT NULL,
      width_ft        DOUBLE PRECISION,
      length_ft       DOUBLE PRECISION,
      gaj             DOUBLE PRECISION,
      status          TEXT NOT NULL DEFAULT 'available',
      asking_price    DOUBLE PRECISION,
      expected_price  DOUBLE PRECISION,
      seller_name     TEXT,
      seller_phone    TEXT,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS buyers (
      id            SERIAL PRIMARY KEY,
      deal_id       INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      phone         TEXT,
      offer_amount  DOUBLE PRECISION,
      note          TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
