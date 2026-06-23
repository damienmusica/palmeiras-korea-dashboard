import { describe, it, expect } from "vitest";
import { attachPhotos, photoFor, buildPhotoIndex } from "./photos";
import type { Player } from "@/lib/domain/types";

const roster = [
  { name: "G. Gómez", number: 15, photo: "https://media/g.png" },
  { name: "J. Piquerez", number: 22, photo: "https://media/p.png" },
  { name: "Estêvão", number: 41, photo: "https://media/e.png" },
  { name: "Felipe Anderson", number: 7, photo: "https://media/f.png" },
  { name: "J. López", number: 9, photo: "https://media/l.png" },
];

function player(p: Partial<Player>): Player {
  return {
    id: "x",
    name: "X",
    nameKo: "엑스",
    positionGroup: "MF",
    position: "MF",
    positionKo: "미드필더",
    nationality: "BR",
    nationalityKo: "브라질",
    availability: "available",
    ...p,
  };
}

describe("photo matching", () => {
  it("matches full name (accent-insensitive)", () => {
    const idx = buildPhotoIndex(roster);
    expect(photoFor(player({ name: "Estêvão" }), idx)).toBe(
      "https://media/e.png",
    );
    expect(photoFor(player({ name: "Felipe Anderson" }), idx)).toBe(
      "https://media/f.png",
    );
  });

  it("matches 'initial + surname' abbreviations", () => {
    const idx = buildPhotoIndex(roster);
    // curated full name vs roster abbreviation
    expect(photoFor(player({ name: "Gustavo Gómez" }), idx)).toBe(
      "https://media/g.png",
    );
    expect(photoFor(player({ name: "Joaquín Piquerez" }), idx)).toBe(
      "https://media/p.png",
    );
    expect(photoFor(player({ name: "José López" }), idx)).toBe(
      "https://media/l.png",
    );
  });

  it("returns undefined for players not in the roster (e.g. transferred)", () => {
    const idx = buildPhotoIndex(roster);
    expect(photoFor(player({ name: "Raphael Veiga" }), idx)).toBeUndefined();
  });

  it("attachPhotos only sets photos on matched players", () => {
    const players = [
      player({ id: "estevao", name: "Estêvão" }),
      player({ id: "veiga", name: "Raphael Veiga" }),
    ];
    const out = attachPhotos(players, roster);
    expect(out.find((p) => p.id === "estevao")?.photo).toBe(
      "https://media/e.png",
    );
    expect(out.find((p) => p.id === "veiga")?.photo).toBeUndefined();
  });

  it("ignores roster entries with unsafe/empty photos", () => {
    const idx = buildPhotoIndex([{ name: "Bad Guy", number: 1, photo: "#" }]);
    expect(photoFor(player({ name: "Bad Guy" }), idx)).toBeUndefined();
  });
});
