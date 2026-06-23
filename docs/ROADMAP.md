# 로드맵 & 백로그 (Roadmap & Backlog)

Living record so decisions aren't forgotten. Product positioning: a Korean-first
**fan intelligence layer** for Palmeiras (translate / curate / explain), not a
generic stats dashboard.

## Phased roadmap (all achievable on free tiers)

- [x] **MVP** — interpretation-first dashboard (briefing, news, squad, player,
      fixtures, standings, guide) on labeled seed data.
- [x] **Security + maintainability hardening** — see `SECURITY` section below.
- [x] **Phase 2: free data pipeline** — keyless sources → committed snapshot → site
      (see `docs/FREE-PIPELINE.md`).
- [x] **Phase 1: sports live (free)** — **ESPN public JSON** gives CURRENT-season
      standings + fixtures/results, keyless (breaks API-Football's free season lock).
      API-Football wired for real current squad photos.
- [x] **Phase 3: interpretation upgrade** — free LLM (Cerebras **GLM-4.7**,
      OpenAI-compatible, provider-swappable) for KO summaries + "왜 중요한가" + fan-take,
      batched + URL-cached. MyMemory fallback when no key.
- [ ] **PWA** — `manifest.json` + service worker + icons → installable iPhone app
      ($0), offline cache, iOS 16.4+ web push (goal/news alerts).
- [ ] **Scorer/assist leaders** + continental (Libertadores/Copa) fixtures from a
      free source; live-score polling during match windows.
- [ ] **App Store (optional, NOT free)** — Capacitor wrap. Requires Apple Developer
      Program **$99/yr**. Only if store presence/search is needed; PWA covers most.

## iPhone deployment decision

| Path | Cost | Notes |
| --- | --- | --- |
| **PWA** (recommended first) | $0 | Home-screen install, offline, iOS 16.4+ push. |
| Capacitor → App Store | $99/yr | Real store listing; must add native value (push, offline) to pass Apple Guideline 4.2 "minimum functionality". |
| React Native rewrite | $99/yr + effort | Only if true native feel is required. |

## Security hardening backlog (do when going live / adding APIs)

- [ ] nonce-based CSP to drop `'unsafe-inline'` (needs middleware).
- [ ] Rate limiting on `/api/*` once live APIs are wired (e.g. Upstash free tier).
- [ ] CI: `npm audit` + Dependabot + secret scanning.
- [ ] Prompt-injection guard if/when LLM summarization is added.

Already done: URL sanitization, feed fetch timeout/size cap, security headers
(CSP/HSTS/X-Frame-Options/etc.), scoped cache invalidation, error/loading
boundaries. `npm audit` residue is dev/build-time transitive only (not exploitable
in production).

## How to add another team later

The app reads only from `TeamConfig` + `DataResult<T>`. To add a club: create
`src/lib/teams/<team>.ts`, register in `src/lib/teams/index.ts`, add a seed/adapter
+ optional editorial interpretation in `src/lib/interpret/*`, drop a crest under
`public/teams/<team>/`. No page/component changes needed.
