# 🏘️ Property Ledger

A mobile-first web app for managing a family real estate business. Track plots
across cities and colonies, follow each deal from *Available* to *Sold*, keep
seller and buyer details in one place, and see your portfolio value at a glance.

Built phone-first (it works great on a phone), but it scales up cleanly to
tablet and desktop. Data lives in a real database behind a REST API, so several
phones in the family can use it and stay in sync.

---

## ✨ Features

- **City → Area → Plot hierarchy** (e.g. Bathinda → Ganpati Enclave → Plot 12)
- **Colour-coded deal cards** by status: Available, In Negotiation, On Hold, Sold·Closed
- **Plot sizes** in feet (width × length) with **automatic gaj calculation**
  (1 gaj = 1 sq yard = 9 sq ft) — or type the gaj yourself. Shows dimensions, gaj, and total sq ft.
- **Asking & expected prices** in Indian format (₹52 L, ₹5.2 Cr)
- **Seller + multiple interested buyers** (name, phone, offer, note)
- **Tappable phone links** — tap a number to call
- **Per-area stats**: total plots, available, negotiating, closed, and active portfolio value
- **Filter by status** and **global search** across plots, sellers, buyers, and areas
- **Full create / edit / delete** for cities, areas, and deals
- **Bottom-sheet forms** that slide up, big 44px+ tap targets, sticky search bar
- **Simple shared-password login** so only the business can get in
- **Installable PWA** — add it to your phone's home screen; works offline once loaded

---

## 🧱 Tech Stack

| Part      | Technology                                              |
| --------- | ------------------------------------------------------- |
| Frontend  | React + TypeScript + Vite                               |
| Backend   | Node.js + Express (REST API)                            |
| Database  | SQLite via Node's **built-in** `node:sqlite` (no native build needed) |
| Auth      | Shared password → JWT token                             |
| PWA       | Web manifest + service worker                           |

> **Why built-in SQLite?** It needs no compilation, so there's nothing to break
> during install on Windows/Mac/Linux. The whole database is one file:
> `server/data.db`.

---

## 📁 Folder Structure

```
Dream Estate/
├── server/                 # Backend REST API
│   ├── src/
│   │   ├── server.js       # Express app + all API routes
│   │   ├── db.js           # Database connection + table schema
│   │   ├── auth.js         # Login + auth middleware
│   │   └── seed.js         # Fills the DB with starter data
│   ├── .env.example        # Copy to .env and set your password/secret
│   └── package.json
│
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/          # Cities, Areas, Deals, Search, Login
│   │   ├── components/     # DealCard, DealForm, BottomSheet, Header, …
│   │   ├── api.ts          # Talks to the backend
│   │   ├── format.ts       # Indian price + gaj formatting
│   │   ├── auth.tsx        # Login state
│   │   └── styles.css      # Mobile-first styles
│   ├── public/             # manifest, service worker, icons
│   └── package.json
│
├── package.json            # Convenience scripts to run everything
└── README.md
```

---

## 🚀 Running It Locally

You'll need **Node.js 22.5 or newer** (Node 24 recommended) because the app uses
the built-in SQLite module. Check with `node --version`.

### 1. Install dependencies

From the project root (`Dream Estate/`):

```bash
npm run install:all
```

(That installs both `server` and `client`. Or run `npm install` inside each folder.)

### 2. Set your password (optional but recommended)

```bash
cd server
copy .env.example .env      # Windows
# cp .env.example .env       # Mac/Linux
```

Then open `server/.env` and change `APP_PASSWORD` and `JWT_SECRET`.
If you skip this, the default password is **`family123`**.

### 3. Add the starter data

```bash
npm run seed
```

This creates **Bathinda** with **Ganpati Enclave** (one example plot,
45×50 ft = 250 gaj) and an empty **Park Panorama**.

### 4. Start the two servers (two terminals)

**Terminal 1 — backend (port 4000):**
```bash
npm run server
```

**Terminal 2 — frontend (port 5173):**
```bash
npm run client
```

### 5. Open the app

Go to **http://localhost:5173** and log in with your password
(default `family123`).

> The frontend automatically forwards `/api` requests to the backend, so you
> only ever open the `5173` address.

---

## 📱 Using It On Your Phone (same Wi-Fi)

1. Find your computer's local IP (e.g. `192.168.1.5`).
2. Start the frontend so it's reachable on the network:
   ```bash
   npm run dev --prefix client -- --host
   ```
3. On your phone's browser, open `http://YOUR_IP:5173`.
4. Use the browser menu → **Add to Home Screen** to install it like an app.

> For real multi-phone use across the internet, deploy the backend (e.g. a small
> VPS or a Node host) and the frontend (e.g. Vercel), and point the frontend's
> `/api` proxy / fetch base at your deployed backend URL.

---

## 🏗️ Building for Production

```bash
npm run build
```

This creates an optimised frontend in `client/dist/`. Serve those static files
from any host, and run the `server/` backend wherever it can reach the database.

---

## 🗂️ API Quick Reference

All routes (except `/api/login` and `/api/health`) require a
`Authorization: Bearer <token>` header.

| Method | Route                         | What it does               |
| ------ | ----------------------------- | -------------------------- |
| POST   | `/api/login`                  | Get a token from a password|
| GET    | `/api/cities`                 | List cities                |
| POST   | `/api/cities`                 | Create a city              |
| PUT    | `/api/cities/:id`             | Rename a city              |
| DELETE | `/api/cities/:id`             | Delete a city (+ contents) |
| GET    | `/api/cities/:cityId/areas`   | List areas with stats      |
| POST   | `/api/cities/:cityId/areas`   | Create an area             |
| PUT    | `/api/areas/:id`              | Rename an area             |
| DELETE | `/api/areas/:id`              | Delete an area (+ deals)   |
| GET    | `/api/areas/:areaId/deals`    | List deals (`?status=` filter) |
| POST   | `/api/areas/:areaId/deals`    | Create a deal              |
| PUT    | `/api/deals/:id`              | Update a deal              |
| DELETE | `/api/deals/:id`              | Delete a deal              |
| GET    | `/api/search?q=`              | Search across everything   |

---

## 🔐 A Note On Auth

This uses one shared password for the whole business — simple and enough for a
family team. The password is never stored in plain text (it's hashed), and the
login token expires after 30 days. For stronger security later, you can swap in
individual user accounts.

---

Made for managing real plots in Punjab, India. 🇮🇳
