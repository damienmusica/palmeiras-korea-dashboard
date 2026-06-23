// =============================================================================
// Free, keyless data ingest. Designed to run in CI (GitHub Actions) on a cron
// with nothing but `node` — no API keys, no paid services, no DB.
//
//   node scripts/ingest.mjs
//
// It fetches real Palmeiras news from Google News RSS (keyless, unlimited),
// normalizes it into the app's NewsItem shape, optionally machine-translates
// the headline to Korean via MyMemory (free, best-effort, labeled 자동번역), and
// writes a snapshot to data/news.json. The site reads that snapshot (see
// src/lib/data/snapshot.ts); committing it on a schedule = a $0 live pipeline.
//
// Sports data (matches/standings/squad) is left to the app's seed until a free
// sports key is added — see the SPORTS section below for the wired extension
// point. The script never throws on network errors: it logs and exits 0 so a
// flaky feed never breaks the scheduled job (it just keeps the last snapshot).
// =============================================================================

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const NEWS_QUERY = process.env.NEWS_QUERY ?? "Palmeiras";
const GOOGLE_NEWS_RSS = `https://news.google.com/rss/search?q=${encodeURIComponent(
  NEWS_QUERY,
)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
const MAX_ITEMS = 24;
const ENABLE_MT = process.env.DISABLE_MT !== "1";
const FETCH_TIMEOUT_MS = 10000;
const MAX_BYTES = 2_000_000;

// --- helpers ----------------------------------------------------------------

function log(...args) {
  console.log("[ingest]", ...args);
}

function decodeEntities(s) {
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

function pick(block, tags) {
  for (const tag of tags) {
    const m = block.match(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
    );
    if (m) return decodeEntities(m[1]);
  }
  return undefined;
}

// Only http(s) URLs are allowed to become link targets (mirrors src/lib/security/url.ts).
function safeUrl(raw) {
  if (!raw) return "#";
  const v = raw.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? v : "#";
  } catch {
    return "#";
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PalmeirasKoreaDashboard/1.0 (+ingest)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  return text.length > MAX_BYTES ? text.slice(0, MAX_BYTES) : text;
}

// Best-effort, free, keyless PT->KO machine translation. Returns null on any
// failure so the caller can fall back gracefully.
async function translateToKo(text) {
  if (!ENABLE_MT || !text) return null;
  const clipped = text.slice(0, 480);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      clipped,
    )}&langpair=pt|ko`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const out = json?.responseData?.translatedText;
    if (!out || /MYMEMORY WARNING|INVALID/i.test(out)) return null;
    return decodeEntities(String(out));
  } catch {
    return null;
  }
}

// --- news ingest ------------------------------------------------------------

async function ingestNews() {
  log("fetching Google News RSS:", GOOGLE_NEWS_RSS);
  const xml = await fetchText(GOOGLE_NEWS_RSS);
  const blocks = [...xml.matchAll(/<item>[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  log(`found ${blocks.length} raw items`);

  const items = [];
  for (let i = 0; i < blocks.length && items.length < MAX_ITEMS; i += 1) {
    const block = blocks[i];
    const title = pick(block, ["title"]);
    if (!title) continue;
    const url = safeUrl(pick(block, ["link", "guid"]));
    const pub = pick(block, ["pubDate", "published", "updated"]);
    const parsed = pub ? new Date(pub) : null;
    const publishedAt =
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toISOString()
        : new Date().toISOString();
    // Google News encodes the outlet in a <source> tag.
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const source = sourceMatch
      ? decodeEntities(sourceMatch[1])
      : "news.google.com";
    const description = pick(block, ["description"]) ?? "";

    const ko = await translateToKo(title);
    const tags = ["뉴스"];
    if (ko) tags.push("자동번역");

    items.push({
      id: `gnews-${i}-${url}`.slice(0, 120),
      title,
      summaryKo:
        ko ??
        "자동 번역이 적용되지 않았습니다. 원문 제목과 아래 ‘왜 중요한가’ 해설, 원문 링크를 참고하세요.",
      excerpt: description.slice(0, 240) || undefined,
      url,
      source,
      language: "pt",
      publishedAt,
      // Reliability is classified by the app (single source of truth) at read
      // time via enrichNews(), so we deliberately don't freeze it here.
      tags,
    });
  }

  if (items.length === 0) {
    log("no items parsed; keeping existing snapshot");
    return false;
  }

  const snapshot = {
    origin: "rss",
    source: "news.google.com (Google News RSS)",
    fetchedAt: new Date().toISOString(),
    items,
  };
  writeFileSync(
    join(DATA_DIR, "news.json"),
    JSON.stringify(snapshot, null, 2) + "\n",
  );
  log(`wrote data/news.json with ${items.length} items`);
  return true;
}

// --- sports (extension point — keyless run skips this) ----------------------
// When API_FOOTBALL_KEY or THESPORTSDB_KEY is set, fetch + normalize fixtures /
// standings / squad into data/matches.json etc. (same DataResult-style shape:
// { origin, source, fetchedAt, ...payload }). Left intentionally unimplemented
// for the keyless MVP so the app stays on clearly-labeled seed sports data.
async function ingestSports() {
  if (!process.env.API_FOOTBALL_KEY && !process.env.THESPORTSDB_KEY) {
    log("no sports API key set — skipping sports (app uses labeled seed data)");
    return;
  }
  log(
    "sports key detected — sports ingest is a documented TODO (see docs/FREE-PIPELINE.md)",
  );
}

// --- main -------------------------------------------------------------------

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  try {
    await ingestNews();
  } catch (err) {
    log("news ingest failed (keeping existing snapshot):", err.message);
  }
  try {
    await ingestSports();
  } catch (err) {
    log("sports ingest failed:", err.message);
  }
  log("done");
}

await main();
