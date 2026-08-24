# GymBro

Web app to track workouts: routines, exercises, sessions with a live timer, history, and body weight tracking.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- SQLite (`node:sqlite`, data stored in `.data/`)
- Custom cookie-based session auth (scrypt)

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000, create an account, and start training.

## Structure

- `app/(app)/` — main pages (routines, exercises, history, weight)
- `lib/actions/` — server actions
- `lib/db.ts` — SQLite access
- `components/` — UI components
