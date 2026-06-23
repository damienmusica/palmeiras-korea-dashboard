import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readNewsSnapshot } from "./snapshot";
import { getNews } from "@/lib/adapters";
import { cacheClear } from "@/lib/adapters/cache";

let dir: string;

beforeEach(() => {
  cacheClear();
  dir = mkdtempSync(join(tmpdir(), "pmk-snap-"));
  process.env.SNAPSHOT_DIR = dir;
  delete process.env.NEWS_RSS_FEEDS;
});

afterEach(() => {
  delete process.env.SNAPSHOT_DIR;
  rmSync(dir, { recursive: true, force: true });
});

function writeSnapshot(obj: unknown) {
  writeFileSync(join(dir, "news.json"), JSON.stringify(obj));
}

describe("readNewsSnapshot", () => {
  it("returns null when no snapshot file exists", () => {
    expect(readNewsSnapshot()).toBeNull();
  });

  it("reads a valid rss snapshot with provenance", () => {
    writeSnapshot({
      origin: "rss",
      source: "news.google.com",
      fetchedAt: "2026-06-23T00:00:00.000Z",
      items: [
        {
          id: "x",
          title: "Palmeiras news",
          summaryKo: "요약",
          url: "https://example.com",
          source: "ge",
          language: "pt",
          publishedAt: "2026-06-23T00:00:00.000Z",
          tags: ["뉴스"],
        },
      ],
    });
    const snap = readNewsSnapshot();
    expect(snap?.origin).toBe("rss");
    expect(snap?.data).toHaveLength(1);
  });

  it("returns null for an empty item list", () => {
    writeSnapshot({ origin: "rss", items: [] });
    expect(readNewsSnapshot()).toBeNull();
  });
});

describe("getNews with a pipeline snapshot present", () => {
  it("prefers the snapshot (rss) and enriches every item", async () => {
    writeSnapshot({
      origin: "rss",
      source: "news.google.com (Google News RSS)",
      fetchedAt: "2026-06-23T00:00:00.000Z",
      items: [
        {
          id: "a",
          title: "Trio inicia trabalhos no Palmeiras",
          summaryKo: "자동 번역된 요약",
          url: "https://news.google.com/x",
          source: "ge",
          language: "pt",
          publishedAt: "2026-06-22T00:00:00.000Z",
          tags: ["뉴스", "자동번역"],
        },
      ],
    });
    const res = await getNews();
    expect(res.origin).toBe("rss");
    expect(res.fellBack).toBe(false);
    const item = res.data[0];
    // "ge" (globo esporte) should classify as a reliable source...
    expect(item.reliability).toBe("reliable");
    // ...and enrichment must add the Korean interpretation contract.
    expect(item.whyItMattersKo).toBeTruthy();
    expect(item.fanTakeKo).toBeTruthy();
  });
});
