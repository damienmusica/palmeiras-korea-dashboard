import { describe, it, expect } from "vitest";
import {
  classifyPlayer,
  gateSquad,
  hasSeniorStats,
  PLAUSIBLE_NATIONALITIES,
} from "@/lib/data/squad-integrity";
import type { Player } from "@/lib/domain/types";

function mkPlayer(over: Partial<Player>): Player {
  return {
    id: "x",
    name: "Test Player",
    nameKo: "테스트",
    positionGroup: "MF",
    position: "Midfielder",
    positionKo: "미드필더",
    nationality: "BR",
    nationalityKo: "브라질",
    availability: "available",
    ...over,
  };
}

const seniorStat = {
  season: "2026",
  competition: "브라질 세리이 A",
  appearances: 10,
  goals: 1,
  assists: 0,
};

describe("classifyPlayer", () => {
  it("confirms a player corroborated by ESPN stats (cross-verification)", () => {
    const p = mkPlayer({ name: "Maurício", stats: [seniorStat] });
    expect(classifyPlayer(p).confidence).toBe("confirmed");
  });

  it("confirms even a 0-appearance backup when ESPN lists them", () => {
    // Aranha: real backup GK, ESPN-matched, 0 apps — still confirmed.
    const p = mkPlayer({
      name: "Aranha",
      positionGroup: "GK",
      stats: [{ ...seniorStat, appearances: 0, goals: 0 }],
    });
    expect(classifyPlayer(p).confidence).toBe("confirmed");
  });

  it("REJECTS the Ghareeb phantom via the manual blocklist", () => {
    // No stats + Syria nationality + blocklisted.
    const p = mkPlayer({
      name: "Abd Al Qader Ghareeb",
      nationality: "SY",
      nationalityKo: "시리아",
      stats: undefined,
    });
    const c = classifyPlayer(p);
    expect(c.confidence).toBe("rejected");
    expect(c.noteKo).toMatch(/교차검증/);
  });

  it("REJECTS a single-feed entry with out-of-context nationality (sanity rule)", () => {
    // Not on any override list, no stats, implausible nationality → reject.
    const p = mkPlayer({
      name: "Phantom Onefeed",
      nationality: "SY",
      nationalityKo: "시리아",
      stats: undefined,
    });
    expect(classifyPlayer(p).confidence).toBe("rejected");
  });

  it("never rejects on nationality alone — an unusual nationality WITH stats is confirmed", () => {
    const p = mkPlayer({
      name: "Legit Import",
      nationality: "SY",
      nationalityKo: "시리아",
      stats: [seniorStat],
    });
    expect(classifyPlayer(p).confidence).toBe("confirmed");
  });

  it("flags (not deletes) a single-feed entry with a plausible nationality", () => {
    const p = mkPlayer({
      name: "Unknown Brazilian",
      nationality: "BR",
      stats: undefined,
    });
    const c = classifyPlayer(p);
    expect(c.confidence).toBe("unverified");
    expect(c.noteKo).toMatch(/확인|교차검증/);
  });

  it("vouches for a real youth player via the manual allowlist with an honest tier", () => {
    // Rafael Coutinho: no senior stats but a real Sub-20 player.
    const p = mkPlayer({
      name: "Rafael Coutinho",
      nationality: "BR",
      stats: undefined,
    });
    const c = classifyPlayer(p);
    expect(c.confidence).toBe("confirmed");
    expect(c.tierKo).toBe("유스(Sub-20)");
  });
});

describe("hasSeniorStats", () => {
  it("is false for no stats / empty", () => {
    expect(hasSeniorStats(mkPlayer({ stats: undefined }))).toBe(false);
    expect(hasSeniorStats(mkPlayer({ stats: [] }))).toBe(false);
  });
  it("is true when a season entry exists", () => {
    expect(hasSeniorStats(mkPlayer({ stats: [seniorStat] }))).toBe(true);
  });
});

describe("gateSquad", () => {
  it("drops rejected players, tags the rest, and reports what it hid", () => {
    const roster = [
      mkPlayer({ id: "1", name: "Maurício", stats: [seniorStat] }),
      mkPlayer({
        id: "2",
        name: "Abd Al Qader Ghareeb",
        nationality: "SY",
        stats: undefined,
      }),
      mkPlayer({ id: "3", name: "Rafael Coutinho", stats: undefined }),
    ];
    const { players, hidden } = gateSquad(roster);
    expect(players.map((p) => p.id)).toEqual(["1", "3"]);
    expect(hidden.map((h) => h.name)).toEqual(["Abd Al Qader Ghareeb"]);
    expect(players[0].confidence).toBe("confirmed");
    expect(players[1].tierKo).toBe("유스(Sub-20)");
  });

  it("PLAUSIBLE_NATIONALITIES covers the CONMEBOL core", () => {
    for (const c of ["BR", "AR", "UY", "PY", "CO"]) {
      expect(PLAUSIBLE_NATIONALITIES.has(c)).toBe(true);
    }
    expect(PLAUSIBLE_NATIONALITIES.has("SY")).toBe(false);
  });
});
