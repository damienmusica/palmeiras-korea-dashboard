import { describe, it, expect } from "vitest";
import type { LineupPlayer } from "@/lib/domain/types";
import {
  formationBands,
  distributeByFormation,
} from "@/components/match/FormationPitch";

function p(name: string, pos: string, formationPlace: number): LineupPlayer {
  return {
    name,
    nameKo: name,
    pos,
    line: "MID",
    starter: true,
    formationPlace,
  };
}

describe("formationBands", () => {
  it("parses a valid 10-outfield formation", () => {
    expect(formationBands("4-2-3-1")).toEqual([4, 2, 3, 1]);
    expect(formationBands("4-4-2")).toEqual([4, 4, 2]);
    expect(formationBands("3-4-2-1")).toEqual([3, 4, 2, 1]);
  });
  it("rejects formations that don't sum to 10 outfield, or are malformed", () => {
    expect(formationBands("4-4-3")).toBeNull(); // sums to 11
    expect(formationBands("")).toBeNull();
    expect(formationBands(undefined)).toBeNull();
    expect(formationBands("abc")).toBeNull();
  });
});

describe("distributeByFormation", () => {
  // Real ESPN 4-2-3-1 (Atlético-MG vs Palmeiras) — formationPlace interleaves a
  // midfielder (LM, fp=4) among the defenders, so depth must come from position,
  // not formationPlace.
  const xi: LineupPlayer[] = [
    p("Éverson", "G", 1),
    p("Alan Franco", "RB", 2),
    p("Renan Lodi", "LB", 3),
    p("Maycon", "LM", 4),
    p("Ruan", "CD-R", 5),
    p("Júnior Alonso", "CD-L", 6),
    p("Bernard", "AM-R", 7),
    p("Igor Gomes", "RM", 8),
    p("Hulk", "F", 9),
    p("Victor Hugo", "AM", 10),
    p("Dudu", "AM-L", 11),
  ];

  it("renders bands that match the formation numbers, not coarse buckets", () => {
    const d = distributeByFormation(xi, "4-2-3-1")!;
    expect(d).not.toBeNull();
    expect(d.gk.name).toBe("Éverson");
    expect(d.rows.map((r) => r.length)).toEqual([4, 2, 3, 1]); // 4-2-3-1, not 4-5-1
    // Back four are the actual defenders.
    expect(d.rows[0].map((x) => x.name).sort()).toEqual(
      ["Alan Franco", "Júnior Alonso", "Renan Lodi", "Ruan"].sort(),
    );
    // The lone striker sits in the front band.
    expect(d.rows[3].map((x) => x.name)).toEqual(["Hulk"]);
    // The double pivot is the two side/central mids, not the attacking trio.
    expect(d.rows[1].map((x) => x.name).sort()).toEqual(
      ["Igor Gomes", "Maycon"].sort(),
    );
  });

  it("falls back (null) for an unparseable or wrong-size XI", () => {
    expect(distributeByFormation(xi, "weird")).toBeNull();
    expect(distributeByFormation(xi.slice(0, 9), "4-2-3-1")).toBeNull();
  });
});
