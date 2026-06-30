// =============================================================================
// Pipeline configuration — the SINGLE source of truth for the data-ingest
// scripts (ingest.mjs, espn-squad.mjs). Before this module, club identity,
// external feed IDs, the API-Football season, competition refs, and the
// nationality lookup were copy-pasted across scripts and had silently drifted
// (e.g. the nationality map was missing "Bolivia" in one copy). Everything the
// pipeline needs to identify the tracked club + its feeds lives here now.
//
// The app (src/lib/teams/palmeiras.ts) is the source of truth for what the UI
// renders; this file is the source of truth for how the pipeline FETCHES. They
// are intentionally separate runtimes (.ts app vs keyless .mjs cron), so the few
// values that overlap (competition ids/names) are mirrored, not imported across
// the language boundary. Korean team/player NAMES are deliberately NOT here: the
// app re-derives every name deterministically from the English source via
// src/lib/i18n/ptKo.ts, so the pipeline never needs (and must not maintain) a
// second, drift-prone transliteration map.
//
// Operator-tunable values read from the environment first, so a feed id or the
// season can be bumped via repo secrets/CI env without editing code.
// =============================================================================

// --- Tracked club: external feed identifiers --------------------------------
/** Palmeiras' API-Football team id. */
export const PALMEIRAS_API_ID = Number(process.env.PALMEIRAS_API_ID) || 121;
/** Palmeiras' ESPN team id (string — ESPN ids are compared as strings). */
export const PALMEIRAS_ESPN_ID = process.env.PALMEIRAS_ESPN_ID || "2029";

/** ESPN public API root (keyless, unofficial/undocumented — best-effort). */
export const ESPN_BASE = "https://site.api.espn.com/apis";
/** ESPN slug for the tracked domestic league (Brasileirão Série A). */
export const LEAGUE_SLUG = "bra.1";

/**
 * Season passed to API-Football's `players`/stats endpoints. This is NOT simply
 * "the current year" — the API-Football FREE plan only serves seasons up to a
 * fixed ceiling, so it is pinned here and bumped (via env or this constant) when
 * the plan's ceiling moves. The squad's *displayed* appearances/goals come from
 * the keyless ESPN current-season feed (see espn-squad.mjs), which overrides
 * these; API-Football is used mainly for roster + bio (nationality/birth/height).
 */
export const API_FOOTBALL_SEASON = process.env.API_FOOTBALL_SEASON || "2024";

// --- Competitions (mirror of the app's CompetitionRef for the same ids) -----
export const BRASILEIRAO = {
  id: "brasileirao",
  name: "Campeonato Brasileiro Série A",
  nameKo: "브라질 세리이 A (전국 리그)",
  shortName: "Brasileirão",
  kind: "league",
};
export const LIBERTADORES = {
  id: "libertadores",
  name: "CONMEBOL Libertadores",
  nameKo: "코파 리베르타도레스 (남미 챔피언스리그)",
  shortName: "Libertadores",
  kind: "continental",
};
export const COPA_DO_BRASIL = {
  id: "copa-do-brasil",
  name: "Copa do Brasil",
  nameKo: "코파 두 브라질 (국내컵)",
  shortName: "Copa do Brasil",
  kind: "cup",
};

/**
 * Competitions whose fixtures/results are pulled for the tracked team
 * (ESPN slug → domain CompetitionRef). `window:true` also scans a forward
 * scoreboard window (league only — the schedule omits unscheduled rounds).
 */
export const MATCH_COMPETITIONS = [
  { slug: LEAGUE_SLUG, comp: BRASILEIRAO, window: true },
  { slug: "conmebol.libertadores", comp: LIBERTADORES, window: false },
  { slug: "bra.copa_do_brazil", comp: COPA_DO_BRASIL, window: false },
];

/** Continental/cup competitions tracked beyond the league (group + knockout). */
export const CONTINENTAL_CAMPAIGNS = [
  {
    slug: "conmebol.libertadores",
    comp: LIBERTADORES,
    hasGroups: true,
    advanceCount: 2, // top 2 of each group reach the Round of 16
  },
  { slug: "bra.copa_do_brazil", comp: COPA_DO_BRASIL, hasGroups: false },
];

// --- Nationality: feed country string → [ISO code, Korean] -------------------
// Superset of the previously-divergent copies (ingest.mjs lacked "Bolivia",
// which made a Bolivian player on the API-Football path show the raw English
// "Bolivia" instead of "볼리비아"). Used only to FILL gaps, never to override a
// nationality the squad already has.
export const NATIONALITY = {
  Brazil: ["BR", "브라질"],
  Argentina: ["AR", "아르헨티나"],
  Uruguay: ["UY", "우루과이"],
  Paraguay: ["PY", "파라과이"],
  Colombia: ["CO", "콜롬비아"],
  Chile: ["CL", "칠레"],
  Venezuela: ["VE", "베네수엘라"],
  Ecuador: ["EC", "에콰도르"],
  Peru: ["PE", "페루"],
  Bolivia: ["BO", "볼리비아"],
  Portugal: ["PT", "포르투갈"],
  Spain: ["ES", "스페인"],
  France: ["FR", "프랑스"],
  Mexico: ["MX", "멕시코"],
};

/** ISO code for a feed country string ("" when unknown). */
export function natCode(country) {
  return NATIONALITY[country]?.[0] || "";
}
/** Korean name for a feed country string (falls back to the input/"정보 없음"). */
export function natKo(country) {
  return NATIONALITY[country]?.[1] || country || "정보 없음";
}

// --- News --------------------------------------------------------------------
// Bias to the football club (the bare name "Palmeiras" also matches unrelated
// neighbourhoods/social clubs, which surfaced off-topic/sensitive stories).
export const DEFAULT_NEWS_QUERY =
  'Palmeiras (Verdão OR Brasileirão OR Libertadores OR "Abel Ferreira" OR futebol)';

// Rolling news archive. Google News RSS only returns a recent window, so each
// run unions its parse with the previously-stored items (older articles don't
// vanish) but drops anything past the retention window and caps the total — so
// the snapshot stays a bounded ~3-week archive instead of a churning "latest 24".
/** How many items to parse/enrich from a single RSS pull (bounds LLM/MT use). */
export const NEWS_FETCH_MAX = Number(process.env.NEWS_FETCH_MAX) || 30;
/** Keep articles published within this many days; older ones expire out. */
export const NEWS_RETENTION_DAYS =
  Number(process.env.NEWS_RETENTION_DAYS) || 21;
/** Hard cap on stored articles (newest-first) so the snapshot can't grow forever. */
export const NEWS_ARCHIVE_MAX = Number(process.env.NEWS_ARCHIVE_MAX) || 60;
