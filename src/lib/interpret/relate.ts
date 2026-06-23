// =============================================================================
// Relate news to a player. Deterministic name matching (no LLM): matches a
// player's Latin surname (accent-insensitive) or Korean name tokens against news
// titles/summaries, so a player page can surface their own latest coverage.
// =============================================================================

import type { NewsItem, Player } from "@/lib/domain/types";

function strip(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Distinctive Latin tokens (surname + long first name) for a player. */
function latinTokens(name: string): string[] {
  return strip(name)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 4); // skip initials / short tokens
}

/** Korean name tokens (Hangul words). */
function koreanTokens(nameKo: string): string[] {
  return nameKo.split(/\s+/).filter((t) => /[가-힣]/.test(t) && t.length >= 2);
}

/** News items that mention the player, most recent first, capped at `limit`. */
export function relatedNews(
  player: Pick<Player, "name" | "nameKo">,
  news: NewsItem[],
  limit = 4,
): NewsItem[] {
  const latin = latinTokens(player.name);
  const korean = koreanTokens(player.nameKo);
  if (latin.length === 0 && korean.length === 0) return [];

  const matches = news.filter((n) => {
    const hayLatin = strip(`${n.title} ${n.summaryKo} ${n.excerpt ?? ""}`);
    const hayRaw = `${n.title} ${n.summaryKo} ${n.excerpt ?? ""}`;
    if (latin.some((t) => hayLatin.includes(t))) return true;
    if (korean.some((t) => hayRaw.includes(t))) return true;
    return false;
  });

  return matches
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
