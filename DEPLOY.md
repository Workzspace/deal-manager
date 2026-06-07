# 🚀 Deploying Property Ledger (Vercel + Supabase)

This guide takes you from code on your computer to a live app your family can
open on any phone — with all data synced through one shared database.

**The setup:**
- **Vercel** hosts the app (the React frontend *and* the API).
- **Supabase** is the database (free Postgres) where all your deals live, so
  every phone sees the same data.

You'll do this once. It takes about 15 minutes. Everything is free.

> ℹ️ I can prepare all the code, but the steps below need *your* accounts
> (Supabase + Vercel + GitHub). Just follow along — each step is spelled out.

---

## Step 1 — Create the database (Supabase)

1. Go to **https://supabase.com** and sign up (use "Continue with GitHub" — easiest).
2. Click **New project**.
   - Name: `property-ledger`
   - Database Password: **make one up and save it somewhere** — you'll need it in a second.
   - Region: pick the closest (e.g. *Mumbai / South Asia*).
3. Wait ~2 minutes for it to finish setting up.
4. Click **Connect** (top of the page) → **Connection string** → **URI**.
5. Choose the **Session pooler** tab and copy that URI. It looks like:
   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the database password you made in step 2.
   **Keep this final string handy** — this is your `DATABASE_URL`.

---

## Step 2 — Put your starter data in the database

Run the seed once, pointed at Supabase, so the app isn't empty.

On your computer, in the project's `server` folder, create/edit `server/.env`:
```
DATABASE_URL=postgresql://postgres.abcdefgh:YourPassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
JWT_SECRET=make-this-a-long-random-string
APP_PASSWORD=2561
```
Then run:
```bash
npm run seed
```
You should see: *"Done! Seeded Bathinda…"*. (The tables are created automatically.)

> If you'd rather not seed, you can skip this — the app creates its tables on
> first use and you can add cities/plots by hand.

---

## Step 3 — Push the code to GitHub

1. Create a new **empty** repository on https://github.com (e.g. `property-ledger`).
2. In the project folder, run:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/property-ledger.git
   git branch -M main
   git push -u origin main
   ```
   (`.env` is git-ignored, so your password is **not** uploaded — good.)

---

## Step 4 — Deploy on Vercel

1. Go to **https://vercel.com** and sign up with GitHub.
2. Click **Add New… → Project**, and **Import** your `property-ledger` repo.
3. Vercel auto-detects the settings from `vercel.json` — **don't change** the
   build settings.
4. Before clicking Deploy, open **Environment Variables** and add these three
   (exactly the same values as your `server/.env`):

   | Name           | Value                                             |
   | -------------- | ------------------------------------------------- |
   | `DATABASE_URL` | your Supabase Session-pooler URI (with password)  |
   | `JWT_SECRET`   | a long random string                              |
   | `APP_PASSWORD` | `2561` (your login PIN)                            |

5. Click **Deploy**. Wait ~1 minute.
6. Vercel gives you a URL like `https://property-ledger.vercel.app`. Open it!

---

## Step 5 — Install it on your phone (PWA)

1. Open your Vercel URL in the phone's browser (Chrome on Android, Safari on iPhone).
2. **Android/Chrome:** tap the **"⤓ Install app"** button that appears, or use
   the browser menu → *Install app / Add to Home screen*.
3. **iPhone/Safari:** tap the **Share** button → **Add to Home Screen**.

It now opens like a real app — full screen, its own icon, and it remembers you're
logged in. Everyone in the family installs it the same way and shares the same data.

---

## Updating the app later

Any time you change the code:
```bash
git add -A
git commit -m "describe your change"
git push
```
Vercel automatically rebuilds and redeploys within a minute. ✨

---

## Troubleshooting

- **"Something went wrong on the server"** → almost always a wrong `DATABASE_URL`.
  Re-check the password in the string and that you used the **Session pooler** URI.
- **Login fails** → make sure `APP_PASSWORD` in Vercel matches the PIN you type (`2561`).
- **Data not showing** → did you run the seed (Step 2), or add data in the app?
- **Changed env vars?** → Vercel needs a redeploy to pick them up
  (Deployments → … → Redeploy).
