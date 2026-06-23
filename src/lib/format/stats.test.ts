import { describe, it, expect } from "vitest";
import {
  ageFromBirthDate,
  footKo,
  availabilityKo,
  heightKo,
  aggregateStats,
  resultForTeam,
  recentForm,
  summarizeSeason,
  formatGoalDiff,
  sortStandings,
} from "./stats";
import type { Match, StandingRow } from "@/lib/domain/types";

const now = new Date("2026-06-23T00:00:00.000Z");

function makeMatch(partial: Partial<Match>): Match {
  return {
    id: "x",
    competition: {
      id: "brasileirao",
      name: "Brasileirão",
      nameKo: "브라질레이렁",
      shortName: "Brasileirão",
      kind: "league",
    },
    kickoff: "2026-06-01T00:00:00.000Z",
    status: "finished",
    venue: "home",
    home: { id: "palmeiras", name: "Palmeiras", nameKo: "파우메이라스" },
    away: { id: "rival", name: "Rival", nameKo: "라이벌" },
    score: { home: 2, away: 0 },
    ...partial,
  };
}

describe("ageFromBirthDate", () => {
  it("computes whole-year age", () => {
    expect(ageFromBirthDate("2000-06-22", now)).toBe(26);
    expect(ageFromBirthDate("2000-06-24", now)).toBe(25); // birthday not yet
  });
  it("returns null for missing/invalid", () => {
    expect(ageFromBirthDate(undefined, now)).toBeNull();
    expect(ageFromBirthDate("garbage", now)).toBeNull();
  });
});

describe("label helpers", () => {
  it("footKo", () => {
    expect(footKo("left")).toBe("왼발");
    expect(footKo("right")).toBe("오른발");
    expect(footKo(undefined)).toBe("정보 없음");
  });
  it("availabilityKo tones", () => {
    expect(availabilityKo("injured").tone).toBe("warn");
    expect(availabilityKo("available").tone).toBe("ok");
    expect(availabilityKo("loan").tone).toBe("info");
  });
  it("heightKo", () => {
    expect(heightKo(184)).toBe("184cm");
    expect(heightKo(undefined)).toBe("");
  });
  it("formatGoalDiff signs", () => {
    expect(formatGoalDiff(7)).toBe("+7");
    expect(formatGoalDiff(-3)).toBe("-3");
    expect(formatGoalDiff(0)).toBe("0");
  });
});

describe("aggregateStats", () => {
  it("sums across competitions", () => {
    const agg = aggregateStats([
      { season: "2026", appearances: 10, goals: 3, assists: 2 },
      { season: "2026", appearances: 5, goals: 1, assists: 1 },
    ]);
    expect(agg?.appearances).toBe(15);
    expect(agg?.goals).toBe(4);
    expect(agg?.assists).toBe(3);
  });
  it("returns null for empty", () => {
    expect(aggregateStats([])).toBeNull();
    expect(aggregateStats(undefined)).toBeNull();
  });
});

describe("resultForTeam", () => {
  it("reads home win/loss/draw from tracked perspective", () => {
    expect(
      resultForTeam(makeMatch({ score: { home: 2, away: 0 } }), "palmeiras"),
    ).toBe("W");
    expect(
      resultForTeam(makeMatch({ score: { home: 0, away: 1 } }), "palmeiras"),
    ).toBe("L");
    expect(
      resultForTeam(makeMatch({ score: { home: 1, away: 1 } }), "palmeiras"),
    ).toBe("D");
  });
  it("reads away perspective correctly", () => {
    const m = makeMatch({
      home: { id: "rival", name: "Rival", nameKo: "라이벌" },
      away: { id: "palmeiras", name: "Palmeiras", nameKo: "파우메이라스" },
      score: { home: 0, away: 3 },
    });
    expect(resultForTeam(m, "palmeiras")).toBe("W");
  });
  it("returns null for unfinished or non-participant", () => {
    expect(
      resultForTeam(
        makeMatch({ status: "scheduled", score: undefined }),
        "palmeiras",
      ),
    ).toBeNull();
    expect(resultForTeam(makeMatch({}), "other")).toBeNull();
  });
});

describe("recentForm + summarizeSeason", () => {
  const matches: Match[] = [
    makeMatch({
      id: "a",
      kickoff: "2026-06-01T00:00:00Z",
      score: { home: 2, away: 0 },
    }), // W
    makeMatch({
      id: "b",
      kickoff: "2026-06-05T00:00:00Z",
      score: { home: 1, away: 1 },
    }), // D
    makeMatch({
      id: "c",
      kickoff: "2026-06-10T00:00:00Z",
      score: { home: 0, away: 2 },
    }), // L
    makeMatch({
      id: "d",
      kickoff: "2026-07-01T00:00:00Z",
      status: "scheduled",
      score: undefined,
    }),
  ];
  it("orders form most-recent-last", () => {
    expect(recentForm(matches, "palmeiras")).toEqual(["W", "D", "L"]);
  });
  it("summarizes season record", () => {
    const s = summarizeSeason(matches, "palmeiras", "2026");
    expect(s.wins).toBe(1);
    expect(s.draws).toBe(1);
    expect(s.losses).toBe(1);
    expect(s.matchesPlayed).toBe(3);
    expect(s.goalsFor).toBe(3);
    expect(s.goalsAgainst).toBe(3);
  });
});

describe("sortStandings", () => {
  it("sorts by points, then GD, then GF", () => {
    const rows: StandingRow[] = [
      row("a", 10, 5, 3),
      row("b", 12, 4, 2),
      row("c", 12, 6, 1),
    ];
    const sorted = sortStandings(rows);
    expect(sorted.map((r) => r.teamId)).toEqual(["c", "b", "a"]);
  });
});

function row(
  teamId: string,
  points: number,
  goalDifference: number,
  goalsFor: number,
): StandingRow {
  return {
    rank: 0,
    teamId,
    teamName: teamId,
    teamNameKo: teamId,
    played: 10,
    won: 3,
    drawn: 1,
    lost: 6,
    goalsFor,
    goalsAgainst: goalsFor - goalDifference,
    goalDifference,
    points,
    form: [],
  };
}
