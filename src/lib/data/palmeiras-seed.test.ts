import { describe, it, expect } from "vitest";
import { SEED_SQUAD } from "@/lib/data/palmeiras-seed";
import { gateSquad, classifyPlayer } from "@/lib/data/squad-integrity";

// The seed is the labeled offline-only fallback. It must never present players
// who have left the club as current — departed *important* players live in the
// Legends section instead. This guards against a stale ex-player creeping back.
const DEPARTED = [
  "Weverton", // → Grêmio 2026
  "Mayke", // contract ended
  "Marcos Rocha", // left
  "Vitor Reis", // → Manchester City 2025
  "Richard Ríos", // → Benfica 2025
  "Aníbal Moreno",
  "Raphael Veiga", // → Club América (loan) 2026
];

describe("SEED_SQUAD honesty", () => {
  it("contains no known-departed players", () => {
    const names = new Set(SEED_SQUAD.players.map((p) => p.name));
    for (const d of DEPARTED) expect(names.has(d)).toBe(false);
  });

  it("every seed player passes the integrity gate (none rejected)", () => {
    const { hidden } = gateSquad(SEED_SQUAD.players);
    expect(hidden).toEqual([]);
    for (const p of SEED_SQUAD.players) {
      expect(classifyPlayer(p).confidence).not.toBe("rejected");
    }
  });

  it("still provides a non-empty fallback squad", () => {
    expect(SEED_SQUAD.players.length).toBeGreaterThan(0);
    expect(SEED_SQUAD.coach.name).toBeTruthy();
  });
});
