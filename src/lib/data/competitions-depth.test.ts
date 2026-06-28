import { describe, it, expect } from "vitest";
// The continental/cup parsers live in the keyless ingest script — pure and
// exported there; importing does NOT run the pipeline (entry-guarded).
import {
  roundKo,
  groupNameKo,
  parsePalmeirasGroup,
  parseAggregateNote,
  buildCampaignTie,
} from "../../../scripts/ingest.mjs";

const PALM = "2029"; // Palmeiras ESPN id

describe("roundKo", () => {
  it("maps known knockout round names and slugs to Korean", () => {
    expect(roundKo("Round of 16")).toBe("16강");
    expect(roundKo("round-of-16")).toBe("16강");
    expect(roundKo("Quarterfinals")).toBe("8강");
    expect(roundKo("Semifinals")).toBe("4강");
    expect(roundKo("Final")).toBe("결승");
    expect(roundKo("Group Stage")).toBe("조별리그");
  });
  it("returns null for unknown rounds (caller shows an honest fallback)", () => {
    expect(roundKo("fifth-round")).toBeNull();
    expect(roundKo("")).toBeNull();
    expect(roundKo(undefined)).toBeNull();
  });
});

describe("groupNameKo", () => {
  it("turns an ESPN group label into a Korean one", () => {
    expect(groupNameKo("Group F")).toBe("F조");
    expect(groupNameKo("Group A")).toBe("A조");
  });
  it("falls back gracefully", () => {
    expect(groupNameKo("")).toBe("조별리그");
  });
});

describe("parsePalmeirasGroup", () => {
  const standings = {
    children: [
      {
        name: "Group A",
        standings: {
          entries: [{ team: { id: "999", displayName: "Other" }, stats: [] }],
        },
      },
      {
        name: "Group F",
        standings: {
          entries: [
            {
              team: { id: "2671", displayName: "Cerro Porteño" },
              stats: [
                { name: "rank", value: 1 },
                { name: "gamesPlayed", value: 6 },
                { name: "wins", value: 4 },
                { name: "ties", value: 1 },
                { name: "losses", value: 1 },
                { name: "pointsFor", value: 6 },
                { name: "pointsAgainst", value: 2 },
                { name: "pointDifferential", value: 4 },
                { name: "points", value: 13 },
              ],
            },
            {
              team: { id: PALM, displayName: "Palmeiras" },
              stats: [
                { name: "rank", value: 2 },
                { name: "gamesPlayed", value: 6 },
                { name: "wins", value: 3 },
                { name: "ties", value: 2 },
                { name: "losses", value: 1 },
                { name: "pointsFor", value: 10 },
                { name: "pointsAgainst", value: 5 },
                { name: "pointDifferential", value: 5 },
                { name: "points", value: 11 },
              ],
            },
          ],
        },
      },
    ],
  };

  it("finds the group containing Palmeiras and builds its table", () => {
    const g = parsePalmeirasGroup(standings)!;
    expect(g).not.toBeNull();
    expect(g.nameKo).toBe("F조");
    expect(g.table).toHaveLength(2);
    // Sorted by rank.
    expect(g.table[0].teamName).toBe("Cerro Porteño");
    expect(g.table[0].points).toBe(13);
    const palm = g.table.find((r: { isTracked?: boolean }) => r.isTracked)!;
    expect(palm.teamName).toBe("Palmeiras");
    expect(palm.rank).toBe(2);
    expect(palm.won).toBe(3);
    expect(palm.goalDifference).toBe(5);
  });

  it("returns null when Palmeiras is not in any group", () => {
    expect(
      parsePalmeirasGroup({
        children: [
          {
            name: "Group A",
            standings: {
              entries: [{ team: { id: "1", displayName: "X" }, stats: [] }],
            },
          },
        ],
      }),
    ).toBeNull();
    expect(parsePalmeirasGroup({})).toBeNull();
  });
});

describe("parseAggregateNote", () => {
  it("parses a two-legged aggregate advance from Palmeiras' view", () => {
    expect(
      parseAggregateNote("2nd Leg - Palmeiras advance 7-1 on aggregate"),
    ).toEqual({ trackedAdvanced: true, outcomeKo: "합산 7-1 승 · 진출" });
  });
  it("parses an opponent advancing as elimination", () => {
    expect(
      parseAggregateNote("2nd Leg - Fortaleza advance 3-2 on aggregate"),
    ).toEqual({ trackedAdvanced: false, outcomeKo: "합산 3-2 패 · 탈락" });
  });
  it("handles a penalty-shootout decider", () => {
    const r = parseAggregateNote("2nd Leg - Palmeiras win on penalties")!;
    expect(r.trackedAdvanced).toBe(true);
    expect(r.outcomeKo).toContain("승부차기");
  });
  it("returns null while undecided", () => {
    expect(parseAggregateNote("2nd Leg - Tied on aggregate")).toBeNull();
    expect(parseAggregateNote("1st Leg")).toBeNull();
  });
});

describe("buildCampaignTie", () => {
  const CERRO = { id: "2671", displayName: "Cerro Porteño" };
  const PALMTEAM = { id: PALM, displayName: "Palmeiras" };
  // home competitor is always index 0 (gets homeScore); Palmeiras is home ⟺ palmHome.
  const leg = (
    id: string,
    date: string,
    palmHome: boolean,
    homeScore: number,
    awayScore: number,
    note: string,
    state: string,
  ) => ({
    id,
    date,
    season: { type: 13924, slug: "round-of-16" },
    competitions: [
      {
        status: { type: { state } },
        notes: note ? [{ headline: note }] : [],
        competitors: [
          {
            homeAway: "home",
            team: palmHome ? PALMTEAM : CERRO,
            score: { value: homeScore },
          },
          {
            homeAway: "away",
            team: palmHome ? CERRO : PALMTEAM,
            score: { value: awayScore },
          },
        ],
      },
    ],
  });

  it("builds a two-legged upcoming tie with both legs + ongoing result", () => {
    const events = [
      leg("200", "2026-08-19T22:00Z", false, 0, 0, "2nd Leg", "pre"),
      leg("100", "2026-08-12T22:00Z", true, 0, 0, "1st Leg", "pre"),
    ];
    const tie = buildCampaignTie(events, "16강")!;
    expect(tie.roundKo).toBe("16강");
    expect(tie.opponentName).toBe("Cerro Porteño");
    expect(tie.result).toBe("ongoing");
    // Chronologically ordered: 1st leg (home) before 2nd leg (away).
    expect(tie.legs.map((l) => l.legKo)).toEqual(["1차전", "2차전"]);
    expect(tie.legs[0].venue).toBe("home");
    expect(tie.legs[1].venue).toBe("away");
    // No scores attached for unplayed legs.
    expect(tie.legs[0].score).toBeUndefined();
  });

  it("attaches scores for played legs and derives advancement", () => {
    const events = [
      leg("100", "2026-04-23T22:00Z", true, 3, 0, "1st Leg", "post"),
      leg(
        "200",
        "2026-05-14T22:00Z",
        false,
        1,
        4,
        "2nd Leg - Palmeiras advance 7-1 on aggregate",
        "post",
      ),
    ];
    const tie = buildCampaignTie(events, "16강")!;
    expect(tie.result).toBe("advanced");
    expect(tie.outcomeKo).toBe("합산 7-1 승 · 진출");
    expect(tie.legs[0].score).toEqual({ home: 3, away: 0 });
    expect(tie.legs[0].trackedHome).toBe(true);
  });

  it("returns null when no opponent could be resolved", () => {
    expect(buildCampaignTie([], "16강")).toBeNull();
  });
});
