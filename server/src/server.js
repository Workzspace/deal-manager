// Local development server — starts the Express app and listens on a port.
// (On Vercel the app is run as a serverless function instead; see /api.)
import 'dotenv/config';
import app from './app.js';
import { init } from './db.js';

const PORT = process.env.PORT || 4000;

// Create tables on startup, then start listening.
init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Property Ledger API running on http://localhost:${PORT}`);
      if (!process.env.DATABASE_URL) {
        console.log('(Using a temporary in-memory database — set DATABASE_URL to save data.)');
      }
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
