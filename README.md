# MechVerse

Study hub, grade planner and lab companion for mechanical engineering students.
Plain HTML/CSS/JS frontend + Node/Express API. Data lives in **Postgres (Neon)**;
notes/PYQs/lab files live on **Google Drive** (the admin pastes share links).
Deployed on **Vercel**.

## Project layout

```
api/index.js          Vercel entry point (wraps the Express app)
vercel.json           Vercel settings (static site in /frontend, /api -> Express)
frontend/             the website (served as-is)
backend/src/          Express app, routes, controllers
backend/scripts/      one-time setup + migration scripts
tools/                Google Drive helper script
```

## Run locally

```
npm install
copy backend\.env.example backend\.env      (Mac/Linux: cp backend/.env.example backend/.env)
# fill in backend/.env  (DATABASE_URL, JWT_SECRET, ADMIN_EMAILS, ...)
npm run db:init         # creates the tables in Neon (once)
npm run dev             # http://localhost:4000  (site + API together)
```

## One-time data migration (from the old SQLite version)

```
npm run migrate:data                 # copies users, subjects, resources ... into Neon
# then Drive links: see tools/list-drive-files.gs, save drive-files.csv in this folder
npm run migrate:links                # preview
npm run migrate:links -- --apply     # save
```

## Environment variables

See `backend/.env.example`. Never commit `.env`.
