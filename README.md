# Fifa المملكة - FC Records Web

A **read-only** web dashboard for FC players stats and records, built with React + Vite + TailwindCSS + Supabase.

## Features

- 🔒 **Read-only** — no write/update/delete operations
- 📊 Live match analytics, player ratings, partnership stats, leaderboard
- 🏆 Tournament roll of honor (trophies, journeys)
- 🌍 Bilingual Arabic/English interface
- ☁️ Live data from Supabase (with seed fallback)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Build & Run

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

## Deploying to GitHub Pages

### Setup

1. Push this repository to GitHub (named `FC-record-web`)
2. Go to **Settings → Pages**
3. Source: **Deploy from a branch** → `main` (or `gh-pages` branch if using actions)
4. Save

### Deploy command

```bash
npm run deploy
```

This runs `predeploy` (builds via `tsc && vite build`) then publishes the `dist/` folder to the `gh-pages` branch using [`gh-pages`](https://github.com/tschaub/gh-pages).

> The site is hosted at: `https://awsaq.github.io/FC-record-web`

## Supabase Configuration (Read-Only)

This app connects to a Supabase project in read-only mode. Required public environment variables:

| Variable | Example |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://dgwkghpkijkpcgwnnoqu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(your project anon key)* |
| `EXPO_PUBLIC_SUPABASE_URL` | *(same as above, for shared config)* |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | *(same as above)* |

> ⚠️ These must be set in **Project Settings → Environment Variables** on Vercel/Netlify or in a `.env` file locally. Never expose a `service_role` key — the anon key is safe for read-only public access.

## Architecture

### Data Flow
```
Supabase (app_data table, read-only)
    ↓ fetch with anon key
src/lib/dataFetcher.ts — fetches latest app_data row
    ↓
src/lib/stats.ts — computes standings, ratings, partnerships
    ↓
React Components (Dashboard, Players, Matches, Trophies, Journeys)
```

### Key Files
- `index.html` — HTML entry, Arabic RTL layout
- `src/main.tsx` — React root
- `src/App.tsx` — Main app, routing, refresh logic
- `src/components/` — UI components (Dashboard, Standings, Players, Matches, Trophies, PlayerModal)
- `src/lib/stats.ts` — Business logic for computing stats
- `src/lib/supabase.ts` — Supabase client (read-only)
- `src/lib/dataFetcher.ts` — Public read of `app_data` table (no auth required for public/anon reads)
- `src/lib/initialData.ts` — Offline fallback / seed data

### Read-Only Design

The data fetcher performs an anonymous `SELECT` on the `app_data` table:

```ts
const { data, error } = await supabase
  .from('app_data')
  .select('*')
  .order('updated_at', { ascending: false })
  .limit(1);
```

No `insert`, `update`, `upsert`, or `delete` calls exist anywhere in this web project. All data is fetched and rendered only.

## License
Private — FC Record internal use.