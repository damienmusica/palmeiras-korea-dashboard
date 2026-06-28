import { describe, it, expect } from "vitest";
// The match-depth parsers live in the keyless ingest script. They are pure and
// exported there; importing the module does NOT run the pipeline (guarded).
import {
  parseClock,
  parseKeyEvents,
  parseLineups,
  lineForPos,
} from "../../../scripts/ingest.mjs";

describe("parseClock", () => {
  it("parses a plain minute", () => {
    expect(parseClock({ clock: { displayValue: "45'" } })).toEqual({
      minute: 45,
      clock: "45'",
    });
  });
  it("folds stoppage time into a sortable minute, keeps the display", () => {
    expect(parseClock({ clock: { displayValue: "90'+2'" } })).toEqual({
      minute: 92,
      clock: "90'+2'",
    });
  });
});

describe("lineForPos", () => {
  it("buckets ESPN abbreviations into pitch lines", () => {
    expect(lineForPos("G")).toBe("GK");
    expect(lineForPos("CD-L")).toBe("DEF");
    expect(lineForPos("LB")).toBe("DEF");
    expect(lineForPos("RB")).toBe("DEF");
    expect(lineForPos("CM")).toBe("MID");
    expect(lineForPos("LM")).toBe("MID");
    expect(lineForPos("DM")).toBe("MID");
    expect(lineForPos("F")).toBe("FWD");
    expect(lineForPos("LF")).toBe("FWD");
    expect(lineForPos("ST")).toBe("FWD");
  });
});

describe("parseKeyEvents", () => {
  const summary = {
    keyEvents: [
      { type: { text: "Kickoff" }, clock: { displayValue: "0'" } },
      {
        type: { text: "Yellow Card" },
        clock: { displayValue: "23'" },
        team: { displayName: "Palmeiras" },
        participants: [{ athlete: { displayName: "Luis Felipe" } }],
      },
      {
        type: { text: "Substitution" },
        clock: { displayValue: "57'" },
        team: { displayName: "Palmeiras" },
        participants: [
          { athlete: { displayName: "Paulinho" } },
          { athlete: { displayName: "Luighi Hanri" } },
        ],
      },
      {
        type: { text: "Goal" },
        scoringPlay: true,
        clock: { displayValue: "65'" },
        team: { displayName: "Palmeiras" },
        participants: [
          { athlete: { displayName: "Paulinho" } },
          { athlete: { displayName: "Felipe Anderson" } },
        ],
      },
      {
        type: { text: "Red Card" },
        clock: { displayValue: "80'" },
        team: { displayName: "Chapecoense" },
        participants: [{ athlete: { displayName: "Italo" } }],
      },
      { type: { text: "Full Time" } }, // ignored
    ],
  };

  it("extracts goals, cards and subs (and ignores markers), minute-sorted", () => {
    const ev = parseKeyEvents(summary, "Palmeiras", "Chapecoense");
    expect(ev.map((e) => e.type)).toEqual(["yellow", "sub", "goal", "red"]);
    expect(ev.map((e) => e.minute)).toEqual([23, 57, 65, 80]);
  });

  it("maps a goal's assister into detail and resolves the side", () => {
    const goal = parseKeyEvents(summary, "Palmeiras", "Chapecoense").find(
      (e) => e.type === "goal",
    )!;
    expect(goal.player).toBe("Paulinho");
    expect(goal.detail).toBe("Felipe Anderson");
    expect(goal.team).toBe("home");
  });

  it("a substitution lists IN as player and OUT as detail", () => {
    const sub = parseKeyEvents(summary, "Palmeiras", "Chapecoense").find(
      (e) => e.type === "sub",
    )!;
    expect(sub.player).toBe("Paulinho"); // came on
    expect(sub.detail).toBe("Luighi Hanri"); // went off
  });

  it("does not attach a detail (assister/out) to a card", () => {
    const red = parseKeyEvents(summary, "Palmeiras", "Chapecoense").find(
      (e) => e.type === "red",
    )!;
    expect(red.player).toBe("Italo");
    expect(red.detail).toBeUndefined();
    expect(red.team).toBe("away");
  });
});

