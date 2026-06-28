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
node scripts/ingest.mjs --live  # match-window mode (matches + standings only)
```

## Live (match-window) refresh

`--live` (or `INGEST_MODE=live`) is a **quota-thrifty** mode for near-real-time
scores. It refreshes **only `matches.json` + `standings.json`** (news/squad don't
change mid-match and squad needs the API key) and **self-limits to the match
window**: it reads the last `matches.json`, and if `now` isn't within
`kickoff − 20min … kickoff + 160min` of a Palmeiras game, it exits immediately
having spent **zero** ESPN calls. So a 5-minute cron is safe — it only does work
while a game is actually on. During a live match it attaches the live scoreline
and re-fetches goals/scorers each tick (finished matches keep using the cache).

To enable it, add a SECOND scheduled workflow on a ~5-minute cron that runs
`node scripts/ingest.mjs --live` and commits changed `data/` (same shape as the
30-min `refresh-data.yml`, just a tighter cron + the `--live` flag). **Keep the
regular 30-min full run for news/squad.** (The `.github` workflow YAML is added
by the repo owner — it is intentionally not committed by the assistant.)

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
- `getSquad`     — squad.json (API-Football roster + ESPN stats) → seed; every
  entry passes the **data-integrity gate** (`src/lib/data/squad-integrity.ts`):
  cross-verify ESPN ⟷ API-Football, apply sanity rules + a manual allow/blocklist
  (`src/lib/teams/palmeiras-roster-overrides.ts`), drop phantoms, flag unverified.

## Possible next steps

- **Scorer/assist leaders**: ESPN standings doesn't include them (cards show a
  graceful "데이터 없음"). A free leaders source could fill `topScorers`/`topAssisters`.
- **Continental fixtures**: add Libertadores/Copa do Brasil ESPN slugs alongside
  `bra.1` and map their `CompetitionRef`.
- **Live scores**: ✅ server-side via `--live` match-window mode (see above). A
  future option is a client-side poll for sub-minute updates during a game.

## Security notes baked in

- Ingest sanitizes link URLs to http(s) only (mirrors `src/lib/security/url.ts`),
  with fetch timeout + 2MB response cap.
- The app re-sanitizes any external href at render time (defense in depth).

## Reliability safety net

The ingest never throws (a flaky feed mustn't break the cron), so a single feed
can fail *silently* for hours while the cron stays green with stale data. Three
layers turn that silent rot into a loud, free alert. See the
[maintenance runbook](./MAINTENANCE.md) for how to respond.

| Layer | Catches | Where |
| --- | --- | --- |
| `npm run check` (`scripts/check-freshness.mjs`) | a feed silently failing → snapshot stale / empty / schema drift | CI step **right after ingest**; exits non-zero → red run → GitHub failure email |
| read-side guard (`snapshot.ts` `hasFields`) | a present-but-malformed snapshot | runtime → app falls back to seed instead of rendering garbage |
| **dead-man's-switch** (optional, free) | the cron **not running at all** | external monitor — the in-run check can't catch this |

### Apply: add the check + heartbeat to the workflow

The workflow file lives under `.github/` and is **owner-applied** (never in a
code PR). Add a check step (and optional heartbeat) to
`.github/workflows/refresh-data.yml`, after the existing "Commit updated
snapshot" step:

```yaml
      # Fail loudly if any snapshot is stale/empty/malformed (silent feed rot).
      - name: Check snapshot freshness
        run: npm run check

      # Optional dead-man's-switch: ping a free monitor on success. If these
      # pings stop (cron disabled / quota / repo inactive), the monitor alerts
      # you. Set HEALTHCHECK_URL as a repo secret (e.g. from healthchecks.io —
      # free, no card; the ping URL is the only secret). The `|| true` keeps a
      # missing/blocked monitor from failing the run.
      - name: Heartbeat (dead-man's-switch)
        if: ${{ success() && env.HEALTHCHECK_URL != '' }}
        env:
          HEALTHCHECK_URL: ${{ secrets.HEALTHCHECK_URL }}
        run: curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL" || true
```

Notes:
- `npm run check` needs `node_modules` only for nothing — it's dependency-free
  (pure Node + `data/*.json`), so it runs even before `npm ci`. If you prefer,
  run it with `node scripts/check-freshness.mjs`.
- GitHub emails the repo owner automatically on a failed scheduled run — no extra
  secret needed for that baseline alert. The heartbeat only adds "cron is fully
  dead" detection.
- Thresholds (per-feed `maxAgeMin`) live in `SNAPSHOT_POLICY` in
  `scripts/check-freshness.mjs`; tune if the cron cadence changes.
