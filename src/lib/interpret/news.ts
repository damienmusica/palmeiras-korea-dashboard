// =============================================================================
// News interpretation. Classifies a source's reliability so Korean fans know
// how much to trust an item, and provides Korean labels. For live items that
// arrive without editorial context, it adds a conservative, generic
// "why it matters" / "fan take" so every card meets the product contract.
// =============================================================================

import type { NewsItem, SourceReliability } from "@/lib/domain/types";
import { normalizeKoreanTerms } from "@/lib/i18n/ptKo";

interface ReliabilityMeta {
  labelKo: string;
  descKo: string;
  tone: "official" | "good" | "warn" | "neutral";
}

export const RELIABILITY_META: Record<SourceReliability, ReliabilityMeta> = {
  official: {
    labelKo: "공식",
    descKo: "구단·연맹·대회 공식 채널 — 가장 신뢰할 수 있는 1차 출처",
    tone: "official",
  },
  reliable: {
    labelKo: "신뢰 매체",
    descKo: "정평 있는 스포츠 매체의 보도",
    tone: "good",
  },
  rumor: {
    labelKo: "루머/추측",
    descKo: "이적설 등 확인되지 않은 추측성 정보 — 주의해서 읽으세요",
    tone: "warn",
  },
  aggregator: {
    labelKo: "재가공/모음",
    descKo: "원 출처를 재가공한 모음성 콘텐츠 — 원문 확인 권장",
    tone: "neutral",
  },
  unknown: {
    // The source IS named (Google News always provides the outlet); we just
    // haven't pre-classified its reliability — so "기타 매체", not "출처 미상".
    labelKo: "기타 매체",
    descKo: "사전 분류되지 않은 매체 — 보도 내용은 원문에서 확인하세요",
    tone: "neutral",
  },
};

/** Domain/source-name based reliability classification (best effort). */
export function classifyReliability(
  source: string,
  explicit?: SourceReliability,
): SourceReliability {
  if (explicit) return explicit;
  const s = source.toLowerCase();
  if (
    s.includes("palmeiras.com") ||
    s.includes("se palmeiras") || // official club feed name on Google News
    s.includes("tv palmeiras") ||
    s.includes("cbf") ||
    s.includes("conmebol") ||
    s.includes("official")
  ) {
    return "official";
  }
  // Established Brazilian + international football outlets (as surfaced by Google
  // News). "ge" is globo esporte's brand name, matched exactly (substring "ge"
  // would over-match). Keep this list current with what the feed actually
  // returns so legitimate outlets aren't shown as the generic "기타 매체".
  const RELIABLE = [
    "globo",
    "espn",
    "uol",
    "lance",
    "gazeta",
    "placar",
    "terra",
    "band",
    "trivela",
    "goal",
    "cnn",
    "r7",
    "onefootball",
    "sportbuzz",
    "metrópoles",
    "metropoles",
    "estadão",
    "estadao",
    "folha",
    "jovem pan",
    "sportv",
    "premiere",
    "fotmob",
    "transfermarkt",
    "ogol",
    "tnt sports",
    "veja",
    "a bola",
    "o povo",
    "noticias ao minuto",
    "notícias ao minuto",
  ];
  if (s === "ge" || RELIABLE.some((name) => s.includes(name))) {
    return "reliable";
  }
  if (s.includes("rumor") || s.includes("mercado") || s.includes("transfer")) {
    return "rumor";
  }
  if (
    s.includes("google") ||
    s.includes("msn") || // republishes other outlets' stories
    s.includes("aggregat") ||
    s.includes("feed")
  ) {
    return "aggregator";
  }
  return "unknown";
}

/**
 * Ensure a news item carries reliability + Korean interpretation. Editorial
 * fields already present are kept; otherwise conservative generics are added so
 * the UI contract (왜 중요한가 / 팬 관점) always holds.
 */
export function enrichNews(item: NewsItem): NewsItem {
  const reliability = classifyReliability(item.source, item.reliability);
  // Normalize any LLM/MT Korean to canonical club/term spellings (deterministic;
  // protects quality even if a weak free model wrote the text).
  const summaryKo = normalizeKoreanTerms(item.summaryKo);
  const whyItMattersKo = normalizeKoreanTerms(
    item.whyItMattersKo ??
      "이 소식이 팀 분위기·라인업·일정에 영향을 줄 수 있어 팔로우할 가치가 있습니다. 정확한 사실은 원문에서 확인하세요.",
  );
  const fanTakeKo = normalizeKoreanTerms(
    item.fanTakeKo ??
      (reliability === "rumor"
        ? "아직은 ‘설’ 단계 — 너무 들뜨지 말고 지켜봅시다."
        : reliability === "official"
          ? "공식 발표인 만큼 믿고 봐도 좋습니다."
          : "흥미로운 소식, 흐름을 지켜볼 만합니다."),
  );
  return { ...item, reliability, summaryKo, whyItMattersKo, fanTakeKo };
}

export function enrichNewsList(items: NewsItem[]): NewsItem[] {
  return items.map(enrichNews);
}

// --- Squad scope classification (deterministic) ------------------------------
// The Google News feed mixes senior-team items with youth (Sub-15…Sub-23) and
// women's-team (feminino) coverage. Korean newcomers want to filter to the
// first team. Classification is purely title/summary keyword based — NO LLM —
// so it is stable and testable.

/** Which part of the club a news item is about. */
export type NewsCategory = "senior" | "other";

// Markers that put an item in "그 외" (youth / women / academy). Each is a clear,
// unambiguous Portuguese/English signal that appears in the headline.
const NON_SENIOR_MARKERS: RegExp[] = [
  /\bsub[\s-]?(1[0-9]|2[0-3])\b/i, // Sub-17, Sub 20, Brasileiro Sub-15…
  /\bu[\s-]?(1[0-9]|2[0-3])\b/i, // U-17, U20…
  /\bfeminin[oa]s?\b/i, // feminino / feminina (women's team)
  /\bda base\b/i, // "promessa da base" (academy)
  /categorias?\s+de\s+base/i,
  /crias da academia/i,
];

/**
 * Classify a news item as senior-team ("1군") or other ("그 외": youth/women).
 * Defaults to "senior" unless a clear youth/women marker is present, so general
 * club news is never wrongly hidden.
 */
export function newsCategory(
  item: Pick<NewsItem, "title" | "summaryKo" | "tags">,
): NewsCategory {
  const hay = `${item.title ?? ""} ${item.summaryKo ?? ""} ${(item.tags ?? []).join(" ")}`;
  return NON_SENIOR_MARKERS.some((re) => re.test(hay)) ? "other" : "senior";
}
