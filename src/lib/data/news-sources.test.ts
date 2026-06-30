import { describe, it, expect } from "vitest";
import {
  topSquadPlayerNames,
  buildPlayerNewsQuery,
  googleNewsRssUrl,
} from "../../../scripts/pipeline-config.mjs";
import { parseFeedItems, dedupeParsed } from "../../../scripts/ingest.mjs";

describe("topSquadPlayerNames", () => {
  const squad = {
    players: [
      { name: "J. López", stats: [{ goals: 10, appearances: 20 }] },
      { name: "Vitor Roque", stats: [{ goals: 8, appearances: 22 }] },
      { name: "Allan", stats: [{ goals: 1, appearances: 25 }] },
      { name: "X", stats: [{ goals: 99, appearances: 1 }] }, // too short → dropped
    ],
  };
  it("orders by goals→apps, strips initials, drops too-short names", () => {
    expect(topSquadPlayerNames(squad, 3)).toEqual([
      "López",
      "Vitor Roque",
      "Allan",
    ]);
  });
  it("returns [] when there's no squad", () => {
    expect(topSquadPlayerNames(null)).toEqual([]);
    expect(topSquadPlayerNames({ players: [] })).toEqual([]);
  });
  it("dedupes names that clean to the same surname", () => {
    const s = {
      players: [
        { name: "J. López", stats: [{ goals: 5, appearances: 1 }] },
        { name: "M. López", stats: [{ goals: 3, appearances: 1 }] },
      ],
    };
    expect(topSquadPlayerNames(s, 5)).toEqual(["López"]);
  });
});

describe("buildPlayerNewsQuery", () => {
  it("anchors players with Palmeiras + a football-context term", () => {
    const q = buildPlayerNewsQuery(["López", "Vitor Roque"]);
    expect(q).toContain("Palmeiras OR");
    expect(q).toContain('"López"');
    expect(q).toContain('"Vitor Roque"');
    expect(q).toMatch(/futebol|Brasileirão/);
  });
  it("returns null with no names", () => {
    expect(buildPlayerNewsQuery([])).toBeNull();
    expect(buildPlayerNewsQuery(null)).toBeNull();
  });
});

describe("googleNewsRssUrl", () => {
  it("encodes the query into a pt-BR Google News URL", () => {
    const u = googleNewsRssUrl("Palmeiras (futebol)");
    expect(u).toContain("news.google.com/rss/search?q=");
    expect(u).toContain("hl=pt-BR");
    expect(u).toContain(encodeURIComponent("Palmeiras (futebol)"));
  });
});

describe("parseFeedItems", () => {
  const xml = `<rss><channel>
    <item><title>One</title><link>https://a.com/1</link><pubDate>Mon, 29 Jun 2026 10:00:00 GMT</pubDate><source>ge</source><description>d1</description></item>
    <item><title>Two</title><link>https://a.com/2</link></item>
    <item><description>no title — skipped</description></item>
  </channel></rss>`;
  it("parses items, preferring <source> then the feed fallback name", () => {
    const out = parseFeedItems(xml, "fallback.com");
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      title: "One",
      url: "https://a.com/1",
      source: "ge",
    });
    expect(out[1].source).toBe("fallback.com"); // no <source> → fallback
  });
});

describe("dedupeParsed", () => {
  it("dedupes by URL then normalized title, newest first", () => {
    const items = [
      { title: "A", url: "u1", publishedAt: "2026-06-01T00:00:00Z" },
      { title: "A!", url: "u2", publishedAt: "2026-06-03T00:00:00Z" }, // same norm title
      { title: "B", url: "u1", publishedAt: "2026-06-02T00:00:00Z" }, // same url
      { title: "C", url: "u3", publishedAt: "2026-06-05T00:00:00Z" },
    ];
    expect(dedupeParsed(items).map((x) => x.url)).toEqual(["u3", "u2", "u1"]);
  });
});
