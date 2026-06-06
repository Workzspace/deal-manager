// Property Ledger REST API
// Express server that exposes the data over HTTP so multiple phones can share
// the same database.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db.js';
import { login, requireAuth } from './auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ---------- Helpers ----------

const VALID_STATUS = ['available', 'negotiation', 'hold', 'sold'];

// Compute gaj from feet if the user didn't type it in directly.
// 1 gaj = 1 sq yard = 9 sq ft.
function computeGaj(width, length, gaj) {
  if (gaj !== undefined && gaj !== null && gaj !== '') return Number(gaj);
  if (width && length) return Math.round(((width * length) / 9) * 100) / 100;
  return null;
}

// Attach the buyers list to a deal object.
function withBuyers(deal) {
  const buyers = db
    .prepare('SELECT * FROM buyers WHERE deal_id = ? ORDER BY id')
    .all(deal.id);
  return { ...deal, buyers };
}

// Save a deal's buyers list. We delete the old ones and insert the new ones
// inside a transaction so it's all-or-nothing (if anything fails, nothing
// changes). node:sqlite has no transaction() helper, so we drive it manually.
function saveBuyers(dealId, buyers) {
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM buyers WHERE deal_id = ?').run(dealId);
    const insert = db.prepare(
      `INSERT INTO buyers (deal_id, name, phone, offer_amount, note)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const b of buyers || []) {
      if (!b || !b.name) continue;
      insert.run(
        dealId,
        b.name,
        b.phone || null,
        b.offer_amount === '' || b.offer_amount == null ? null : Number(b.offer_amount),
        b.note || null
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---------- Public route ----------
app.post('/api/login', login);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Everything below requires a valid login token.
app.use('/api', requireAuth);

// ---------- Cities ----------

// List all cities, each with a quick count of areas.
app.get('/api/cities', (req, res) => {
  const cities = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM areas a WHERE a.city_id = c.id) AS area_count
       FROM cities c ORDER BY c.name`
    )
    .all();
  res.json(cities);
});

app.post('/api/cities', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'City name is required.' });
  const info = db.prepare('INSERT INTO cities (name) VALUES (?)').run(name.trim());
  res.status(201).json(db.prepare('SELECT * FROM cities WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/cities/:id', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'City name is required.' });
  db.prepare('UPDATE cities SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
  if (!city) return res.status(404).json({ error: 'City not found.' });
  res.json(city);
});

