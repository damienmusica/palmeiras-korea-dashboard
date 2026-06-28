import { describe, it, expect } from "vitest";
// Pure helpers from the keyless safety-net script (entry-guarded — importing
// does not read the filesystem or exit the process).
import {
  ageMinutes,
  evaluateSnapshot,
  worstLevel,
} from "../../../scripts/check-freshness.mjs";

const NOW = new Date("2026-06-29T12:00:00.000Z").getTime();
const minsAgo = (m: number) => new Date(NOW - m * 60000).toISOString();

const POLICY = {
  file: "matches.json",
  arrayKey: "items",
  minItems: 2,
  maxAgeMin: 360,
  sample: ["id", "home"],
};

describe("ageMinutes", () => {
  it("computes minutes since a timestamp", () => {
    expect(ageMinutes(minsAgo(90), NOW)).toBeCloseTo(90, 5);
  });
  it("returns Infinity for missing/invalid timestamps", () => {
    expect(ageMinutes(undefined, NOW)).toBe(Infinity);
    expect(ageMinutes("not-a-date", NOW)).toBe(Infinity);
  });
});

describe("evaluateSnapshot", () => {
  const okSnap = {
    fetchedAt: minsAgo(20),
    items: [
      { id: "a", home: {} },
      { id: "b", home: {} },
    ],
  };

  it("passes a fresh, well-formed snapshot", () => {
    const r = evaluateSnapshot(POLICY, okSnap, NOW);
    expect(r.level).toBe("ok");
    expect(r.problems).toEqual([]);
    expect(r.count).toBe(2);
  });

  it("fails a stale snapshot (age over budget)", () => {
    const r = evaluateSnapshot(POLICY, { ...okSnap, fetchedAt: minsAgo(400) }, NOW);
    expect(r.level).toBe("fail");
    expect(r.problems.join(" ")).toMatch(/stale/);
  });

  it("fails when there are too few rows", () => {
    const r = evaluateSnapshot(POLICY, { ...okSnap, items: [okSnap.items[0]] }, NOW);
    expect(r.level).toBe("fail");
    expect(r.problems.join(" ")).toMatch(/row/);
  });

  it("fails when a required sample field is missing (schema drift)", () => {
    const r = evaluateSnapshot(
      POLICY,
      { ...okSnap, items: [{ id: "a" }, { id: "b" }] },
      NOW,
    );
    expect(r.level).toBe("fail");
    expect(r.problems.join(" ")).toMatch(/home/);
  });

  it("fails when the array key is missing/not an array", () => {
    const r = evaluateSnapshot(POLICY, { fetchedAt: minsAgo(20) }, NOW);
    expect(r.level).toBe("fail");
  });

  it("fails a missing required snapshot, but only WARNs an optional one", () => {
    expect(evaluateSnapshot(POLICY, null, NOW).level).toBe("fail");
    expect(
      evaluateSnapshot({ ...POLICY, optional: true }, null, NOW).level,
    ).toBe("warn");
  });
});

describe("worstLevel", () => {
  it("escalates fail > warn > ok", () => {
    expect(worstLevel([{ level: "ok" }, { level: "warn" }])).toBe("warn");
    expect(worstLevel([{ level: "ok" }, { level: "fail" }, { level: "warn" }])).toBe(
      "fail",
    );
    expect(worstLevel([{ level: "ok" }, { level: "ok" }])).toBe("ok");
  });
});
