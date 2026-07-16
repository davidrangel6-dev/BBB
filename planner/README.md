# Planner

A personal planner app split into `Me`, `AFL`, `BBB`, and `Mason` categories,
covering tasks, calendar events, goals, and notes.

This is a separate project from the Bluebonnet Boot Co. mockup app at the
repo root — it lives entirely under `/planner` and has its own dependencies.

## Layout

- `client/` — React + Vite + Tailwind CSS, mobile-first shell with a bottom
  tab bar (Dashboard, Tasks, Calendar, Goals, Notes).
- `server/` — Node.js + Express REST API on port 3001, backed by SQLite
  (`better-sqlite3`). Schema is created automatically on server start if it
  doesn't exist yet, and the four categories are seeded on first run.
- `data/` — holds `planner.db` (git-ignored, created automatically).

## Setup

```bash
cd planner
npm run install:all   # installs deps for the root, client, and server
npm run dev            # starts server (3001) and client (5173) together
```

Then open the client's dev server URL. It proxies `/api/*` requests to the
Express server, so the same origin works from a phone on your home network
too (the server binds to `0.0.0.0`).

## API

- `GET /api/categories`
- `GET/POST/PUT/DELETE /api/tasks`
- `GET/POST/PUT/DELETE /api/events`
- `GET/POST/PUT/DELETE /api/goals`
- `GET/POST/PUT/DELETE /api/notes`

All endpoints return JSON. Create/update endpoints return the created or
updated row.
