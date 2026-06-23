import { describe, it, expect } from "vitest";
import {
  classifyReliability,
  enrichNews,
  newsCategory,
  RELIABILITY_META,
} from "./news";
import { competitionContext, allCompetitionContexts } from "./competitions";
import { matchInsight } from "./matches";
import { playerInsight } from "./players";
import { PALMEIRAS } from "@/lib/teams/palmeiras";
import type { Match, NewsItem, Player } from "@/lib/domain/types";

describe("classifyReliability", () => {
  it("respects an explicit value", () => {
    expect(classifyReliability("whatever", "rumor")).toBe("rumor");
  });
  it("detects official and reliable sources by name", () => {
    expect(classifyReliability("palmeiras.com.br")).toBe("official");
    expect(classifyReliability("CONMEBOL.com")).toBe("official");
    expect(classifyReliability("ge.globo (esporte)")).toBe("reliable");
    expect(classifyReliability("ge")).toBe("reliable"); // globo esporte brand
    expect(classifyReliability("ESPN.com.br")).toBe("reliable");
  });
  it("falls back to unknown", () => {
    expect(classifyReliability("some random blog")).toBe("unknown");
  });
  it("has metadata for every reliability level", () => {
    for (const level of [
      "official",
      "reliable",
      "rumor",
      "aggregator",
      "unknown",
    ] as const) {
      expect(RELIABILITY_META[level].labelKo).toBeTruthy();
    }
  });
});

describe("enrichNews", () => {
  const base: NewsItem = {
    id: "n1",
    title: "Title",
    summaryKo: "요약",
    url: "https://example.com",
    source: "random blog",
    language: "pt",
    publishedAt: "2026-06-20T00:00:00Z",
  };
  it("adds reliability + Korean interpretation when missing", () => {
    const out = enrichNews(base);
    expect(out.reliability).toBe("unknown");
    expect(out.whyItMattersKo).toBeTruthy();
    expect(out.fanTakeKo).toBeTruthy();
  });
  it("keeps editorial fields already present", () => {
    const out = enrichNews({
      ...base,
      reliability: "official",
      whyItMattersKo: "EDITORIAL",
      fanTakeKo: "TAKE",
    });
    expect(out.whyItMattersKo).toBe("EDITORIAL");
    expect(out.fanTakeKo).toBe("TAKE");
    expect(out.reliability).toBe("official");
  });
});

describe("newsCategory", () => {
  const item = (title: string, summaryKo = ""): NewsItem => ({
    id: "x",
    title,
    summaryKo,
    url: "https://example.com",
    source: "src",
    language: "pt",
    publishedAt: "2026-06-20T00:00:00Z",
  });

  it("classifies youth (Sub-XX / U-XX) items as 'other'", () => {
    expect(
      newsCategory(
        item("Palmeiras e Fluminense mantém 100% no Brasileirão Sub-17 - CBF"),
      ),
    ).toBe("other");
    expect(newsCategory(item("Sub-20 do Verdão goleia América-MG"))).toBe(
      "other",
    );
    expect(newsCategory(item("Verdão estreia na Copinha U-20"))).toBe("other");
    // Korean summary signal also counts (live items summarise as "U17").
    expect(
      newsCategory(item("Verdão vence fora", "파우메이라스 U17 선두 유지")),
    ).toBe("other");
  });

  it("classifies women's-team (feminino) items as 'other'", () => {
    expect(
      newsCategory(item("Palmeiras recebe Brothers FC pelo Paulista Feminino")),
    ).toBe("other");
  });

  it("classifies academy ('da base') items as 'other'", () => {
    expect(
      newsCategory(item("Palmeiras rompe contrato com promessa da base")),
    ).toBe("other");
  });

  it("classifies senior-team news as 'senior' by default", () => {
    expect(
      newsCategory(
        item("Palmeiras mantém plano para a janela de transferências"),
      ),
    ).toBe("senior");
    expect(
      newsCategory(item("Abel Ferreira projeta sequência no Brasileirão")),
    ).toBe("senior");
    // Tricky words that merely start with "sub" must NOT be mistaken for youth.
    expect(newsCategory(item("Palmeiras subiu para a liderança"))).toBe(
      "senior",
    );
  });
});

describe("competitionContext", () => {
  it("returns known contexts", () => {
    expect(competitionContext("libertadores").nameKo).toContain(
      "리베르타도레스",
    );
    expect(allCompetitionContexts().length).toBeGreaterThanOrEqual(4);
  });
  it("falls back for unknown competition ids", () => {
    const c = competitionContext("nope");
    expect(c.id).toBe("nope");
    expect(c.explainerKo).toBeTruthy();
  });
});

function finishedMatch(partial: Partial<Match>): Match {
  return {
    id: "m1",
    competition: {
      id: "brasileirao",
      name: "Brasileirão",
      nameKo: "브라질레이렁",
      shortName: "Brasileirão",
      kind: "league",
    },
    kickoff: "2026-06-15T00:00:00Z",
    status: "finished",
    venue: "home",
    home: { id: "palmeiras", name: "Palmeiras", nameKo: "파우메이라스" },
    away: { id: "x", name: "Internacional", nameKo: "인테르나시오나우" },
    score: { home: 2, away: 0 },
    ...partial,
  };
}

describe("matchInsight", () => {
  it("detects the Corinthians rivalry and tags it", () => {
    const m = finishedMatch({
      status: "scheduled",
      score: undefined,
      away: { id: "corinthians", name: "Corinthians", nameKo: "코린치안스" },
    });
    const insight = matchInsight(m, PALMEIRAS);
    expect(insight.rivalryKo).toBeTruthy();
    expect(insight.whyItMattersKo).toContain("코린치안스");
  });
  it("produces a result reading only for finished matches", () => {
    const finished = matchInsight(finishedMatch({}), PALMEIRAS);
    expect(finished.resultReadingKo).toBeTruthy();
    const scheduled = matchInsight(
      finishedMatch({ status: "scheduled", score: undefined }),
      PALMEIRAS,
    );
    expect(scheduled.resultReadingKo).toBeUndefined();
  });
  it("always returns at least one watch point", () => {
    expect(
      matchInsight(finishedMatch({}), PALMEIRAS).watchPointsKo.length,
    ).toBeGreaterThan(0);
  });
});

describe("playerInsight", () => {
  const generic: Player = {
    id: "nobody",
    name: "Nobody",
    nameKo: "아무개",
    positionGroup: "DF",
    position: "Zagueiro",
    positionKo: "수비수",
    nationality: "BR",
    nationalityKo: "브라질",
    availability: "available",
  };
  it("uses editorial content for known players", () => {
    const lopez: Player = { ...generic, id: "flaco-lopez" };
    const i = playerInsight(lopez);
    expect(i.source).toBe("editorial");
    expect(i.whyCareKo).toContain("플라코");
  });
  it("falls back to a position template for unknown players", () => {
    const i = playerInsight(generic);
    expect(i.source).toBe("seed");
    expect(i.roleKo).toBe("수비수");
  });
});
