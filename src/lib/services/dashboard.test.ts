import { describe, it, expect } from "vitest";
import { buildDashboard } from "./dashboard";
import { buildBriefing } from "@/lib/interpret/briefing";
import { PALMEIRAS, BRASILEIRAO } from "@/lib/teams/palmeiras";
import type { Match } from "@/lib/domain/types";
import {
  SEED_MATCHES,
  SEED_NEWS,
  SEED_PLAYERS,
  SEED_STANDINGS,
} from "@/lib/data/palmeiras-seed";

const NOW = new Date("2026-06-23T00:00:00.000Z");

/** Minimal match factory for targeted scheduling-logic tests. */
function match(
  over: Partial<Match> & Pick<Match, "id" | "kickoff" | "status">,
): Match {
  return {
    competition: BRASILEIRAO,
    venue: "home",
    home: { id: PALMEIRAS.id, name: "Palmeiras", nameKo: "파우메이라스" },
    away: { id: "x", name: "X", nameKo: "엑스" },
    ...over,
  };
}

describe("buildDashboard", () => {
  const model = buildDashboard(
    PALMEIRAS.id,
    SEED_MATCHES,
    SEED_NEWS,
    SEED_STANDINGS,
    NOW,
  );

  it("selects the soonest upcoming match as nextMatch", () => {
    expect(model.nextMatch).not.toBeNull();
    expect(new Date(model.nextMatch!.kickoff).getTime()).toBeGreaterThanOrEqual(
      NOW.getTime(),
    );
    // Next seed fixture is vs Corinthians on 2026-06-25.
    expect(model.nextMatch!.id).toBe("m-2026-06-25");
  });

  it("selects the most recent finished match as lastResult", () => {
    expect(model.lastResult?.status).toBe("finished");
    // Most recent finished is the Libertadores game on 2026-06-19.
    expect(model.lastResult!.id).toBe("m-2026-06-19");
  });

  it("computes a recent form of up to 5 results", () => {
    expect(model.form.length).toBeGreaterThan(0);
    expect(model.form.length).toBeLessThanOrEqual(5);
  });
});

describe("buildDashboard — in-progress match handling", () => {
  // Regression: a live match (kickoff in the past, status !== finished) used to
  // fall out of BOTH the upcoming and finished buckets and silently vanish.
  const now = new Date("2026-06-23T20:00:00.000Z");
  const matches: Match[] = [
    match({
      id: "past-finished",
      kickoff: "2026-06-20T20:00:00.000Z",
      status: "finished",
      score: { home: 2, away: 0 },
    }),
    match({
      id: "live-now",
      kickoff: "2026-06-23T19:00:00.000Z", // kicked off 1h ago
      status: "live",
      score: { home: 1, away: 1 },
    }),
    match({
      id: "future",
      kickoff: "2026-06-27T20:00:00.000Z",
      status: "scheduled",
    }),
  ];
  const model = buildDashboard(PALMEIRAS.id, matches, [], null, now);

  it("surfaces the in-progress match as liveMatch", () => {
    expect(model.liveMatch?.id).toBe("live-now");
  });

  it("does not show the live match as the next match", () => {
    expect(model.nextMatch?.id).toBe("future");
  });

  it("keeps the most recent finished (scored) match as lastResult", () => {
    expect(model.lastResult?.id).toBe("past-finished");
  });

  it("treats a scheduled match whose kickoff just passed as in-progress", () => {
    const lagged = buildDashboard(
      PALMEIRAS.id,
      [
        match({
          id: "kicked-off",
          kickoff: "2026-06-23T19:30:00.000Z", // 30m ago, feed not flipped
          status: "scheduled",
        }),
      ],
      [],
      null,
      now,
    );
    expect(lagged.liveMatch?.id).toBe("kicked-off");
    expect(lagged.nextMatch).toBeNull();
  });
});

describe("buildBriefing", () => {
  const model = buildDashboard(
    PALMEIRAS.id,
    SEED_MATCHES,
    SEED_NEWS,
    SEED_STANDINGS,
    NOW,
  );
  const briefing = buildBriefing(
    PALMEIRAS,
    model,
    SEED_PLAYERS,
    SEED_NEWS,
    NOW,
  );

  it("produces a non-trivial set of briefing items", () => {
    expect(briefing.items.length).toBeGreaterThanOrEqual(5);
    expect(briefing.source).toBe("editorial");
  });

  it("covers the required briefing dimensions", () => {
    const labels = briefing.items.map((i) => i.label);
    expect(labels).toContain("다음 경기");
    expect(labels).toContain("지난 결과");
    expect(labels).toContain("주목할 선수");
    expect(labels).toContain("오늘의 한 줄 상식");
  });

  it("every item has a headline and body", () => {
    for (const item of briefing.items) {
      expect(item.headlineKo.length).toBeGreaterThan(0);
      expect(item.bodyKo.length).toBeGreaterThan(0);
    }
  });
});
