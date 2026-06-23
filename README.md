# 파우메이라스 코리아 대시보드 (Palmeiras Korea Dashboard)

> **파우메이라스를 한국어로 이해하는 가장 빠른 방법.**
> A Korean-first **fan intelligence layer** for Sociedade Esportiva Palmeiras.

This app is **not** trying to beat Sofascore, FotMob, Flashscore, Transfermarkt,
or the official Palmeiras app at raw data or live scores. It sits **above** those
sources as a bridge for Korean fans — a **translator, curator, explainer, and
contextual guide**. The priority is **interpretation, not data display**: not
just _what happened_, but _why it matters_.

---

## ✨ What it does

| Area | Korean fan value |
| --- | --- |
| **홈 — 오늘의 5분 파우메이라스 브리핑** | A scannable "5-minute briefing": what changed, next match & why it matters, last result reading, one player to watch, a storyline, and one beginner explainer. |
| **뉴스 (News)** | Every card preserves the original headline/source/time/language, adds a Korean summary, **왜 중요한가** (why it matters), a **팬 한 줄** take, and a **source-reliability label** (공식 / 신뢰 매체 / 루머 / 재가공 / 미상). Links out — never copies full articles. Loading / error / empty states + refresh. |
| **매치 센터 (Fixtures/Results)** | Each match shows competition, opponent, home/away, venue, **kickoff in KST and Brazil time**, score/status, plus **이 경기가 중요한 이유**, **한국 팬 관전 포인트**, and **결과 해석** for finished games. Includes a beginner primer on Brazilian competitions. |
| **스쿼드 + 선수 상세 (Squad/Player)** | Players grouped by GK/DF/MF/FW + coach. Each carries Korean interpretation: 역할, 플레이 스타일, 왜 주목해야 하나, 내러티브, 느슨한 비유, 이름/발음 메모, season stats. Unknown fields are clearly labeled. |
| **순위 · 기록 (Standings)** | League table with the tracked team highlighted, qualification-zone hints, top scorers/assisters, and a competition explainer. |
| **팬 가이드 (Guide)** | Starter guide, club identity, stadium, rivalries (Corinthians derby context), Brazilian football calendar & competition hierarchy, a searchable **glossary**, name/pronunciation notes, and official links. |

Everything that is interpretive is labeled **에디토리얼/자동 해설/기본 해설**, and every
data surface carries a **freshness/source badge** so nothing looks more "live"
than it is.

---

## 🚀 Setup & run

Requirements: **Node ≥ 18.18** (built/tested on Node 24), npm.

```bash
npm install
npm run dev          # http://localhost:3000  (development)
```

Production:

```bash
npm run build
npm run start        # serves the optimized build
```

### Exact local run command

```bash
npm install && npm run dev
```

Then open **http://localhost:3000**.

---

## 🧪 Quality scripts

```bash
npm run format       # prettier --write
npm run format:check # prettier --check
npm run lint         # next lint (ESLint)
npm run typecheck    # tsc --noEmit
npm run test         # vitest (unit tests)
npm run build        # next production build
npm run verify       # format:check + lint + typecheck + test + build
npm run ingest       # refresh live data snapshot (data/news.json) — keyless
```

## 🆓 Live data, for $0 (no DB, no server)

A **free, keyless-first pipeline** keeps real data fresh: GitHub Actions runs
`scripts/ingest.mjs` on a cron → writes `data/*.json` → commits → the host
redeploys → the site reads the committed snapshots (`src/lib/data/snapshot.ts`),
so there are **zero per-request API calls**. Live today:

- **News** — Google News RSS (keyless), with Korean summary + "왜 중요한가" + fan-take
  from a **free LLM** (Cerebras **GLM-4.7**, OpenAI-compatible/provider-swappable;
  MyMemory fallback). Batched + URL-cached.
- **Standings & Matches** — **ESPN public JSON** (keyless, **current 2026 season**).
  This routes around API-Football's free-tier season lock.
- **Squad photos** — real current roster photos from API-Football, merged onto the
  curated Korean squad by name.

