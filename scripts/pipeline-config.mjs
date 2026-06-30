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
// Campeonato Paulista — the São Paulo state championship (Jan–Apr), a real part
// of Palmeiras' season the app already describes in the guide. ESPN slug verified
// (bra.camp.paulista) and it carries a group stage, so it's tracked both as
// fixtures and as a group+knockout campaign. Mirrors src/lib/teams/palmeiras.ts.
export const PAULISTA = {
  id: "paulista",
  name: "Campeonato Paulista",
  nameKo: "상파울루 주 선수권",
  shortName: "Paulistão",
  kind: "league",
};
export const PAULISTA_SLUG = "bra.camp.paulista";

/**
 * Competitions whose fixtures/results are pulled for the tracked team
 * (ESPN slug → domain CompetitionRef). `window:true` also scans a forward
 * scoreboard window (league only — the schedule omits unscheduled rounds).
 */
export const MATCH_COMPETITIONS = [
  { slug: LEAGUE_SLUG, comp: BRASILEIRAO, window: true },
  { slug: "conmebol.libertadores", comp: LIBERTADORES, window: false },
  { slug: "bra.copa_do_brazil", comp: COPA_DO_BRASIL, window: false },
  { slug: PAULISTA_SLUG, comp: PAULISTA, window: false },
];

/** Continental/cup/state campaigns tracked beyond the league (group + knockout). */
export const CONTINENTAL_CAMPAIGNS = [
  {
    slug: "conmebol.libertadores",
    comp: LIBERTADORES,
    hasGroups: true,
    advanceCount: 2, // top 2 of each group reach the Round of 16
  },
  { slug: "bra.copa_do_brazil", comp: COPA_DO_BRASIL, hasGroups: false },
  {
    slug: PAULISTA_SLUG,
    comp: PAULISTA,
    hasGroups: true,
    advanceCount: 2, // top 2 of each group reach the quarterfinals
  },
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
  'Palmeiras (Verdão OR Brasileirão OR Libertadores OR Paulista OR "Abel Ferreira" OR futebol)';

/** Football-context anchor terms reused by the player-anchored query. */
const NEWS_CONTEXT_TERMS =
  "futebol OR Brasileirão OR Libertadores OR Paulista OR Verdão";
/** How many marquee squad players to fold into the player-anchored query. */
export const NEWS_PLAYER_QUERY_MAX = Number(process.env.NEWS_PLAYER_MAX) || 6;
/** Extra RSS feed URLs (comma-separated) merged alongside Google News. Most
 *  dedicated outlet feeds (ge/Lance) are dead, so this defaults empty — Google
 *  News already aggregates ge/ESPN/UOL/Lance — but an operator can add any
 *  working RSS here without touching code. */
export const NEWS_EXTRA_FEEDS = (process.env.NEWS_EXTRA_FEEDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Build a Google News RSS URL for a Brazilian-Portuguese query. */
export function googleNewsRssUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

/** Clean a roster name into a searchable form: drop a leading single-letter
 *  initial ("J. López" → "López"), since the quoted abbreviated form would never
 *  match an article that writes the full first name. */
function searchName(name) {
  return String(name || "")
    .replace(/^[A-Za-z]\.\s+/, "")
    .trim();
}

/**
 * Marquee current-squad player names for the player-anchored news query, most
 * newsworthy first (goals, then appearances). Derived from the squad snapshot so
 * it AUTO-UPDATES with the roster — no hardcoded names. Returns [] when no squad.
 */
export function topSquadPlayerNames(squad, n = NEWS_PLAYER_QUERY_MAX) {
  const players = (squad && squad.players) || [];
  const seen = new Set();
  const out = [];
  for (const p of players
    .map((p) => ({
      name: searchName(p.name),
      goals: p.stats?.[0]?.goals || 0,
      apps: p.stats?.[0]?.appearances || 0,
    }))
    .filter((p) => p.name.length >= 3)
    .sort((a, b) => b.goals - a.goals || b.apps - a.apps)) {
    const key = p.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p.name);
    if (out.length >= n) break;
  }
  return out;
}

/**
 * Player-anchored query: (Palmeiras OR "Name" …) AND a football-context term, so
 * player-centric articles (call-ups, transfers, profiles) surface even when the
 * club name isn't in the snippet — while the context AND-term keeps out unrelated
 * same-name noise. Returns null when there are no names to anchor on.
 */
export function buildPlayerNewsQuery(names) {
  if (!names || names.length === 0) return null;
  const ors = ["Palmeiras", ...names.map((x) => `"${x}"`)].join(" OR ");
  return `(${ors}) (${NEWS_CONTEXT_TERMS})`;
}

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
