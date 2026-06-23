import { describe, it, expect } from "vitest";
import { buildDashboard } from "./dashboard";
import { buildBriefing } from "@/lib/interpret/briefing";
import { PALMEIRAS } from "@/lib/teams/palmeiras";
import {
  SEED_MATCHES,
  SEED_NEWS,
  SEED_PLAYERS,
  SEED_STANDINGS,
} from "@/lib/data/palmeiras-seed";

const NOW = new Date("2026-06-23T00:00:00.000Z");

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
