import { describe, expect, it } from "vitest";
import {
  OVERRIDES,
  availabilityOverride,
} from "./palmeiras-availability-overrides";
import { normKey } from "@/lib/i18n/ptKo";

// The override list is maintained by hand and is empty whenever no player has a
// confirmed non-"available" status, so these assert the lookup contract over
// whatever entries exist rather than naming a specific player.
describe("availabilityOverride", () => {
  it("returns null for a player with no known override", () => {
    expect(availabilityOverride("Gustavo Gómez")).toBeNull();
  });

  it("stores every entry under an already-normalized key", () => {
    for (const o of OVERRIDES) {
      expect(o.key).toBe(normKey(o.key));
      expect(o.statusNoteKo).toBeTruthy();
      expect(o.evidence).toBeTruthy();
    }
  });

  it("matches every entry regardless of accent/case (normKey)", () => {
    for (const o of OVERRIDES) {
      expect(availabilityOverride(o.key)?.status).toBe(o.status);
      expect(availabilityOverride(o.key.toUpperCase())?.status).toBe(o.status);
    }
  });
});
