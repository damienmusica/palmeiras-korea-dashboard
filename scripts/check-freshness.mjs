// =============================================================================
// Snapshot health check — the reliability safety net.
//
//   npm run check        (or: node scripts/check-freshness.mjs)
//
// The ingest script never throws (it logs + exits 0 so a flaky feed can't break
// the cron). The flip side is *silent rot*: one feed can quietly fail for hours
// while the cron stays green with stale data. This check closes that gap by
// validating every committed data/*.json for:
//   • freshness — `fetchedAt` age vs a per-feed budget (the cron is ~30 min, so a
//     feed that hasn't refreshed in many hours = a real, silent failure), and
//   • sanity   — array present, a minimum row count, required fields on a sample.
//
// It exits NON-ZERO on any FAIL. Wired as the last step of the refresh workflow,
// a failure turns silent rot into a red run + the automatic GitHub failure email
// to the repo owner. (A *totally* dead cron can't run this — that's what the
// optional external dead-man's-switch in docs/FREE-PIPELINE.md is for.)
//
// Pure helpers are exported (entry-guarded) so unit tests can import this module
// without reading the filesystem or exiting the process.
// =============================================================================

import { readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = process.env.SNAPSHOT_DIR || join(process.cwd(), "data");

// Per-snapshot policy. maxAgeMin: oldest `fetchedAt` tolerated before FAIL.
// Every successful ingest step rewrites `fetchedAt`, so age only grows when that
// feed's step keeps failing (or the whole cron is down) — 6 h is ~12 missed
// 30-min cycles. `optional` files may be legitimately absent (off-season) → WARN.
// `sample` asserts required fields on the first row to catch silent schema drift.
export const SNAPSHOT_POLICY = [
  {
    file: "news.json",
    arrayKey: "items",
    minItems: 1,
    maxAgeMin: 360,
    sample: ["title", "url"],
  },
  {
    file: "standings.json",
    arrayKey: "table",
    minItems: 10,
    maxAgeMin: 360,
    sample: ["teamId", "points"],
  },
  {
    file: "matches.json",
    arrayKey: "items",
    minItems: 10,
    maxAgeMin: 360,
    sample: ["id", "home", "away"],
  },
  {
    file: "competitions.json",
    arrayKey: "campaigns",
    minItems: 1,
    maxAgeMin: 1440,
    optional: true,
    sample: ["competition"],
  },
  {
    file: "squad.json",
    arrayKey: "players",
    minItems: 11,
    maxAgeMin: 1440,
    sample: ["id", "name"],
  },
];

/** Minutes between an ISO timestamp and `now` (Infinity if unparseable). */
export function ageMinutes(fetchedAt, now) {
  const t = new Date(fetchedAt ?? 0).getTime();
  if (!Number.isFinite(t) || t === 0) return Infinity;
  return (now - t) / 60000;
}

/**
 * Evaluate one snapshot against its policy. Pure — takes the parsed object (or
 * null when the file is missing/invalid JSON) and returns a structured verdict.
 * level: "ok" | "warn" | "fail".
 */
export function evaluateSnapshot(policy, snap, now) {
  const problems = [];
  if (snap === null) {
    // Missing/invalid file: WARN for optional feeds, FAIL otherwise.
    return {
      file: policy.file,
      level: policy.optional ? "warn" : "fail",
      ageMin: Infinity,
      count: 0,
      problems: [
        policy.optional
          ? "snapshot absent (optional — ok off-season)"
          : "snapshot missing or invalid JSON",
      ],
    };
  }

  const rows = Array.isArray(snap[policy.arrayKey])
    ? snap[policy.arrayKey]
    : null;
  if (rows === null) {
    problems.push(`"${policy.arrayKey}" is not an array`);
  } else if (rows.length < policy.minItems) {
    problems.push(`only ${rows.length} row(s) (expected ≥ ${policy.minItems})`);
  } else if (policy.sample) {
    const first = rows[0] ?? {};
    const missing = policy.sample.filter(
      (k) => first[k] === undefined || first[k] === null,
    );
    if (missing.length) {
      problems.push(`row[0] missing field(s): ${missing.join(", ")}`);
    }
  }

  const age = ageMinutes(snap.fetchedAt, now);
  if (!Number.isFinite(age)) {
    problems.push("missing/invalid fetchedAt");
  } else if (age > policy.maxAgeMin) {
    problems.push(
      `stale: ${Math.round(age)} min old (budget ${policy.maxAgeMin} min)`,
    );
  }

  return {
    file: policy.file,
    level: problems.length ? "fail" : "ok",
    ageMin: Number.isFinite(age) ? Math.round(age) : Infinity,
    count: rows?.length ?? 0,
    problems,
  };
}

/** Overall worst level across results: "fail" > "warn" > "ok". */
export function worstLevel(results) {
  if (results.some((r) => r.level === "fail")) return "fail";
  if (results.some((r) => r.level === "warn")) return "warn";
  return "ok";
}

// --- runner -----------------------------------------------------------------

function readSnapshot(file) {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
  } catch {
    return null;
  }
}

function run(now = Date.now()) {
  const results = SNAPSHOT_POLICY.map((p) =>
    evaluateSnapshot(p, readSnapshot(p.file), now),
  );
  const icon = { ok: "✓", warn: "•", fail: "✗" };
  for (const r of results) {
    const detail = r.problems.length ? ` — ${r.problems.join("; ")}` : "";
    const meta = r.count ? ` (${r.count} rows, ${r.ageMin}m)` : "";
    console.log(`[check] ${icon[r.level]} ${r.file}${meta}${detail}`);
  }
  const overall = worstLevel(results);
  if (overall === "fail") {
    console.error(
      "[check] FAIL — a snapshot is stale, empty, or malformed (a feed is silently failing). See lines above.",
    );
    process.exit(1);
  }
  console.log(
    `[check] ${overall === "warn" ? "OK (with warnings)" : "all snapshots healthy"}`,
  );
}

const invokedDirectly = (() => {
  try {
    return (
      Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
    );
  } catch {
    return false;
  }
})();

if (invokedDirectly) run();
