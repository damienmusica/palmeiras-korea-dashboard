// =============================================================================
// Minimal, dependency-free RSS/Atom parsing. Used by the news adapter when
// NEWS_RSS_FEEDS is configured. Deliberately tolerant: returns best-effort
// items and never throws on malformed entries.
// =============================================================================

import type { NewsItem, SourceLanguage } from "@/lib/domain/types";
import { safeUrl } from "@/lib/security/url";

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function pick(block: string, tags: string[]): string | undefined {
  for (const tag of tags) {
    const m = block.match(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
    );
    if (m) return decodeEntities(m[1]);
    // Atom self-closing link with href attribute
    const attr = block.match(new RegExp(`<${tag}[^>]*href="([^"]+)"`, "i"));
    if (attr) return attr[1];
  }
  return undefined;
}

function guessLanguage(source: string, text: string): SourceLanguage {
  const t = text.toLowerCase();
  if (/[가-힣]/.test(text)) return "ko";
  if (/\b(do|da|com|não|gol|jogo|técnico)\b/.test(t)) return "pt";
  if (/\b(the|and|match|coach|goal)\b/.test(t)) return "en";
  void source;
  return "other";
}

/** Parse an RSS or Atom XML string into NewsItems. */
export function parseFeed(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = [
    ...xml.matchAll(/<item[\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi),
  ].map((m) => m[0]);

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const title = pick(block, ["title"]);
    if (!title) continue;
    // Sanitize at the boundary: a malicious feed could supply a javascript:
    // URL that would otherwise become an <a href>. Only http(s) survive.
    const url = safeUrl(pick(block, ["link", "guid"]));
    const description =
      pick(block, ["description", "summary", "content"]) ?? "";
    const pub =
      pick(block, ["pubDate", "published", "updated", "dc:date"]) ?? "";
    const parsed = pub ? new Date(pub) : null;
    const publishedAt =
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toISOString()
        : new Date(0).toISOString();

    const language = guessLanguage(sourceName, `${title} ${description}`);
    items.push({
      id: `${sourceName}-${i}-${url || title}`.slice(0, 120),
      title,
      summaryKo: description
        ? `${description.slice(0, 160)}${description.length > 160 ? "…" : ""}`
        : "원문 요약이 제공되지 않았습니다. 링크에서 전체 기사를 확인하세요.",
      excerpt: description.slice(0, 240) || undefined,
      url: url || "#",
      source: sourceName,
      language,
      publishedAt,
    });
  }
  return items;
}