describe("parseLineups", () => {
  // ESPN roster with the real quirk: a STRAY duplicate-name GK row (different
  // id, starter:true, NO formationPlace) that must be dropped from the XI.
  function roster(side: "home" | "away") {
    const slots = [
      { jersey: "1", pos: "G", fp: "1", name: "Keeper" },
      { jersey: "2", pos: "RB", fp: "2", name: "RightBack" },
      { jersey: "3", pos: "LB", fp: "3", name: "LeftBack" },
      { jersey: "4", pos: "CM", fp: "4", name: "Mid4" },
      { jersey: "5", pos: "CD-R", fp: "5", name: "CentreR" },
      { jersey: "6", pos: "CD-L", fp: "6", name: "CentreL" },
      { jersey: "7", pos: "LM", fp: "7", name: "Mid7" },
      { jersey: "8", pos: "RF", fp: "8", name: "Fwd8" },
      { jersey: "9", pos: "F", fp: "9", name: "Striker" },
      { jersey: "10", pos: "RM", fp: "10", name: "Mid10" },
      { jersey: "11", pos: "LF", fp: "11", name: "Fwd11" },
    ].map((s, i) => ({
      starter: true,
      jersey: s.jersey,
      athlete: { id: `${side}-${i}`, displayName: s.name },
      position: { abbreviation: s.pos },
      formationPlace: s.fp,
      subbedOut: { didSub: s.jersey === "11" },
    }));
    const stray = {
      // duplicate-name keeper, different id, no slot → must be excluded
      starter: true,
      jersey: "1",
      athlete: { id: `${side}-stray`, displayName: "Keeper " },
      position: { abbreviation: "G" },
    };
    const bench = [
      {
        starter: false,
        jersey: "20",
        athlete: { id: `${side}-b20`, displayName: "BenchA" },
        position: { abbreviation: "SUB" },
        subbedIn: { didSub: true },
      },
      {
        starter: false,
        jersey: "21",
        athlete: { id: `${side}-b21`, displayName: "BenchB" },
        position: { abbreviation: "SUB" },
      },
    ];
    return { homeAway: side, formation: "4-3-3", roster: [...slots, stray, ...bench] };
  }
  const summary = { rosters: [roster("home"), roster("away")] };

  it("drops the stray duplicate and yields exactly 11 starters per side", () => {
    const lu = parseLineups(summary)!;
    expect(lu.home.starters).toHaveLength(11);
    expect(lu.away.starters).toHaveLength(11);
  });

  it("buckets the 4-3-3 into 1 GK / 4 DEF / 3 MID / 3 FWD", () => {
    const lu = parseLineups(summary)!;
    const count = (line: string) =>
      lu.home.starters.filter((p) => p.line === line).length;
    expect(count("GK")).toBe(1);
    expect(count("DEF")).toBe(4);
    expect(count("MID")).toBe(3);
    expect(count("FWD")).toBe(3);
    expect(lu.home.formation).toBe("4-3-3");
  });

  it("captures bench + sub flags", () => {
    const lu = parseLineups(summary)!;
    expect(lu.home.bench).toHaveLength(2);
    expect(
      lu.home.bench.find((b: { subbedIn?: boolean; name: string }) => b.subbedIn)
        ?.name,
    ).toBe("BenchA");
    expect(
      lu.home.starters.find(
        (p: { subbedOut?: boolean; name: string }) => p.subbedOut,
      )?.name,
    ).toBe("Fwd11");
  });

  it("returns undefined when rosters are absent (honest placeholder)", () => {
    expect(parseLineups({})).toBeUndefined();
    expect(parseLineups({ rosters: [] })).toBeUndefined();
  });
});
