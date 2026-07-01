import { describe, expect, it } from "vitest";
import { availabilityOverride } from "./palmeiras-availability-overrides";

describe("availabilityOverride", () => {
  it("flags Vitor Roque as injured with a status note", () => {
    const o = availabilityOverride("Vitor Roque");
    expect(o?.status).toBe("injured");
    expect(o?.statusNoteKo).toBeTruthy();
  });

  it("returns null for a player with no known override", () => {
    expect(availabilityOverride("Gustavo Gómez")).toBeNull();
  });

  it("matches regardless of accent/case (normKey)", () => {
    expect(availabilityOverride("vitor roque")?.status).toBe("injured");
    expect(availabilityOverride("VITOR ROQUE")?.status).toBe("injured");
  });
});
