// Seed script: fills the database with starter data so the app isn't empty
// the first time you open it.
//
// Run it with:  npm run seed
//
// It is safe to run only on an empty database. If data already exists it will
// skip seeding so you don't create duplicates.
import db from './db.js';

const cityCount = db.prepare('SELECT COUNT(*) AS n FROM cities').get().n;

if (cityCount > 0) {
  console.log('Database already has data — skipping seed.');
  process.exit(0);
}

console.log('Seeding database...');

// --- Bathinda ---
const cityResult = db
  .prepare('INSERT INTO cities (name) VALUES (?)')
  .run('Bathinda');
const bathindaId = cityResult.lastInsertRowid;

// --- Ganpati Enclave (has one example plot) ---
const ganpatiId = db
  .prepare('INSERT INTO areas (city_id, name) VALUES (?, ?)')
  .run(bathindaId, 'Ganpati Enclave').lastInsertRowid;

// --- Park Panorama (empty for now) ---
db.prepare('INSERT INTO areas (city_id, name) VALUES (?, ?)').run(
  bathindaId,
  'Park Panorama'
);

// Example plot: 45 x 50 ft = 250 gaj (45*50=2250 sq ft, 2250/9 = 250 gaj)
const dealId = db
  .prepare(
    `INSERT INTO deals
      (area_id, plot_no, width_ft, length_ft, gaj, status,
       asking_price, expected_price, seller_name, seller_phone, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  .run(
    ganpatiId,
    'Plot 12',
    45,
    50,
    250,
    'available',
    5200000, // asking ₹52 L
    5000000, // expected ₹50 L
    'Gurpreet Singh',
    '9876543210',
    'Corner plot, park facing. Clear title.'
  ).lastInsertRowid;

// One interested buyer on that plot
db.prepare(
  `INSERT INTO buyers (deal_id, name, phone, offer_amount, note)
   VALUES (?, ?, ?, ?, ?)`
).run(dealId, 'Rajesh Kumar', '9988776655', 4800000, 'Wants to close fast, paying cash.');

console.log('Done! Seeded Bathinda with Ganpati Enclave (1 plot) and Park Panorama (empty).');
