// =============================================================================
// Snapshot reader. The free data pipeline (scripts/ingest.mjs, run by GitHub
// Actions on a cron) writes JSON snapshots into /data and commits them. This
// module reads those snapshots at build/request time on the server, turning the
// committed file into the app's "database" — no live API call per request, no
// rate-limit risk, $0. Missing/invalid files return null so the adapters fall
// back to seed data cleanly.
//
// Server-only (uses node:fs). Adapters import this; client components never do.
// =============================================================================

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  DataResult,
  DataOrigin,
  NewsItem,
  Match,
  Standings,
  Squad,
} from "@/lib/domain/types";
import type { RosterEntry } from "@/lib/data/photos";

interface RawSnapshot {
  origin?: string;
  source?: string;
  fetchedAt?: string;
  statsSeason?: string;
  items?: unknown;
  roster?: unknown;
  table?: unknown;
  players?: unknown;
  coach?: unknown;
}

const VALID_ORIGINS: DataOrigin[] = [
  "live",
  "api",
  "rss",
  "cache",
  "seed",
  "mock",
  "manual",
  "editorial",
  "unavailable",
];

/** Snapshot directory. Overridable via SNAPSHOT_DIR (used by tests). */
function snapshotDir(): string {
  return process.env.SNAPSHOT_DIR || join(process.cwd(), "data");
}

function readJson(file: string): RawSnapshot | null {
  try {
    const raw = readFileSync(join(snapshotDir(), file), "utf8");
    return JSON.parse(raw) as RawSnapshot;
  } catch {
    // Missing file or invalid JSON → no snapshot (adapters fall back to seed).
    return null;
  }
}

function toOrigin(value: string | undefined): DataOrigin {
  return VALID_ORIGINS.includes(value as DataOrigin)
    ? (value as DataOrigin)
    : "seed";
}

/**
 * Read the news snapshot written by the ingest pipeline. Returns a DataResult
 * envelope, or null when no usable snapshot exists. Items are returned as-is;
 * the news adapter enriches them (reliability + Korean interpretation).
 */
export function readNewsSnapshot(): DataResult<NewsItem[]> | null {
  const snap = readJson("news.json");
  if (!snap || !Array.isArray(snap.items) || snap.items.length === 0) {
    return null;
  }
  return {
    data: snap.items as NewsItem[],
    origin: toOrigin(snap.origin),
    source: snap.source ?? "data/news.json",
    fetchedAt: snap.fetchedAt ?? new Date(0).toISOString(),
    fellBack: false,
    note: "GitHub Actions 무료 파이프라인이 생성한 스냅샷",
  };
}

/** Read the current-season matches snapshot (ESPN). */
export function readMatchesSnapshot(): DataResult<Match[]> | null {
  const snap = readJson("matches.json");
  if (!snap || !Array.isArray(snap.items) || snap.items.length === 0) {
    return null;
  }
  return {
    data: snap.items as Match[],
    origin: toOrigin(snap.origin),
    source: snap.source ?? "data/matches.json",
    fetchedAt: snap.fetchedAt ?? new Date(0).toISOString(),
    fellBack: false,
    note: "현재 시즌 · 무료 파이프라인 스냅샷",
  };
}

/** Read the current-season standings snapshot (ESPN). */
export function readStandingsSnapshot(): DataResult<Standings> | null {
  const snap = readJson("standings.json") as
    | (RawSnapshot & { table?: unknown })
    | null;
  if (!snap || !Array.isArray(snap.table) || snap.table.length === 0) {
    return null;
  }
  return {
    data: snap as unknown as Standings,
    origin: toOrigin(snap.origin),
    source: snap.source ?? "data/standings.json",
    fetchedAt: snap.fetchedAt ?? new Date(0).toISOString(),
    fellBack: false,
    note: "현재 시즌 · 무료 파이프라인 스냅샷",
  };
}

/** Read the full real squad snapshot (API-Football roster + LLM Korean names). */
export function readSquadSnapshot(): DataResult<Squad> | null {
  const snap = readJson("squad.json");
  if (
    !snap ||
    !Array.isArray(snap.players) ||
    snap.players.length === 0 ||
    !snap.coach
  ) {
    return null;
  }
  const season = snap.statsSeason ? `${snap.statsSeason} 시즌` : "현재 시즌";
  return {
    data: { players: snap.players, coach: snap.coach } as Squad,
    origin: toOrigin(snap.origin),
    source: snap.source ?? "data/squad.json",
    fetchedAt: snap.fetchedAt ?? new Date(0).toISOString(),
    fellBack: false,
    note: `현재 스쿼드 · 무료 파이프라인 스냅샷 (스탯은 ${season} 기준)`,
  };
}

export interface SquadPhotoSnapshot {
  roster: RosterEntry[];
  source: string;
  fetchedAt: string;
}

/**
 * Read the real-roster photo snapshot written by the API-Football ingest.
 * Returns null when absent so the squad falls back to monogram avatars.
 */
export function readSquadPhotos(): SquadPhotoSnapshot | null {
  const snap = readJson("squad-photos.json");
  if (!snap || !Array.isArray(snap.roster) || snap.roster.length === 0) {
    return null;
  }
  return {
    roster: snap.roster as RosterEntry[],
    source: snap.source ?? "API-Football",
    fetchedAt: snap.fetchedAt ?? new Date(0).toISOString(),
  };
}
