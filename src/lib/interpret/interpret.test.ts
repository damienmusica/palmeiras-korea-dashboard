import { describe, it, expect } from "vitest";
import {
  classifyReliability,
  enrichNews,
  newsCategory,
  RELIABILITY_META,
} from "./news";
import { competitionContext, allCompetitionContexts } from "./competitions";
import { matchInsight, fixtureGapKo, nextFixtureWaitKo } from "./matches";
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

  it("gives Corinthians-specific derby watch points", () => {
    const m = finishedMatch({
      status: "scheduled",
      score: undefined,
      away: { id: "corinthians", name: "Corinthians", nameKo: "코린치안스" },
    });
    const wp = matchInsight(m, PALMEIRAS).watchPointsKo.join(" ");
    expect(wp).toContain("데르비 파울리스타");
    expect(wp).toMatch(/만샤 베르지|가비옹이스/);
  });

  it("detects the São Paulo derby even when the feed omits the 'FC' suffix", () => {
    // ESPN reports "São Paulo" / "상파울루"; the rival is "São Paulo FC".
    const m = finishedMatch({
      status: "scheduled",
      score: undefined,
      away: { id: "saopaulo", name: "São Paulo", nameKo: "상파울루" },
    });
    const insight = matchInsight(m, PALMEIRAS);
    expect(insight.rivalryKo).toBeTruthy();
    expect(insight.watchPointsKo.join(" ")).toContain("쇼키-헤이");
  });

  it("gives Santos-specific derby watch points (different from Corinthians)", () => {
    const cor = matchInsight(
      finishedMatch({
        status: "scheduled",
        score: undefined,
        away: { id: "corinthians", name: "Corinthians", nameKo: "코린치안스" },
      }),
      PALMEIRAS,
    ).watchPointsKo.join(" ");
    const san = matchInsight(
      finishedMatch({
        status: "scheduled",
        score: undefined,
        away: { id: "santos", name: "Santos FC", nameKo: "산투스 FC" },
      }),
      PALMEIRAS,
    ).watchPointsKo.join(" ");
    expect(san).toContain("사우다지");
    expect(san).not.toEqual(cor);
  });

  it("frames a continental tie with knockout/away context", () => {
    const m = finishedMatch({
      status: "scheduled",
      score: undefined,
      venue: "away",
      competition: {
        id: "libertadores",
        name: "CONMEBOL Libertadores",
        nameKo: "코파 리베르타도레스",
        shortName: "Libertadores",
        kind: "continental",
      },
      away: { id: "bolivar", name: "Bolívar", nameKo: "볼리바르" },
    });
    const wp = matchInsight(m, PALMEIRAS).watchPointsKo.join(" ");
    expect(wp).toContain("볼리바르");
    expect(wp).toMatch(/합산|토너먼트/);
  });

  it("adds a big-match line for a notable non-derby league opponent", () => {
    const m = finishedMatch({
      status: "scheduled",
      score: undefined,
      away: { id: "flamengo", name: "Flamengo", nameKo: "플라멩구" },
    });
    const wp = matchInsight(m, PALMEIRAS).watchPointsKo.join(" ");
    expect(wp).toContain("빅매치");
    expect(wp).toContain("플라멩구");
  });
});

describe("fixtureGapKo", () => {
  it("returns null for a normal week-to-week gap", () => {
    expect(
      fixtureGapKo("2026-06-01T00:00:00Z", "2026-06-05T00:00:00Z"),
    ).toBeNull();
  });
  it("flags a notable (A-match-sized) gap with hedged copy", () => {
    const g = fixtureGapKo("2026-06-01T00:00:00Z", "2026-06-22T00:00:00Z");
    expect(g?.days).toBe(21);
    expect(g?.labelKo).toContain("21");
    // Hedged ("…수 있습니다"); never asserts a single verified cause.
    expect(g?.labelKo).toMatch(/수 있습니다/);
    expect(g?.labelKo).not.toMatch(/중단됩니다|때문입니다/);
  });
  it("flags a major gap WITHOUT fabricating a definite cause", () => {
    const g = fixtureGapKo("2026-06-01T00:00:00Z", "2026-07-20T00:00:00Z");
    expect(g?.days).toBeGreaterThanOrEqual(35);
    // Must not claim a verified reason (e.g. the old "World Cup break").
    expect(g?.labelKo).toMatch(/수 있습니다/);
    expect(g?.labelKo).not.toMatch(
      /월드컵 등 메이저 국제 대회 기간에는|중단됩니다/,
    );
    // Acknowledges the data-completeness possibility (not-yet-scheduled rounds).
    expect(g?.labelKo).toMatch(/확정되지 않/);
  });
  it("returns null on invalid input", () => {
    expect(fixtureGapKo("nope", "2026-07-20T00:00:00Z")).toBeNull();
  });
});

describe("nextFixtureWaitKo", () => {
  it("counts the wait from TODAY, not from the last result", () => {
    // The real bug: last match 2026-05-31, next 2026-07-24 — but viewed on
    // 2026-06-29 the wait is ~25 days, NOT the 53-day finished→next span.
    const g = nextFixtureWaitKo("2026-06-29T00:00:00Z", "2026-07-24T00:30:00Z");
    expect(g?.days).toBe(25);
    expect(g?.labelKo).toContain("25");
    expect(g?.labelKo).not.toContain("53");
    // Names the concrete resume date (KST) so "next month" reads unambiguously.
    expect(g?.labelKo).toContain("7월 24일");
    // Hedged; never asserts a verified cause.
    expect(g?.labelKo).toMatch(/수 있습니다/);
    expect(g?.labelKo).not.toMatch(/중단됩니다|월드컵 등/);
  });
  it("shows no banner when the next match is imminent", () => {
    // Deep into a break: 3 days left → no scary 'long gap' note.
    expect(
      nextFixtureWaitKo("2026-07-21T00:00:00Z", "2026-07-24T00:30:00Z"),
    ).toBeNull();
  });
  it("returns null on invalid input", () => {
    expect(nextFixtureWaitKo("nope", "2026-07-24T00:00:00Z")).toBeNull();
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
