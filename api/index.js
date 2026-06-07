// Vercel serverless entry point.
//
// All requests to /api/* are routed here by a rewrite in vercel.json. An
// Express app is itself a (req, res) handler, so we just re-export our app —
// Express then matches the original path (e.g. /api/cities/1/areas) internally.
// Keeping the routes in ../server/src/app.js means local dev and production
// run the exact same code.
export { default } from '../server/src/app.js';
