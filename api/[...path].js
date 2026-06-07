// Vercel serverless entry point.
//
// Vercel turns this file into a function that handles every request starting
// with /api/ (the "[...path]" catch-all). An Express app is itself a
// (req, res) handler, so we just re-export our app. All the routes live in
// ../server/src/app.js so local dev and production share the exact same code.
export { default } from '../server/src/app.js';
