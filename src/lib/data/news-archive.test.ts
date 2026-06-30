import { describe, it, expect } from "vitest";
// mergeNewsArchive lives in the keyless ingest script — pure + now-injectable,
// importing it does NOT run the pipeline (entry-guarded).
import { mergeNewsArchive } from "../../../scripts/ingest.mjs";

const NOW = Date.parse("2026-06-30T00:00:00Z");
const item = (url: string, daysAgo: number, extra: object = {}) => ({
  url,
  title: `t-${url}`,
  publishedAt: new Date(NOW - daysAgo * 86400000).toISOString(),
  ...extra,
});

describe("mergeNewsArchive", () => {
  it("retains previous articles that fell out of the fresh RSS window", () => {
    const fresh = [item("a", 0), item("b", 1)];
    const previous = [item("c", 2), item("d", 3)]; // no longer in the feed
    const out = mergeNewsArchive(fresh, previous, NOW);
    expect(out.map((x) => x.url)).toEqual(["a", "b", "c", "d"]);
  });

  it("expires articles older than the retention window (21d)", () => {
    const fresh = [item("a", 0)];
    const previous = [item("old", 25), item("edge", 20)];
    const out = mergeNewsArchive(fresh, previous, NOW);
    expect(out.map((x) => x.url)).toEqual(["a", "edge"]);
    expect(out.find((x) => x.url === "old")).toBeUndefined();
  });

  it("lets a fresh entry win on URL collision (re-enriched copy)", () => {
    const fresh = [item("a", 0, { summaryKo: "NEW" })];
    const previous = [item("a", 0, { summaryKo: "OLD" })];
    const out = mergeNewsArchive(fresh, previous, NOW);
    expect(out).toHaveLength(1);
    expect((out[0] as { summaryKo: string }).summaryKo).toBe("NEW");
  });

  it("sorts newest-first and caps the total", () => {
    // 70 previous items, all within window → capped at NEWS_ARCHIVE_MAX (60).
    const previous = Array.from({ length: 70 }, (_, i) =>
      item(`p${i}`, (i % 20) + 1),
    );
    const out = mergeNewsArchive([item("newest", 0)], previous, NOW);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out[0].url).toBe("newest"); // most recent first
    // Descending by publishedAt.
    for (let i = 1; i < out.length; i += 1) {
      expect(out[i - 1].publishedAt >= out[i].publishedAt).toBe(true);
    }
  });

  it("keeps an item whose timestamp is unparseable rather than dropping it", () => {
    const out = mergeNewsArchive(
      [item("a", 0)],
      [{ url: "weird", title: "t", publishedAt: "not-a-date" }],
      NOW,
    );
    expect(out.map((x) => x.url).sort()).toEqual(["a", "weird"]);
  });
});
