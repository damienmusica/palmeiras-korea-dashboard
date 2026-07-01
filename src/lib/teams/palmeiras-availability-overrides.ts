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

const OVERRIDES: AvailabilityOverride[] = [
  {
    key: normKey("Vitor Roque"),
    status: "injured",
    statusNoteKo:
      "왼쪽 발목 인대 부상으로 2026년 5월 1일 수술. 재활 순조로워 7월 말~8월 초 복귀가 목표입니다.",
    evidence:
      "Left-ankle syndesmosis injury (2026-04-23 vs Jacuipense, Copa do Brasil), surgery 2026-05-01. As of late June 2026 (antenadosnofutebol/correiobraziliense/gazetaesportiva/terra): off crutches/boot, ball work resumed, club's internal target is fully available for official matches late July–early August 2026. Verified 2026-07-02.",
  },
];

const byKey = new Map(OVERRIDES.map((o) => [o.key, o]));

/** Availability override for a raw player name, or null if none applies. */
export function availabilityOverride(
  name: string,
): AvailabilityOverride | null {
  return byKey.get(normKey(name)) ?? null;
}
