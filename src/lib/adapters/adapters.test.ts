import { describe, it, expect, beforeEach } from "vitest";
import {
  getNews,
  getMatches,
  getStandings,
  getSquad,
  getPlayer,
} from "./index";
import { cacheClear, cacheGet, cacheSet } from "./cache";
import { parseFeed } from "./rss";

beforeEach(() => {
  cacheClear();
  delete process.env.API_FOOTBALL_KEY;
  delete process.env.NEWS_RSS_FEEDS;
  // Point the snapshot reader at a non-existent dir so these tests exercise the
  // seed fallback deterministically (independent of any committed data/news.json).
  process.env.SNAPSHOT_DIR = "/nonexistent-pmk-snapshot-dir";
});

describe("adapters (no keys → labeled seed data)", () => {
  it("getNews returns enriched seed news with seed origin", async () => {
    const res = await getNews();
    expect(res.origin).toBe("seed");
    expect(res.fellBack).toBe(false);
    expect(res.data.length).toBeGreaterThan(0);
    // enrichment guarantees the news contract holds
    for (const item of res.data) {
      expect(item.reliability).toBeTruthy();
      expect(item.whyItMattersKo).toBeTruthy();
      expect(item.fanTakeKo).toBeTruthy();
    }
  });

  it("news is sorted newest-first", async () => {
    const res = await getNews();
    const times = res.data.map((n) => n.publishedAt);
    const sorted = [...times].sort((a, b) => b.localeCompare(a));
    expect(times).toEqual(sorted);
  });

  it("getMatches/getStandings/getSquad return seed origin", async () => {
    expect((await getMatches()).origin).toBe("seed");
    expect((await getStandings()).origin).toBe("seed");
    expect((await getSquad()).origin).toBe("seed");
  });

  it("getPlayer finds a known player and null for unknown", async () => {
    const known = await getPlayer("estevao");
    expect(known.data?.id).toBe("estevao");
    const missing = await getPlayer("does-not-exist");
    expect(missing.data).toBeNull();
  });

  it("returns seed matches/standings when no snapshot is present", async () => {
    // With SNAPSHOT_DIR pointed at a non-existent dir, the ESPN snapshot is
    // absent → adapters fall back to clearly-labeled seed data.
    const m = await getMatches();
    expect(m.origin).toBe("seed");
    expect(m.data.length).toBeGreaterThan(0);
    const s = await getStandings();
    expect(s.origin).toBe("seed");
    expect(s.data.table.length).toBeGreaterThan(0);
  });
});

describe("cache", () => {
  it("returns undefined after expiry", () => {
    const now = 1_000_000;
    cacheSet("k", 42, now);
    expect(cacheGet("k", now + 1000)).toBe(42);
    // default TTL 300s → expired well after
    expect(cacheGet("k", now + 301_000)).toBeUndefined();
  });
});

describe("parseFeed", () => {
  it("parses RSS items into NewsItems", () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <title>Palmeiras vence o clássico</title>
        <link>https://example.com/a</link>
        <description><![CDATA[O Verdão venceu o jogo.]]></description>
        <pubDate>Mon, 22 Jun 2026 09:00:00 GMT</pubDate>
      </item>
    </channel></rss>`;
    const items = parseFeed(xml, "example.com");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Palmeiras vence o clássico");
    expect(items[0].url).toBe("https://example.com/a");
    expect(items[0].language).toBe("pt");
    expect(new Date(items[0].publishedAt).getUTCFullYear()).toBe(2026);
  });

  it("tolerates malformed/empty feeds", () => {
    expect(parseFeed("<rss></rss>", "x")).toEqual([]);
    expect(parseFeed("garbage", "x")).toEqual([]);
  });
});
