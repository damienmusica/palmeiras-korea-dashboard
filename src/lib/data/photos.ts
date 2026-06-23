// =============================================================================
// Player photo matching. The free pipeline writes a real API-Football roster
// (name/number/photo) to data/squad-photos.json. The roster uses abbreviated
// forms like "G. Gómez", so we match the curated squad to it by full name AND
// by "initial + surname", accent-insensitive. Name matching (not shirt number)
// is deliberate: a wrong number→photo would show the wrong face, and players who
// left the club simply won't match (correctly keeping the monogram fallback).
// =============================================================================

import type { Player } from "@/lib/domain/types";

export interface RosterEntry {
  name: string;
  number: number | null;
  photo: string;
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function tokens(s: string): string[] {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** "initial + surname" key, e.g. "Gustavo Gómez" / "G. Gómez" → "ggomez". */
function initialSurname(s: string): string | null {
  const t = tokens(s);
  if (t.length < 2) return null;
  return t[0][0] + t[t.length - 1];
}

/** Build a lookup from roster entries to photo URLs (first match wins). */
export function buildPhotoIndex(roster: RosterEntry[]): Map<string, string> {
  const idx = new Map<string, string>();
  for (const r of roster) {
    if (!r.photo || r.photo === "#") continue;
    const full = norm(r.name);
    if (full && !idx.has(full)) idx.set(full, r.photo);
    const il = initialSurname(r.name);
    if (il && !idx.has(il)) idx.set(il, r.photo);
  }
  return idx;
}

/** Find the best photo for a player, or undefined. */
export function photoFor(
  player: Pick<Player, "name" | "fullName">,
  idx: Map<string, string>,
): string | undefined {
  const candidates = [
    norm(player.name),
    player.fullName ? norm(player.fullName) : "",
    initialSurname(player.name) ?? "",
    player.fullName ? (initialSurname(player.fullName) ?? "") : "",
  ].filter(Boolean);
  for (const c of candidates) {
    const hit = idx.get(c);
    if (hit) return hit;
  }
  return undefined;
}

/** Return players with real photos attached where a confident match exists. */
export function attachPhotos(
  players: Player[],
  roster: RosterEntry[],
): Player[] {
  const idx = buildPhotoIndex(roster);
  return players.map((p) => {
    const photo = photoFor(p, idx);
    return photo ? { ...p, photo } : p;
  });
}
