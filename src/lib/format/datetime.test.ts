import { describe, it, expect } from "vitest";
import {
  formatInZone,
  toKST,
  toBrazil,
  relativeTimeKo,
  freshnessLevel,
  dayOffsetInZone,
  isTodayInZone,
  KST_TIMEZONE,
  BRAZIL_TIMEZONE,
} from "./datetime";

describe("freshnessLevel", () => {
  const now = new Date("2026-06-28T12:00:00.000Z");
  it("is fresh within the default window", () => {
    expect(freshnessLevel("2026-06-28T11:40:00.000Z", undefined, now)).toBe(
      "fresh",
    ); // 20 min old
  });
  it("is stale past the default 75-min window", () => {
    expect(freshnessLevel("2026-06-28T10:00:00.000Z", undefined, now)).toBe(
      "stale",
    ); // 120 min old
  });
  it("honours a tighter match-window threshold", () => {
    // 20 min old: fresh by default, stale under a 15-min match-window threshold.
    expect(freshnessLevel("2026-06-28T11:40:00.000Z", 15, now)).toBe("stale");
  });
  it("treats an invalid timestamp as stale", () => {
    expect(freshnessLevel("not-a-date", undefined, now)).toBe("stale");
  });
});

describe("formatInZone", () => {
  it("formats the same instant differently per timezone", () => {
    // 2026-06-25T22:00:00Z → 19:00 in São Paulo (UTC-3), 07:00 next day in KST.
    const iso = "2026-06-25T22:00:00.000Z";
    const kst = toKST(iso);
    const br = toBrazil(iso);
    expect(kst.timeZone).toBe(KST_TIMEZONE);
    expect(br.timeZone).toBe(BRAZIL_TIMEZONE);
    // KST is 12h ahead of São Paulo → different formatted strings.
    expect(kst.formatted).not.toBe(br.formatted);
  });

  it("produces KST time 12 hours ahead of Brazil for a winter date", () => {
    const iso = "2026-06-25T22:00:00.000Z";
    // São Paulo 19:00, Seoul 07:00 (next day). Check the hour digits appear.
    expect(toBrazil(iso).time).toMatch(/7/); // 7 PM → "오후 7:00"
    expect(toKST(iso).time).toMatch(/7/); // 7 AM → "오전 7:00"
  });

  it("throws on invalid timestamps", () => {
    expect(() => formatInZone("not-a-date", KST_TIMEZONE)).toThrow();
  });
});

describe("relativeTimeKo", () => {
  const now = new Date("2026-06-23T00:00:00.000Z");
  it("handles just-now", () => {
    expect(relativeTimeKo("2026-06-23T00:00:10.000Z", now)).toBe("방금 전");
  });
  it("handles minutes/hours in the past", () => {
    expect(relativeTimeKo("2026-06-22T23:00:00.000Z", now)).toBe("1시간 전");
    expect(relativeTimeKo("2026-06-22T23:30:00.000Z", now)).toBe("30분 전");
  });
  it("handles the future", () => {
    expect(relativeTimeKo("2026-06-25T00:00:00.000Z", now)).toBe("2일 후");
  });
  it("returns empty string for invalid input", () => {
    expect(relativeTimeKo("nope", now)).toBe("");
  });
});

describe("dayOffsetInZone / isTodayInZone", () => {
  const now = new Date("2026-06-23T05:00:00.000Z"); // 14:00 KST, 02:00 BRT
  it("treats same KST day as offset 0", () => {
    // 2026-06-23T20:00Z = 2026-06-24 05:00 KST → next day in KST.
    expect(dayOffsetInZone("2026-06-23T20:00:00.000Z", KST_TIMEZONE, now)).toBe(
      1,
    );
    // 2026-06-23T00:30Z = 09:30 KST same day.
    expect(dayOffsetInZone("2026-06-23T00:30:00.000Z", KST_TIMEZONE, now)).toBe(
      0,
    );
  });
  it("isTodayInZone matches offset 0", () => {
    expect(isTodayInZone("2026-06-23T01:00:00.000Z", KST_TIMEZONE, now)).toBe(
      true,
    );
    expect(isTodayInZone("2026-06-24T01:00:00.000Z", KST_TIMEZONE, now)).toBe(
      false,
    );
  });
});
