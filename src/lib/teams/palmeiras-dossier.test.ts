import { describe, it, expect } from "vitest";
import {
  getDossier,
  hasEditorial,
  hasCareerFacts,
} from "@/lib/teams/palmeiras-dossier";

// These tests guard the build-time, web-verified career/transfer depth (P1-2).
// They assert structure + the no-fabrication discipline, NOT specific prose, so
// editorial wording can evolve without breaking the suite.

describe("player dossiers — structured career facts", () => {
  // Live-roster display names (incl. abbreviated initials) that should resolve
  // to a curated dossier carrying verified career facts.
  const REGULARS = [
    "Vitor Roque",
    "Felipe Anderson",
    "Andreas Pereira",
    "G. Gómez", // abbreviated alias → gustavogomez
    "J. Piquerez",
    "J. López",
    "J. Arias",
    "Maurício",
    "Murilo",
    "Bruno Fuchs",
    "Carlos Miguel",
    "R. Sosa",
    "A. Giay",
    "Khellven",
    "Jefté",
    "Allan",
    "Lucas Evangelista",
    "Paulinho",
    "Marlon Freitas",
  ];

  it("resolves a dossier with career facts for every targeted regular", () => {
    for (const name of REGULARS) {
      const d = getDossier(name);
      expect(d, `dossier for ${name}`).not.toBeNull();
      expect(hasCareerFacts(d!), `career facts for ${name}`).toBe(true);
    }
  });

  it("every targeted regular has a career path + a contract or transfer note", () => {
    for (const name of REGULARS) {
      const d = getDossier(name)!;
      expect(d.careerKo, `careerKo for ${name}`).toBeTruthy();
      // At least one of transfer/contract is always present.
      expect(
        Boolean(d.transfersKo) || Boolean(d.contractKo),
        `transfer/contract for ${name}`,
      ).toBe(true);
    }
  });

  it("never stores a market-value cell (no free trustworthy source)", () => {
    // Fabrication guard: market value must NEVER appear in any structured field.
    for (const name of REGULARS) {
      const d = getDossier(name)!;
      const blob = [d.careerKo, d.transfersKo, d.nationalTeamKo, d.contractKo]
        .filter(Boolean)
        .join(" ");
      expect(blob, `market-value leak for ${name}`).not.toMatch(/시장\s*가치/);
    }
  });

  it("contract notes read as a year/extension, not an invented value", () => {
    for (const name of REGULARS) {
      const c = getDossier(name)!.contractKo;
      if (!c) continue; // contract omitted when unverifiable — that's allowed
      expect(c, `contract shape for ${name}`).toMatch(/계약|20\d\d/);
    }
  });

  it("gives the allowlisted Sub-20 (Rafael Coutinho) a real dossier, not a template", () => {
    const d = getDossier("Rafael Coutinho");
    expect(d).not.toBeNull();
    expect(hasEditorial(d!)).toBe(true);
    expect(d!.careerKo).toMatch(/유스|Sub-20/);
    // No fabricated senior transfer/contract for a youth player.
    expect(d!.transfersKo).toBeUndefined();
    expect(d!.contractKo).toBeUndefined();
  });

  it("corrects Flaco López's birthdate to the verified 2000-12-06", () => {
    expect(getDossier("J. López")!.birthDate).toBe("2000-12-06");
  });
});