Everything degrades to clearly-labeled seed data if a source is unreachable. Full
design + deploy steps: **[docs/FREE-PIPELINE.md](docs/FREE-PIPELINE.md)**.
Roadmap & backlog: **[docs/ROADMAP.md](docs/ROADMAP.md)**.

```bash
npm run ingest       # generate/refresh data/news.json from live Google News
DISABLE_MT=1 npm run ingest   # skip machine translation
```

---

## 🔐 Environment variables (all optional)

**The app runs fully without any keys**, using realistic, clearly-labeled
seed/mock data. Copy `.env.example` → `.env.local` to opt into live sources.

| Variable | Purpose | Without it |
| --- | --- | --- |
| `API_FOOTBALL_KEY` | Sports data (fixtures/standings/squad) via API-Football. | Labeled seed data is used. |
| `API_FOOTBALL_HOST` | API host override. | n/a |
| `NEWS_RSS_FEEDS` | Comma-separated public RSS/Atom feed URLs about Palmeiras. | Seed news is used. |
| `NEWS_API_KEY` | Optional NewsAPI.org key (alternative news source hook). | Seed news is used. |
| `DATA_CACHE_TTL_SECONDS` | Server cache TTL (default `300`). | Defaults to 5 minutes. |

No secrets are hardcoded. Live network paths use **documented APIs / public
RSS** that the operator explicitly opts into — there is no scraping of
disallowed sites, and full copyrighted article bodies are never copied.

### What improves after adding keys

- `NEWS_RSS_FEEDS` → real headlines are fetched, normalized, deduped, sorted,
  auto-classified for reliability, and enriched with Korean context. The badge
  switches from **시드 데이터** to **RSS 라이브**.
- `API_FOOTBALL_KEY` → the football adapter is wired to detect the key and is
  the single place to map live fixtures/standings into the typed domain model.
  (For safety the MVP keeps seed rendering until a full field mapping is enabled,
  and the UI clearly shows a "소스 불가 · 시드 데이터" fallback badge in that state.)

---

## 🗂️ Data source strategy

```
UI  ──►  interpretation layer  ──►  adapters (DataResult<T>)  ──►  source
        (Korean fan context)        live → cache → seed fallback
```

- **`DataResult<T>`** wraps every adapter response with `origin`
  (`live`/`api`/`rss`/`cache`/`seed`/`mock`/`manual`/`editorial`/`unavailable`),
  `source`, `fetchedAt`, `fellBack`, and an optional `note`. The
  `FreshnessBadge` renders this everywhere.
- **Adapters** (`src/lib/adapters`) attempt a live source only when its env var
  is set, then fall back to **clearly-labeled** seed data on any error.
- **Caching** (`src/lib/adapters/cache.ts`) is a small TTL in-memory cache so we
  don't hammer upstream APIs; swappable for Redis/KV later.
- **Interpretation layer** (`src/lib/interpret`) turns raw data into Korean fan
  explanations — match insights, player insights, competition explainers, news
  reliability + "why it matters", and the home briefing. All editorial/seed and
  labeled as such; it never fabricates precise factual claims.

---

## 🧱 Project structure

```
src/
  app/                         # Next.js App Router pages
    page.tsx                   # Home: 5-minute briefing + snapshot + matches
    news/ | squad/ | squad/[id]/ | fixtures/ | standings/ | guide/
    api/news/route.ts          # News API (returns DataResult; ?refresh=1)
    layout.tsx · not-found.tsx · globals.css
  components/
    home/ (Briefing, ClubHero, QuickStats)
    news/ (NewsCard, NewsView)   match/ (MatchCard)
    squad/ (PlayerCard, SquadView)  standings/ (StandingsTable)
    fixtures/ (FixturesView, CompetitionPrimer)  guide/ (GlossaryView)
    layout/ (SiteHeader, SiteFooter)  ui/ (badges, search, chips, insight, …)
  lib/
    domain/types.ts            # Typed domain models (incl. interpretation types)
    teams/ palmeiras.ts,index.ts  # Team config registry (multi-team ready)
    data/palmeiras-seed.ts     # Realistic, labeled seed dataset
    adapters/ index.ts,cache.ts,rss.ts   # Live/seed adapters + cache + RSS
    interpret/ briefing,matches,players,news,competitions  # Fan intelligence
    services/dashboard.ts      # Derived dashboard view-model
    format/ datetime.ts,stats.ts  # Timezone + stat formatting (unit-tested)
public/teams/palmeiras/crest.svg   # Local SVG crest (no broken images)
```

