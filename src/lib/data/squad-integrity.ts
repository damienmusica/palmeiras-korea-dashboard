// =============================================================================
// Squad data-integrity gate — deterministic, keyless cross-verification that
// runs on every request so a single feed's bad data never reaches the UI as a
// real player. No fabrication: we only ever HIDE or FLAG, never invent.
//
// Five-perspective design (user mandate 2026-06-28):
//  1. Cross-verification — the pipeline already carries two independent FREE
//     feeds: API-Football (the registered squad list) and ESPN (current-season
//     roster + stats). The ingest attaches ESPN season stats ONLY when an ESPN
//     athlete matches by jersey + a shared name token, so "has season stats" is
//     a reliable proxy for "ESPN corroborates this player". A player present on
//     only one feed is treated as suspect.
//  2. Sanity rule — no senior stats + a nationality outside the squad's
//     plausible recruiting context = very likely a mis-attribution → reject.
//     (Nationality is NEVER used alone — only combined with the no-stats signal.)
//  3. Roster tiering — separates "registered/mis-attributed" from "active first
//     team" so phantoms and youth-only entries don't masquerade as regulars.
//  4. Low-confidence gating — unverified rows are flagged "확인 필요" and get NO
//     auto-generated commentary (the adapter/UI key off `confidence`).
//  5. Manual override — an explicit, evidence-cited allow/blocklist wins over
//     the heuristics (see palmeiras-roster-overrides.ts).
//
// Pure functions only; unit-tested in squad-integrity.test.ts.
// =============================================================================

import type { Player, RosterConfidence } from "@/lib/domain/types";
import {
  allowlistOverride,
  blocklistOverride,
} from "@/lib/teams/palmeiras-roster-overrides";

/**
 * Nationalities a Brazilian Série A club realistically fields. Used ONLY in
 * combination with "no cross-source stats" — never to reject on nationality
 * alone. Deliberately generous (all of the Americas + Europe + common African
 * football nations) so only a truly out-of-context code (e.g. an Asian / Middle
 * Eastern phantom from a feed bug) can trip the sanity rule.
 */
export const PLAUSIBLE_NATIONALITIES = new Set<string>([
  // CONMEBOL (South America)
  "BR", "AR", "UY", "PY", "CO", "CL", "VE", "EC", "PE", "BO",
  // Europe (commonly seen at Brazilian clubs)
  "PT", "ES", "FR", "IT", "DE", "NL", "BE", "RS", "HR", "GB", "IE",
  // North/Central America + Africa football contexts occasionally seen
  "US", "MX", "CR", "NG", "GH", "CM", "SN", "CV", "AO", "MA",
]);

export interface SquadClassification {
  confidence: RosterConfidence;
  /** Korean note when not plainly confirmed (shown in UI / used by adapter). */
  noteKo?: string;
  /** Honest tier label for an allowlisted edge case, e.g. "유스(Sub-20)". */
  tierKo?: string;
}

/** True when the ingest attached current-season (ESPN) stats to this player. */
export function hasSeniorStats(p: Player): boolean {
  return Array.isArray(p.stats) && p.stats.some((s) => s && s.season != null);
}

/**
 * Classify one roster entry. Pure & deterministic. The manual override layer
 * wins; otherwise ESPN-corroboration confirms; otherwise the sanity rule decides
 * reject vs. flag.
 */
export function classifyPlayer(p: Player): SquadClassification {
  // (5) manual override — highest authority.
  const blocked = blocklistOverride(p.name);
  if (blocked) return { confidence: "rejected", noteKo: blocked.reasonKo };
  const allowed = allowlistOverride(p.name);
  if (allowed) {
    return {
      confidence: "confirmed",
      noteKo: allowed.reasonKo,
      tierKo: allowed.tierKo,
    };
  }

  // (1) cross-verification: ESPN corroboration via attached current-season stats.
  if (hasSeniorStats(p)) return { confidence: "confirmed" };

  // (2) sanity rule: single-feed + out-of-context nationality → reject.
  const nat = (p.nationality || "").toUpperCase();
  const congruent = nat !== "" && PLAUSIBLE_NATIONALITIES.has(nat);
  if (!congruent) {
    return {
      confidence: "rejected",
      noteKo:
        "교차검증 실패 — 1군 공식 기록에 없고 국적이 스쿼드 맥락과 맞지 않아 오귀속 데이터로 판단했습니다.",
    };
  }

  // (4) single-feed but plausible → keep, flagged, no auto-commentary.
  return {
    confidence: "unverified",
    noteKo:
      "1군 공식 기록(ESPN)에서 아직 교차검증되지 않은 선수입니다. 정보가 확인되면 업데이트됩니다.",
  };
}

export interface GatedSquad {
  players: Player[];
  /** Players dropped by the gate, with the Korean reason (for logging/report). */
  hidden: { name: string; reasonKo: string }[];
}

/**
 * Apply the integrity gate to a roster: drop `rejected` players and tag the rest
 * with `confidence` / `integrityNoteKo` / `tierKo`. Returns the hidden list so
 * the caller can log what was suppressed (no silent truncation).
 */
export function gateSquad(players: Player[]): GatedSquad {
  const out: Player[] = [];
  const hidden: { name: string; reasonKo: string }[] = [];
  for (const p of players) {
    const c = classifyPlayer(p);
    if (c.confidence === "rejected") {
      hidden.push({ name: p.name, reasonKo: c.noteKo ?? "" });
      continue;
    }
    out.push({
      ...p,
      confidence: c.confidence,
      integrityNoteKo: c.noteKo,
      tierKo: c.tierKo,
    });
  }
  return { players: out, hidden };
}
