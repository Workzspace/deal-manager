// Property Ledger REST API (Express app).
// This file builds and exports the app WITHOUT starting it, so the same app can
// be used by the local dev server (server.js) and by Vercel's serverless
// function (../../api/[...path].js).
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { query, getClient, init } from './db.js';
import { login, requireAuth } from './auth.js';

const app = express();

app.use(cors());
app.use(express.json());

// Make sure the tables exist before handling any request (runs once, then cached).
app.use(async (req, res, next) => {
  try {
    await init();
    next();
  } catch (err) {
    next(err);
  }
});

// ---------- Helpers ----------

const VALID_STATUS = ['available', 'negotiation', 'hold', 'sold'];

// Wrap an async route handler so thrown errors go to the error middleware
// instead of crashing the process / hanging the request.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Compute gaj from feet if the user didn't type it in directly.
// 1 gaj = 1 sq yard = 9 sq ft.
function computeGaj(width, length, gaj) {
  if (gaj !== undefined && gaj !== null && gaj !== '') return Number(gaj);
  if (width && length) return Math.round(((width * length) / 9) * 100) / 100;
  return null;
}

// Attach the buyers list to a single deal object.
async function withBuyers(deal) {
  const { rows } = await query('SELECT * FROM buyers WHERE deal_id = $1 ORDER BY id', [deal.id]);
  return { ...deal, buyers: rows };
}

// Attach buyers to a LIST of deals using a single query (avoids N+1 round-trips,
// which matters a lot for response speed).
async function attachBuyers(deals) {
  if (deals.length === 0) return [];
  const ids = deals.map((d) => d.id);
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await query(
    `SELECT * FROM buyers WHERE deal_id IN (${placeholders}) ORDER BY id`,
    ids
  );
  const byDeal = new Map();
  for (const b of rows) {
    if (!byDeal.has(b.deal_id)) byDeal.set(b.deal_id, []);
    byDeal.get(b.deal_id).push(b);
  }
  return deals.map((d) => ({ ...d, buyers: byDeal.get(d.id) || [] }));
}

// Save a deal's buyers list inside a transaction (delete old, insert new).
async function saveBuyers(dealId, buyers) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM buyers WHERE deal_id = $1', [dealId]);
    for (const b of buyers || []) {
      if (!b || !b.name) continue;
      await client.query(
        `INSERT INTO buyers (deal_id, name, phone, offer_amount, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          dealId,
          b.name,
          b.phone || null,
          b.offer_amount === '' || b.offer_amount == null ? null : Number(b.offer_amount),
          b.note || null,
        ]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- Public routes ----------
app.post('/api/login', login);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Everything below requires a valid login token.
app.use('/api', requireAuth);

// ---------- Cities ----------
app.get(
  '/api/cities',
  wrap(async (req, res) => {
    const { rows } = await query(
      `SELECT c.id, c.name, c.created_at, COUNT(a.id)::int AS area_count
       FROM cities c
       LEFT JOIN areas a ON a.city_id = c.id
       GROUP BY c.id, c.name, c.created_at
       ORDER BY c.name`
    );
    res.json(rows);
  })
);

app.post(
  '/api/cities',
  wrap(async (req, res) => {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'City name is required.' });
    const { rows } = await query('INSERT INTO cities (name) VALUES ($1) RETURNING *', [name.trim()]);
    res.status(201).json(rows[0]);
  })
);

app.put(
  '/api/cities/:id',
  wrap(async (req, res) => {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'City name is required.' });
    const { rows } = await query('UPDATE cities SET name = $1 WHERE id = $2 RETURNING *', [
      name.trim(),
      req.params.id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: 'City not found.' });
    res.json(rows[0]);
  })
);

app.delete(
  '/api/cities/:id',
  wrap(async (req, res) => {
    await query('DELETE FROM cities WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  })
);

// ---------- Areas ----------
app.get(
  '/api/cities/:cityId/areas',
  wrap(async (req, res) => {
    // One query: areas + their deal counts (no N+1 per-area queries).
    const { rows } = await query(
      `SELECT a.id, a.city_id, a.name, a.created_at,
          COUNT(d.id)::int AS total,
          COALESCE(SUM(CASE WHEN d.status = 'available'   THEN 1 ELSE 0 END), 0)::int AS available,
          COALESCE(SUM(CASE WHEN d.status = 'negotiation' THEN 1 ELSE 0 END), 0)::int AS negotiating,
          COALESCE(SUM(CASE WHEN d.status = 'hold'        THEN 1 ELSE 0 END), 0)::int AS hold,
          COALESCE(SUM(CASE WHEN d.status = 'sold'        THEN 1 ELSE 0 END), 0)::int AS closed
       FROM areas a
       LEFT JOIN deals d ON d.area_id = a.id
       WHERE a.city_id = $1
       GROUP BY a.id, a.city_id, a.name, a.created_at
       ORDER BY a.name`,
      [req.params.cityId]
    );
    const withStats = rows.map((r) => ({
      id: r.id,
      city_id: r.city_id,
      name: r.name,
      created_at: r.created_at,
      stats: {
        total: r.total,
        available: r.available,
        negotiating: r.negotiating,
        hold: r.hold,
        closed: r.closed,
      },
    }));
    res.json(withStats);
  })
);

app.get(
  '/api/areas/:id',
  wrap(async (req, res) => {
    const { rows } = await query('SELECT * FROM areas WHERE id = $1', [req.params.id]);
    const area = rows[0];
    if (!area) return res.status(404).json({ error: 'Area not found.' });
    const { rows: cityRows } = await query('SELECT * FROM cities WHERE id = $1', [area.city_id]);
    res.json({ ...area, city: cityRows[0] });
  })
);

app.post(
  '/api/cities/:cityId/areas',
  wrap(async (req, res) => {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Area name is required.' });
    const { rows } = await query('INSERT INTO areas (city_id, name) VALUES ($1, $2) RETURNING *', [
      req.params.cityId,
      name.trim(),
    ]);
    res.status(201).json(rows[0]);
  })
);

app.put(
  '/api/areas/:id',
  wrap(async (req, res) => {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Area name is required.' });
    const { rows } = await query('UPDATE areas SET name = $1 WHERE id = $2 RETURNING *', [
      name.trim(),
      req.params.id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: 'Area not found.' });
    res.json(rows[0]);
  })
);

app.delete(
  '/api/areas/:id',
  wrap(async (req, res) => {
    await query('DELETE FROM areas WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  })
);

// ---------- Deals ----------
app.get(
  '/api/areas/:areaId/deals',
  wrap(async (req, res) => {
    const { status } = req.query;
    let result;
    if (status && VALID_STATUS.includes(status)) {
      result = await query(
        'SELECT * FROM deals WHERE area_id = $1 AND status = $2 ORDER BY created_at DESC',
        [req.params.areaId, status]
      );
    } else {
      result = await query('SELECT * FROM deals WHERE area_id = $1 ORDER BY created_at DESC', [
        req.params.areaId,
      ]);
    }
    res.json(await attachBuyers(result.rows));
  })
);

app.get(
  '/api/deals/:id',
  wrap(async (req, res) => {
    const { rows } = await query('SELECT * FROM deals WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Deal not found.' });
    res.json(await withBuyers(rows[0]));
  })
);

app.post(
  '/api/areas/:areaId/deals',
  wrap(async (req, res) => {
    const d = req.body || {};
    if (!d.plot_no || !String(d.plot_no).trim()) {
      return res.status(400).json({ error: 'Plot no./reference is required.' });
    }
    const status = VALID_STATUS.includes(d.status) ? d.status : 'available';
    const gaj = computeGaj(d.width_ft, d.length_ft, d.gaj);

    const { rows } = await query(
      `INSERT INTO deals
        (area_id, plot_no, width_ft, length_ft, gaj, status,
         asking_price, expected_price, seller_name, seller_phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.params.areaId,
        String(d.plot_no).trim(),
        d.width_ft || null,
        d.length_ft || null,
        gaj,
        status,
        d.asking_price || null,
        d.expected_price || null,
        d.seller_name || null,
        d.seller_phone || null,
        d.notes || null,
      ]
    );
    await saveBuyers(rows[0].id, d.buyers);
    res.status(201).json(await withBuyers(rows[0]));
  })
);

