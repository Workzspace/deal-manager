// Seed script: fills the database with starter data so the app isn't empty
// the first time you open it.
//
// Run it with:  npm run seed   (set DATABASE_URL first to seed your real DB)
//
// Safe to run only on an empty database — if cities already exist it skips,
// so you won't create duplicates.
import 'dotenv/config';
import { query, init } from './db.js';

async function seed() {
  await init();

  const { rows } = await query('SELECT COUNT(*)::int AS n FROM cities');
  if (rows[0].n > 0) {
    console.log('Database already has data — skipping seed.');
    return;
  }

  console.log('Seeding database...');

  // --- Bathinda ---
  const city = (await query('INSERT INTO cities (name) VALUES ($1) RETURNING id', ['Bathinda']))
    .rows[0];

  // --- Ganpati Enclave (has one example plot) ---
  const ganpati = (
    await query('INSERT INTO areas (city_id, name) VALUES ($1, $2) RETURNING id', [
      city.id,
      'Ganpati Enclave',
    ])
  ).rows[0];

  // --- Park Panorama (empty for now) ---
  await query('INSERT INTO areas (city_id, name) VALUES ($1, $2)', [city.id, 'Park Panorama']);

  // Example plot: 45 x 50 ft = 250 gaj (45*50=2250 sq ft, 2250/9 = 250 gaj)
  const deal = (
    await query(
      `INSERT INTO deals
        (area_id, plot_no, width_ft, length_ft, gaj, status,
         asking_price, expected_price, seller_name, seller_phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        ganpati.id,
        'Plot 12',
        45,
        50,
        250,
        'available',
        5200000, // asking ₹52 L
        5000000, // expected ₹50 L
        'Gurpreet Singh',
        '9876543210',
        'Corner plot, park facing. Clear title.',
      ]
    )
  ).rows[0];

  // One interested buyer on that plot
  await query(
    `INSERT INTO buyers (deal_id, name, phone, offer_amount, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [deal.id, 'Rajesh Kumar', '9988776655', 4800000, 'Wants to close fast, paying cash.']
  );

  console.log(
    'Done! Seeded Bathinda with Ganpati Enclave (1 plot) and Park Panorama (empty).'
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
