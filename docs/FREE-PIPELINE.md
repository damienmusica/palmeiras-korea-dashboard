# 무료 데이터 파이프라인 (Free $0 Data Pipeline)

This project keeps real data fresh **with no paid services, no database, and no
always-on server** — a "$0 live pipeline". This doc is the source of truth so the
design isn't forgotten.

## How it works

```
GitHub Actions (free cron, every ~30 min)
   └─ node scripts/ingest.mjs        # keyless: Google News RSS (+ free MyMemory MT)
        → writes data/*.json (normalized snapshot)
            → commits data/ back to the repo
                → host (Vercel/Cloudflare Pages) auto-redeploys
                    → site reads the committed JSON at build/request time
                        (src/lib/data/snapshot.ts) — 0 per-request API calls
```

The committed JSON file **is the database**. No KV, no Postgres, no server.

## Pieces

| File | Role |
| --- | --- |
| `scripts/ingest.mjs` | Keyless fetch → normalize → write `data/*.json`. Never throws (logs + exits 0 so a flaky feed never breaks the cron). |
| `data/news.json` | Committed snapshot: `{ origin, source, fetchedAt, items[] }`. |
| `src/lib/data/snapshot.ts` | Server-only reader. Missing/invalid → `null` → adapters fall back to seed. `SNAPSHOT_DIR` env overrides the dir (tests use this). |
| `src/lib/adapters/index.ts` `getNews` | Precedence: **snapshot → request-time RSS (`NEWS_RSS_FEEDS`) → seed**. |
| `.github/workflows/refresh-data.yml` | Cron + manual dispatch; runs ingest; commits changed `data/`. `permissions: contents: write`. |

## What's free / keyless today

- **News**: Google News RSS (`q=Palmeiras&hl=pt-BR`) — keyless, effectively unlimited.
- **Translation**: MyMemory API — free, keyless, best-effort PT→KO of the headline.
  Failures fall back to the original title; translated items are tagged `자동번역`.
- **Reliability**: classified by the app at read time (`enrichNews` → `classifyReliability`),
  not frozen in the snapshot (single source of truth).

## Run it locally

```bash
npm run ingest      # regenerates data/news.json from live Google News
npm run dev         # the site reads the snapshot
DISABLE_MT=1 npm run ingest   # skip machine translation (faster / offline-ish)
```

## Deploy (all free tiers)

1. Push this repo to GitHub.
2. The `Refresh data` Action runs on schedule automatically (no secrets needed).
   You can also trigger it manually from the Actions tab (workflow_dispatch).
3. Connect the repo to **Vercel Hobby** or **Cloudflare Pages** (free). Each data
   commit triggers a redeploy with fresh content.

> GitHub cron is best-effort; minimum effective interval ~5 min, runs can be
> delayed under load. 30 min is a good free cadence for news.

## Next phase — sports data (matches / standings / squad)

Currently sports uses clearly-labeled **seed** data. To make it live for free:

- Add `API_FOOTBALL_KEY` (free 100 req/day) or `THESPORTSDB_KEY` as a **GitHub
  repository secret**. The workflow already passes them through as env.
- Implement the `ingestSports()` extension point in `scripts/ingest.mjs`: fetch →
  normalize into the domain `Match[]` / `Standings` / `Squad` shapes → write
  `data/matches.json`, `data/standings.json`, `data/squad.json` with the same
  `{ origin, source, fetchedAt, ... }` envelope.
- Extend `src/lib/data/snapshot.ts` with `readMatchesSnapshot()` etc. and add the
  snapshot precedence to `getMatches`/`getStandings`/`getSquad` (mirrors `getNews`).
- 100 req/day is plenty if you fetch a few times/day and cache; do live-score
  polling (during match windows only) from the client against a free endpoint.

## Security notes baked in

- Ingest sanitizes link URLs to http(s) only (mirrors `src/lib/security/url.ts`),
  with fetch timeout + 2MB response cap.
- The app re-sanitizes any external href at render time (defense in depth).