app.put(
  '/api/deals/:id',
  wrap(async (req, res) => {
    const { rows: existingRows } = await query('SELECT * FROM deals WHERE id = $1', [req.params.id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Deal not found.' });

    const d = req.body || {};
    if (!d.plot_no || !String(d.plot_no).trim()) {
      return res.status(400).json({ error: 'Plot no./reference is required.' });
    }
    const status = VALID_STATUS.includes(d.status) ? d.status : existing.status;
    const gaj = computeGaj(d.width_ft, d.length_ft, d.gaj);

    const { rows } = await query(
      `UPDATE deals SET
         plot_no = $1, width_ft = $2, length_ft = $3, gaj = $4, status = $5,
         asking_price = $6, expected_price = $7, seller_name = $8, seller_phone = $9,
         notes = $10, updated_at = now()
       WHERE id = $11
       RETURNING *`,
      [
        String(d.plot_no).trim(),
        d.width_ft || null,
        d.length_ft || null,
        gaj,
        status,
        d.asking_price || null,
        d.expected_price || null,
        d.seller_name || null,
        d.seller_phone || null,
        d.notes || null,
        req.params.id,
      ]
    );
    await saveBuyers(req.params.id, d.buyers);
    res.json(await withBuyers(rows[0]));
  })
);

app.delete(
  '/api/deals/:id',
  wrap(async (req, res) => {
    await query('DELETE FROM deals WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  })
);

// ---------- Global search ----------
// Searches across plot numbers, sellers, buyers, areas and cities.
app.get(
  '/api/search',
  wrap(async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const like = `%${q}%`;

    const { rows } = await query(
      `SELECT DISTINCT d.*, a.name AS area_name, c.name AS city_name, c.id AS city_id
       FROM deals d
       JOIN areas a ON a.id = d.area_id
       JOIN cities c ON c.id = a.city_id
       LEFT JOIN buyers b ON b.deal_id = d.id
       WHERE d.plot_no ILIKE $1
          OR d.seller_name ILIKE $1
          OR d.seller_phone ILIKE $1
          OR d.notes ILIKE $1
          OR a.name ILIKE $1
          OR c.name ILIKE $1
          OR b.name ILIKE $1
          OR b.phone ILIKE $1
       ORDER BY d.updated_at DESC
       LIMIT 100`,
      [like]
    );
    res.json(await attachBuyers(rows));
  })
);

// ---------- Error handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('API error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

export default app;
