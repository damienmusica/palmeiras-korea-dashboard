// =============================================================================
// ESPN keyless squad-stats enrichment. Fetches the current-season (live) ESPN
// roster for Palmeiras and attaches per-player season stats + fills missing
// nationality/birthdate onto the API-Football squad. ESPN's public JSON is free
// and exposes the CURRENT season — which the API-Football free plan blocks — so
// this is how the squad shows up-to-date appearances/goals/assists instead of a
// stale 2024 line. Matching is deterministic (jersey number + a shared name
// token) and refuses to match on jersey alone, so a number clash between two
// different players never attaches the wrong stats/nationality (no fabrication).
//
// Shared by scripts/ingest.mjs (CI pipeline) and a one-off local regen.
// =============================================================================

import {
  ESPN_BASE,
  PALMEIRAS_ESPN_ID,
  LEAGUE_SLUG,
  NATIONALITY,
} from "./pipeline-config.mjs";

const TIMEOUT_MS = 12000;

// Citizenship is filled from the shared NATIONALITY map (pipeline-config.mjs) —
// used only to FILL gaps, never to override a nationality the squad already has
// (ESPN occasionally mislabels).

function norm(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

/** Name tokens of length ≥3 (drops single-letter initials like "J."). */
function tokens(s) {
  return norm(s)
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function statVal(athlete, category, name) {
  const cats = athlete.statistics?.splits?.categories || [];
  const c = cats.find((x) => x.name === category);
  if (!c) return undefined;
  const s = (c.stats || []).find((x) => x.name === name);
  return s ? Number(s.value) : undefined;
}

/**
 * Validate the ESPN roster payload shape before we trust it. ESPN's JSON is
 * unofficial/undocumented, so a silent schema drift (HTML error page, empty
 * body, renamed fields) must FAIL LOUDLY rather than quietly producing an empty
 * roster that would strip every player's stats. Throws on a malformed payload so
 * the ingest keeps the last good snapshot instead.
 */
export function validateEspnRoster(j) {
  if (!j || typeof j !== "object")
    throw new Error("ESPN roster: not an object");
  if (!Array.isArray(j.athletes)) {
    throw new Error("ESPN roster: missing `athletes` array");
  }
  if (j.athletes.length === 0) {
    throw new Error("ESPN roster: empty `athletes` (likely a transient error)");
  }
  const named = j.athletes.filter(
    (a) => a && typeof a.displayName === "string" && a.displayName.length > 0,
  );
  if (named.length < j.athletes.length / 2) {
    throw new Error("ESPN roster: too many athletes missing displayName");
  }
  return true;
}

/** Fetch the live ESPN roster + the season it reflects. Throws on failure. */
export async function fetchEspnRoster() {
  const res = await fetch(
    `${ESPN_BASE}/site/v2/sports/soccer/${LEAGUE_SLUG}/teams/${PALMEIRAS_ESPN_ID}/roster`,
    {
      headers: { "User-Agent": "PalmeirasKoreaDashboard/1.0" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`ESPN roster HTTP ${res.status}`);
  const j = await res.json();
  validateEspnRoster(j);
  return {
    athletes: Array.isArray(j.athletes) ? j.athletes : [],
    season: String(j.season?.year || new Date().getFullYear()),
  };
}

/**
 * Match a squad player to an ESPN athlete. A shared name token (≥3 chars) is
 * REQUIRED for any match — so a bare jersey-number clash between two different
 * players is rejected rather than silently mis-attributed.
 */
export function matchAthlete(player, athletes) {
  const pt = tokens(player.name);
  if (pt.length === 0) return null;
  const overlap = (a) =>
    tokens(a.displayName).filter((t) => pt.includes(t)).length;

  // 1) jersey number + a shared name token.
  if (player.number != null) {
    const byJersey = athletes.filter(
      (a) => a.jersey != null && Number(a.jersey) === Number(player.number),
    );
    const compatible = byJersey
      .map((a) => ({ a, ov: overlap(a) }))
      .filter((x) => x.ov > 0)
      .sort((x, y) => y.ov - x.ov);
    if (compatible.length) return compatible[0].a;
  }

  // 2) name-only: unique best token overlap.
  const scored = athletes
    .map((a) => ({ a, ov: overlap(a) }))
    .filter((x) => x.ov > 0)
    .sort((x, y) => y.ov - x.ov);
  if (scored.length && (scored.length === 1 || scored[0].ov > scored[1].ov)) {
    return scored[0].a;
  }
  return null;
}

/**
 * Attach current-season ESPN stats to each squad player and fill missing
 * nationality/birthdate. Unmatched players have their stats CLEARED (set to
 * undefined) so the squad never mixes a stale season under the current-season
 * label — they honestly show "정보 없음".
 */
export function enrichSquadWithEspn(players, athletes, season) {
  let matched = 0;
  let natFilled = 0;
  let dobFilled = 0;
  // Cross-check: API-Football players with NO ESPN corroboration. These are the
  // single-feed entries the app-side integrity gate will flag/hide — logging
  // them here gives the pipeline an early phantom-warning (perspective #1/#2).
  const unmatched = [];
  const out = players.map((p) => {
    const a = matchAthlete(p, athletes);
    if (!a) {
      // No reliable ESPN match → drop any stale stats rather than mislabel them.
      unmatched.push({ name: p.name, number: p.number ?? null });
      const { stats: _drop, ...rest } = p;
      void _drop;
      return rest;
    }
    matched += 1;

    const stat = {
      season,
      competition: "브라질 세리이 A",
      appearances: statVal(a, "general", "appearances") || 0,
      goals: statVal(a, "offensive", "totalGoals") || 0,
      assists: statVal(a, "offensive", "goalAssists") || 0,
      yellowCards: statVal(a, "general", "yellowCards") || 0,
      redCards: statVal(a, "general", "redCards") || 0,
    };
    if (p.positionGroup === "GK") {
      const saves = statVal(a, "goalKeeping", "saves");
      const conceded = statVal(a, "goalKeeping", "goalsConceded");
      if (saves != null) stat.saves = saves;
      if (conceded != null) stat.goalsConceded = conceded;
    }

    let { nationality, nationalityKo, birthDate } = p;
    const cz = a.citizenship && NATIONALITY[a.citizenship];
    if ((!nationalityKo || nationalityKo === "정보 없음") && cz) {
      nationality = nationality || cz[0];
      nationalityKo = cz[1];
      natFilled += 1;
    }
    if (!birthDate && a.dateOfBirth) {
      birthDate = String(a.dateOfBirth).slice(0, 10);
      dobFilled += 1;
    }

    return { ...p, stats: [stat], nationality, nationalityKo, birthDate };
  });
  return { players: out, matched, natFilled, dobFilled, season, unmatched };
}
