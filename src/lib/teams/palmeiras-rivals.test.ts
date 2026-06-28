import { describe, it, expect } from "vitest";
import { PALMEIRAS } from "@/lib/teams/palmeiras";

describe("Palmeiras rivals H2H", () => {
  const withH2H = PALMEIRAS.rivals.filter((r) => r.h2h);

  it("covers the three Paulista rivals", () => {
    expect(withH2H.map((r) => r.name).sort()).toEqual(
      ["Corinthians", "Santos FC", "São Paulo FC"].sort(),
    );
  });

  it("each H2H tally reconciles (won + drawn + lost === played)", () => {
    for (const r of withH2H) {
      const { played, won, drawn, lost } = r.h2h!;
      expect(won + drawn + lost, `${r.name} total`).toBe(played);
      expect(won).toBeGreaterThan(0);
      expect(played).toBeGreaterThan(0);
    }
  });

  it("reflects the verified fact: Palmeiras leads all three series", () => {
    for (const r of withH2H) {
      expect(r.h2h!.won, `${r.name}: Palmeiras should lead`).toBeGreaterThan(
        r.h2h!.lost,
      );
    }
  });

  it("every H2H entry cites a source (no unsourced numbers)", () => {
    for (const r of withH2H) {
      expect(r.h2h!.sourceKo).toMatch(/위키피디아|기준/);
    }
  });
});