app.delete('/api/cities/:id', (req, res) => {
  db.prepare('DELETE FROM cities WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Areas ----------

// List areas for a city, each with stats (totals, status counts, portfolio value).
app.get('/api/cities/:cityId/areas', (req, res) => {
  const areas = db
    .prepare('SELECT * FROM areas WHERE city_id = ? ORDER BY name')
    .all(req.params.cityId);

  const statsStmt = db.prepare(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'available'   THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN status = 'negotiation' THEN 1 ELSE 0 END) AS negotiating,
        SUM(CASE WHEN status = 'hold'        THEN 1 ELSE 0 END) AS hold,
        SUM(CASE WHEN status = 'sold'        THEN 1 ELSE 0 END) AS closed,
        SUM(CASE WHEN status != 'sold' THEN COALESCE(asking_price, 0) ELSE 0 END) AS active_value
     FROM deals WHERE area_id = ?`
  );

  const withStats = areas.map((a) => ({ ...a, stats: statsStmt.get(a.id) }));
  res.json(withStats);
});

app.get('/api/areas/:id', (req, res) => {
  const area = db.prepare('SELECT * FROM areas WHERE id = ?').get(req.params.id);
  if (!area) return res.status(404).json({ error: 'Area not found.' });
  const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(area.city_id);
  res.json({ ...area, city });
});

app.post('/api/cities/:cityId/areas', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Area name is required.' });
  const info = db
    .prepare('INSERT INTO areas (city_id, name) VALUES (?, ?)')
    .run(req.params.cityId, name.trim());
  res.status(201).json(db.prepare('SELECT * FROM areas WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/areas/:id', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Area name is required.' });
  db.prepare('UPDATE areas SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  const area = db.prepare('SELECT * FROM areas WHERE id = ?').get(req.params.id);
  if (!area) return res.status(404).json({ error: 'Area not found.' });
  res.json(area);
});

app.delete('/api/areas/:id', (req, res) => {
  db.prepare('DELETE FROM areas WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Deals ----------

// List deals in an area (with their buyers). Optional ?status= filter.
app.get('/api/areas/:areaId/deals', (req, res) => {
  const { status } = req.query;
  let rows;
  if (status && VALID_STATUS.includes(status)) {
    rows = db
      .prepare('SELECT * FROM deals WHERE area_id = ? AND status = ? ORDER BY created_at DESC')
      .all(req.params.areaId, status);
  } else {
    rows = db
      .prepare('SELECT * FROM deals WHERE area_id = ? ORDER BY created_at DESC')
      .all(req.params.areaId);
  }
  res.json(rows.map(withBuyers));
});

app.get('/api/deals/:id', (req, res) => {
  const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found.' });
  res.json(withBuyers(deal));
});

app.post('/api/areas/:areaId/deals', (req, res) => {
  const d = req.body || {};
  if (!d.plot_no || !String(d.plot_no).trim()) {
    return res.status(400).json({ error: 'Plot no./reference is required.' });
  }
  const status = VALID_STATUS.includes(d.status) ? d.status : 'available';
  const gaj = computeGaj(d.width_ft, d.length_ft, d.gaj);

  const info = db
    .prepare(
      `INSERT INTO deals
        (area_id, plot_no, width_ft, length_ft, gaj, status,
         asking_price, expected_price, seller_name, seller_phone, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
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
      d.notes || null
    );

  saveBuyers(info.lastInsertRowid, d.buyers);
  res.status(201).json(withBuyers(db.prepare('SELECT * FROM deals WHERE id = ?').get(info.lastInsertRowid)));
});

app.put('/api/deals/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Deal not found.' });

  const d = req.body || {};
  if (!d.plot_no || !String(d.plot_no).trim()) {
    return res.status(400).json({ error: 'Plot no./reference is required.' });
  }
  const status = VALID_STATUS.includes(d.status) ? d.status : existing.status;
  const gaj = computeGaj(d.width_ft, d.length_ft, d.gaj);

  db.prepare(
    `UPDATE deals SET
       plot_no = ?, width_ft = ?, length_ft = ?, gaj = ?, status = ?,
       asking_price = ?, expected_price = ?, seller_name = ?, seller_phone = ?,
       notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
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
    req.params.id
  );

  saveBuyers(req.params.id, d.buyers);
  res.json(withBuyers(db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id)));
});

app.delete('/api/deals/:id', (req, res) => {
  db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Global search ----------
// Searches across plot numbers, sellers, buyers, areas and cities.
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const like = `%${q}%`;

  const rows = db
    .prepare(
      `SELECT DISTINCT d.*, a.name AS area_name, c.name AS city_name, c.id AS city_id
       FROM deals d
       JOIN areas a ON a.id = d.area_id
       JOIN cities c ON c.id = a.city_id
       LEFT JOIN buyers b ON b.deal_id = d.id
       WHERE d.plot_no LIKE ?
          OR d.seller_name LIKE ?
          OR d.seller_phone LIKE ?
          OR d.notes LIKE ?
          OR a.name LIKE ?
          OR c.name LIKE ?
          OR b.name LIKE ?
          OR b.phone LIKE ?
       ORDER BY d.updated_at DESC
       LIMIT 100`
    )
    .all(like, like, like, like, like, like, like, like);

  res.json(rows.map(withBuyers));
});

app.listen(PORT, () => {
  console.log(`Property Ledger API running on http://localhost:${PORT}`);
});
