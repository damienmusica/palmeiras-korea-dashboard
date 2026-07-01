import { describe, expect, it } from "vitest";
import { displayStadiumName } from "./stadium-naming";

describe("displayStadiumName", () => {
  it("renames Allianz Parque to Nubank Parque on/after 2026-05-04", () => {
    expect(displayStadiumName("Allianz Parque", "2026-05-04T19:00Z")).toBe(
      "Nubank Parque",
    );
    expect(displayStadiumName("Allianz Parque", "2026-05-31T19:00Z")).toBe(
      "Nubank Parque",
    );
  });

  it("keeps the historical name for matches played before the rename", () => {
    expect(displayStadiumName("Allianz Parque", "2026-05-03T19:00Z")).toBe(
      "Allianz Parque",
    );
    expect(displayStadiumName("Allianz Parque", "2025-11-01T19:00Z")).toBe(
      "Allianz Parque",
    );
  });

  it("treats a missing kickoff as current (renamed)", () => {
    expect(displayStadiumName("Allianz Parque", undefined)).toBe(
      "Nubank Parque",
    );
  });

  it("passes every other stadium through untouched", () => {
    expect(displayStadiumName("Arena Barueri", "2026-05-17T19:00Z")).toBe(
      "Arena Barueri",
    );
    expect(displayStadiumName("Estadio do Maracana", undefined)).toBe(
      "Estadio do Maracana",
    );
    expect(displayStadiumName(undefined, "2026-05-31T19:00Z")).toBeUndefined();
  });
});