---

## 🌏 Korean-first UX notes

- Korean UI throughout, with original Portuguese/English labels preserved.
- Default timezone **Asia/Seoul (KST)**; matches also show **Brazil (BRT)**.
- Mobile-first responsive layout; Palmeiras green/white with accessible contrast.
- Semantic HTML, skip-link, visible keyboard focus, ARIA roles, `<details>` for
  no-JS collapsibles, search/filter on news, squad, fixtures, and glossary.
- Local SVG crest + `<Crest>` monogram fallback → no broken images.

> **Naming:** the UI uses **파우메이라스** (closer to the Brazilian pronunciation).
> Korean media often writes **팔메이라스** — same club. (See 팬 가이드 → 이름·발음 메모.)

---

## ➕ How to add another team later

The app is Palmeiras-only for the MVP but is structured for expansion:

1. **Add a team config** — create `src/lib/teams/<team>.ts` exporting a
   `TeamConfig` (identity, colors, crest path, competitions, rivals, glossary,
   stadium, starter guide, official links).
2. **Register it** in `src/lib/teams/index.ts` and (optionally) switch
   `ACTIVE_TEAM_ID`.
3. **Provide data** — add a seed dataset like `src/lib/data/<team>-seed.ts` and/or
   extend the adapters in `src/lib/adapters` to map a live source into the same
   typed domain models.
4. **(Optional) interpretation** — add editorial overrides in
   `src/lib/interpret/*` keyed by the new team's match/player ids. Rule-based
   fallbacks already produce sensible Korean context without them.
5. Add a crest SVG under `public/teams/<team>/`.

The UI reads only from `TeamConfig` + `DataResult<T>`, so no page/component needs
to change to support a new club, league, or national team.

---

## 🧭 Main user journey (text walkthrough)

1. Land on **홈** → read **오늘의 5분 파우메이라스 브리핑** to instantly grasp the
   current state: what changed, the next match and why it matters, how to read the
   last result, a player to watch, the live storyline, and one beginner fact.
2. Tap **다음 경기** → **매치 센터** explains the fixture's stakes (rivalry?
   table implications?), KST + Brazil kickoff, and Korean viewing points.
3. Curious about a name → **스쿼드** → a player page explains role, style, why
   fans care, and pronunciation in plain Korean.
4. New to Brazilian football → **팬 가이드** lowers the barrier: derby context,
   the competition hierarchy, and a searchable glossary.
5. Want the latest → **뉴스** gives Korean summaries with "왜 중요한가" and a
   reliability label, linking out to the original source.

---

## ⚠️ Known limitations

- **Seed data is illustrative**, not live. Without API keys, squad/fixtures/
  standings/news reflect a representative recent season and are labeled
  **시드 데이터 (mock)** in the UI.
- The **API-Football mapping is a wired stub**: the key is detected and a clear
  fallback badge is shown, but full live field mapping is left as the documented
  extension point (kept out of the MVP so the app never depends on a paid call).
- **Interpretation is editorial**, written to be accurate-in-spirit and framed as
  context; it intentionally avoids precise unverified factual claims.
- Player-level match logs aren't in the seed, so the player page shows the
  **team's** recent matches as context (clearly noted).
- No live LLM summarization is wired (no provider assumed); the architecture has
  a clear seam to add one safely behind an env key later.

---

## 📄 License / disclaimer

Unofficial fan project. Club trademarks, crests, and names belong to their
respective owners. Not affiliated with Sociedade Esportiva Palmeiras.
