// =============================================================================
// Manual availability override layer. The free ingest (scripts/ingest.mjs) has
// no injury/suspension feed, so it hardcodes every player as "available" —
// honest for the common case, but wrong for a player currently out. Rather than
// wiring an unreliable auto-scraped injury source, we maintain a small,
// evidence-cited list here (same pattern as palmeiras-roster-overrides.ts):
// only add an entry when a status is confirmed, and remove it once the player
// is confirmed back.
// =============================================================================

import type { PlayerAvailability } from "@/lib/domain/types";
import { normKey } from "@/lib/i18n/ptKo";

export interface AvailabilityOverride {
  key: string;
  status: PlayerAvailability;
  /** Shown in the UI as the status detail (Player.statusNote). */
  statusNoteKo: string;
  /** Maintainer-facing evidence/source, not shown in the UI. */
  evidence: string;
}

/** Currently active overrides. Empty means the ingest's status stands as-is. */
export const OVERRIDES: AvailabilityOverride[] = [];

const byKey = new Map(OVERRIDES.map((o) => [o.key, o]));

/** Availability override for a raw player name, or null if none applies. */
export function availabilityOverride(
  name: string,
): AvailabilityOverride | null {
  return byKey.get(normKey(name)) ?? null;
}
