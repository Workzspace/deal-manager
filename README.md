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
| Database  | PostgreSQL (hosted on **Supabase**) via `pg`            |
| Hosting   | **Vercel** (frontend + API as serverless functions)    |
| Auth      | Shared 4-digit PIN → JWT token                          |
| PWA       | Web manifest + service worker + install button          |

> **Database:** All data lives in one hosted Postgres database so every phone
> stays in sync. In production set `DATABASE_URL` to your Supabase connection
> string. For quick local testing with **no setup**, the server falls back to an
> in-memory database (data is not saved) — see below.
>
> 👉 To put it online, follow **[DEPLOY.md](DEPLOY.md)**.

---

## 📁 Folder Structure

```
Dream Estate/
├── api/
│   └── [...path].js        # Vercel serverless entry (re-exports the Express app)
├── server/                 # Backend REST API
│   ├── src/
│   │   ├── app.js          # Express app + all API routes (shared by local + Vercel)
│   │   ├── server.js       # Local dev server (starts app.js on a port)
│   │   ├── db.js           # Postgres connection + table schema
│   │   ├── auth.js         # Login (PIN) + auth middleware
│   │   └── seed.js         # Fills the DB with starter data
│   ├── .env.example        # Copy to .env and set DATABASE_URL / PIN / secret
│   └── package.json
│
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/          # Cities, Areas, Deals, Search, Login
│   │   ├── components/     # DealCard, DealForm, BottomSheet, InstallPrompt, …
│   │   ├── api.ts          # Talks to the backend
│   │   ├── format.ts       # Indian price + gaj formatting
│   │   ├── auth.tsx        # Login state
│   │   └── styles.css      # Mobile-first styles
│   ├── public/             # manifest, service worker, icons
│   └── package.json
│
├── vercel.json             # Vercel build + routing config
├── DEPLOY.md               # Step-by-step deploy guide
├── package.json            # Convenience scripts + serverless deps
└── README.md
```

---

## 🚀 Running It Locally

You'll need **Node.js 18 or newer**. Check with `node --version`.

### 1. Install dependencies

From the project root (`Dream Estate/`):

```bash
npm run install:all
```

(Installs the root, `server`, and `client` packages.)

### 2. Set your PIN & secret (optional)

```bash
cd server
copy .env.example .env      # Windows
# cp .env.example .env       # Mac/Linux
```

Then open `server/.env`:
- `APP_PASSWORD` — the 4-digit login PIN (default **`2561`**)
- `JWT_SECRET` — any long random string
- `DATABASE_URL` — *(optional locally)* your Supabase connection string.
  **Leave it blank to run on a temporary in-memory database** (great for trying
  things out — but the data resets each restart). Set it to save & sync real data.

### 3. Add starter data (only if using a real DATABASE_URL)

```bash
npm run seed
```

This creates **Bathinda** with **Ganpati Enclave** (one example plot,
45×50 ft = 250 gaj) and an empty **Park Panorama**.

> Skipping the database entirely? The in-memory mode still works — just add a
> city/area/plot in the app to try it out.

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

Go to **http://localhost:5173** and log in with your PIN (default `2561`).

> The frontend automatically forwards `/api` requests to the backend, so you
> only ever open the `5173` address.

---

## 🌍 Deploy It (go live for the whole family)

See **[DEPLOY.md](DEPLOY.md)** for a 15-minute, beginner-friendly walkthrough:
create a free Supabase database, push to GitHub, import into Vercel, and install
it on every phone as an app. All free.

---

## 🏗️ Building the Frontend

```bash
npm run build
```

This creates an optimised frontend in `client/dist/`. (Vercel runs this for you
automatically on deploy.)

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
