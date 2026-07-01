// =============================================================================
// Deterministic stadium display naming. The ESPN feed still emits the OLD
// naming-rights name ("Allianz Parque") for Palmeiras home matches, but the
// arena was officially renamed "Nubank Parque" effective 2026-05-04 (fan vote
// closed; WTorre rescinded the Allianz deal, Nubank took an 18-year naming
// contract). Curated content (team config, guide) already says Nubank Parque;
// this helper keeps feed-derived match cards consistent with that fact.
//
// Matches BEFORE the effective date keep "Allianz Parque" — that WAS the
// stadium's name when those games were played (historical accuracy beats
// blanket renaming).
// =============================================================================

const OLD_NAME = /allianz\s*parque/i;
const NEW_NAME = "Nubank Parque";
const EFFECTIVE_DATE = "2026-05-04"; // rename effective (fan vote closed)

/**
 * Map a feed-provided stadium name to its correct display name for the given
 * kickoff. Only rewrites the known stale case (Allianz → Nubank on/after the
 * rename date); every other name passes through untouched. A missing kickoff
 * is treated as current/future (renamed).
 */
export function displayStadiumName(
  name: string | undefined,
  kickoffIso: string | undefined,
): string | undefined {
  if (!name || !OLD_NAME.test(name)) return name;
  if (kickoffIso && kickoffIso.slice(0, 10) < EFFECTIVE_DATE) return name;
  return NEW_NAME;
}
