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

## What's live today

| Data | Source | Key? | Currency |
| --- | --- | --- | --- |
| **News** | Google News RSS (football-biased query) | keyless | live |
| **KO summary / 왜 중요한가 / 팬 한 줄** | LLM via `LLM_API_KEY` (Cerebras GLM-4.7), MyMemory fallback | free key | live |
| **Standings** | **ESPN public JSON** (`soccer/bra.1/standings`) | keyless | **CURRENT season** |
| **Matches** (fixtures+results) | **ESPN public JSON** (team schedule + scoreboard window) | keyless | **CURRENT season** |
| **Squad photos** | API-Football current roster | free key | current |

- ESPN breaks the API-Football free-tier season lock: standings + fixtures are the
  **current** season, keyless. (API-Football free blocks the current season, so it's
  used only for the squad photos.)
- ESPN JSON is **unofficial/undocumented** → best-effort, with in-app seed fallback
  if it changes/breaks. Team names are mapped to Korean in `scripts/ingest.mjs`.
- News **reliability** is classified by the app at read time (`enrichNews` →
  `classifyReliability`), not frozen in the snapshot.
- LLM is **provider-agnostic** (OpenAI-compatible): swap Cerebras for OpenRouter
  (DeepSeek V3) / Groq just by changing `LLM_BASE_URL` + `LLM_MODEL`. Calls are
  **batched + URL-cached** (only new headlines hit the LLM) → free tiers suffice.

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

## Adapter precedence

- `getNews`      — news.json snapshot → request-time RSS → seed
- `getStandings` — standings.json snapshot (ESPN) → seed
- `getMatches`   — matches.json snapshot (ESPN) → seed
- `getSquad`     — seed roster + real API-Football photos merged by name

## Possible next steps

- **Scorer/assist leaders**: ESPN standings doesn't include them (cards show a
  graceful "데이터 없음"). A free leaders source could fill `topScorers`/`topAssisters`.
- **Continental fixtures**: add Libertadores/Copa do Brasil ESPN slugs alongside
  `bra.1` and map their `CompetitionRef`.
- **Live scores**: poll ESPN scoreboard from the client only during match windows.

## Security notes baked in

- Ingest sanitizes link URLs to http(s) only (mirrors `src/lib/security/url.ts`),
  with fetch timeout + 2MB response cap.
- The app re-sanitizes any external href at render time (defense in depth).
