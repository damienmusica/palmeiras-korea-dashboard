import { describe, it, expect } from "vitest";
import { relatedNews } from "./relate";
import { playerInsight } from "./players";
import type { NewsItem, Player } from "@/lib/domain/types";

function news(partial: Partial<NewsItem>): NewsItem {
  return {
    id: Math.random().toString(36),
    title: "",
    summaryKo: "",
    url: "https://example.com",
    source: "ge",
    language: "pt",
    publishedAt: "2026-06-20T00:00:00Z",
    ...partial,
  };
}

function player(partial: Partial<Player>): Player {
  return {
    id: "1",
    name: "Vitor Roque",
    nameKo: "비토르 호키",
    positionGroup: "FW",
    position: "FW",
    positionKo: "공격수",
    nationality: "BR",
    nationalityKo: "브라질",
    availability: "available",
    ...partial,
  };
}

describe("relatedNews", () => {
  const items = [
    news({
      id: "a",
      title: "Vitor Roque marca dois gols",
      publishedAt: "2026-06-21T00:00:00Z",
    }),
    news({ id: "b", title: "Abel elogia o elenco", summaryKo: "감독 인터뷰" }),
    news({
      id: "c",
      title: "Palmeiras vence",
      summaryKo: "비토르 호키가 선제골",
    }),
  ];
  it("matches by Latin surname", () => {
    const out = relatedNews(player({}), items);
    expect(out.map((n) => n.id)).toContain("a");
  });
  it("matches by Korean name token", () => {
    const out = relatedNews(player({}), items);
    expect(out.map((n) => n.id)).toContain("c");
  });
  it("excludes unrelated items", () => {
    const out = relatedNews(player({}), items);
    expect(out.map((n) => n.id)).not.toContain("b");
  });
  it("returns newest first and respects the limit", () => {
    const out = relatedNews(player({}), items, 1);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a"); // newer than c
  });
  it("ignores short/initial tokens (no false positives)", () => {
    const out = relatedNews(player({ name: "K. Lima", nameKo: "K. 리마" }), [
      news({ title: "A vida no clube" }),
    ]);
    expect(out).toHaveLength(0);
  });
});

describe("playerInsight uses curated dossier for real players", () => {
  it("returns rich editorial for a dossier player (by name)", () => {
    const i = playerInsight(player({ id: "340279", name: "Vitor Roque" }));
    expect(i.source).toBe("editorial");
    expect(i.whyCareKo).toContain("티그리뉴");
  });
  it("falls back to a position template for unknown players", () => {
    const i = playerInsight(
      player({ id: "999", name: "Unknown Newsigning", positionGroup: "DF" }),
    );
    expect(i.source).toBe("seed");
    expect(i.roleKo).toBe("수비수");
  });
});
