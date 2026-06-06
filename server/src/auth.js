// Simple shared-password auth.
//
// How it works:
//   1. The family enters one shared password (set in .env as APP_PASSWORD).
//   2. If correct, the server gives back a token (a signed string).
//   3. The app sends that token on every request in the Authorization header.
//   4. The "requireAuth" middleware checks the token before allowing access.
//
// This is intentionally simple — it keeps strangers out without the complexity
// of full user accounts, which the family business doesn't need yet.
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const APP_PASSWORD = process.env.APP_PASSWORD || 'family123';

// Hash the password once at startup so we never compare plain text.
const passwordHash = bcrypt.hashSync(APP_PASSWORD, 10);

// POST /api/login  { password }
export function login(req, res) {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  const ok = bcrypt.compareSync(password, passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Wrong password.' });
  }
  // Token is valid for 30 days so phones don't have to log in constantly.
  const token = jwt.sign({ role: 'business' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
}

// Middleware: blocks any request that doesn't carry a valid token.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}
