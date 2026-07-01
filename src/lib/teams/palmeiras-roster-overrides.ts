// =============================================================================
// Manual roster override layer — the small, hand-maintained allow/blocklist that
// force-corrects KNOWN data errors without waiting for an upstream free feed to
// fix itself. This is perspective #5 of the data-integrity mandate: when a feed
// (API-Football / ESPN) mis-attributes or omits a player, we override here with
// a documented, web-verified reason rather than trusting the feed blindly.
//
// Rules for maintaining this file:
//  • Keep it SMALL and EVIDENCE-BASED — every entry cites why (the `evidence`).
//  • NEVER invent players. The blocklist only HIDES confirmed phantoms; the
//    allowlist only VOUCHES for real players a single feed happens to miss.
//  • Re-check entries periodically — when ESPN/API-Football fix their data, the
//    override may become unnecessary (the deterministic gate then handles it).
// =============================================================================

import { normKey } from "@/lib/i18n/ptKo";

export interface RosterOverride {
  /** Normalized name key (normKey) this rule matches. */
  key: string;
  /** Display name, for audit/logs. */
  name: string;
  /** Korean explanation, may be surfaced in the UI. */
  reasonKo: string;
  /** Evidence/source for the decision (maintainer-facing, not shown). */
  evidence: string;
}

export interface RosterAllow extends RosterOverride {
  /** Optional honest tier label, e.g. "유스(Sub-20)", so we never imply
   *  senior stats the player doesn't have. */
  tierKo?: string;
}

/**
 * Players to HIDE — confirmed NOT to be real current first-teamers. A
 * blocklisted player is dropped from the squad everywhere in the app.
 */
export const ROSTER_BLOCKLIST: RosterOverride[] = [
  {
    key: normKey("Abd Al Qader Ghareeb"),
    name: "Abd Al Qader Ghareeb",
    reasonKo:
      "교차검증 실패 — ESPN 현 시즌 1군 명단에 존재하지 않고(같은 47번은 비토르 가브리에우), 1군 출전·스탯 기록도 없는 오귀속(誤歸屬) 데이터입니다.",
    evidence:
      "ESPN bra.1 roster (team 2029, season 2026): #47 = Victor Gabriel (BR); no athlete named 'Ghareeb'. The only real footballer of that name is Abdulrahman Ghareeb (Saudi winger, Al-Nassr), who has never played for Palmeiras. Confirmed API-Football mis-attribution. Verified 2026-06-28.",
  },
];

/**
 * Players to VOUCH FOR — real, web-verified players that a single feed omits
 * (e.g. an academy player carrying a senior number but listed only in ESPN's
 * youth data). Treated as confirmed even without cross-source senior stats; the
 * `tierKo` is surfaced so the UI never implies senior stats they lack.
 */
export const ROSTER_ALLOWLIST: RosterAllow[] = [
  {
    key: normKey("Rafael Coutinho"),
    name: "Rafael Coutinho",
    tierKo: "유스(Sub-20)",
    reasonKo:
      "실존 선수 — 파우메이라스 Sub-20 주장(2006년생)으로 1군 등번호(55번)로 등록돼 있습니다. 아직 1군 공식 출전 기록은 없습니다.",
    evidence:
      "Web-verified: Rafael Barbosa Coutinho, b. 2006-03-24 (Itabuna/BA), Sub-20 captain, leading the youth side in 2026 (21 games). ESPN player id 382963 ('Meio campista do Palmeiras'). Absent from ESPN senior bra.1 roster (which lists #55 = Isaac). Verified 2026-06-28.",
  },
  // Confirmed 2026 summer signing who can only be FIELDED from 2026-07-20
  // (post-World Cup window) — the free feeds may add him before he has any
  // Palmeiras stats, which would otherwise look like a phantom to the gate.
  // Keyed under every name form the feeds are likely to use.
  ...["Alexander Barboza", "A. Barboza", "Barboza"].map((name) => ({
    key: normKey(name),
    name,
    reasonKo:
      "실존 선수 — 2026-05-22 구단이 영입을 공식 발표한 아르헨티나 센터백(2028년 12월까지 계약). 등록 규정상 2026-07-20부터 출전 가능해, 합류 직후에는 파우메이라스 스탯이 없는 상태로 피드에 등재될 수 있습니다.",
    evidence:
      "Official club announcement 2026-05-22, widely reported (Metrópoles, CNN Brasil, Terra, Band: ~R$20M from Botafogo in 4 installments, contract to Dec 2028 + 1-yr option, eligible from Jul 20). Alexander Nahuel Barboza Ullúa, b. 1995-03-16, 193cm CB, ex-Botafogo (2024 Libertadores + Brasileirão winner). Verified 2026-07-02.",
  })),
];

const blockByKey = new Map(ROSTER_BLOCKLIST.map((o) => [o.key, o]));
const allowByKey = new Map(ROSTER_ALLOWLIST.map((o) => [o.key, o]));

/** Blocklist hit for a raw player name, or null. */
export function blocklistOverride(name: string): RosterOverride | null {
  return blockByKey.get(normKey(name)) ?? null;
}

/** Allowlist hit for a raw player name, or null. */
export function allowlistOverride(name: string): RosterAllow | null {
  return allowByKey.get(normKey(name)) ?? null;
}
