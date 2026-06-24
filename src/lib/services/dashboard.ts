// =============================================================================
// Dashboard service. Composes adapter outputs into the derived view-model the
// home page needs: next match, last result, recent form, season summary, and a
// "what changed today" changelog. Pure given its inputs (now is injectable).
// =============================================================================

import type {
  ChangeLogEntry,
  Match,
  NewsItem,
  SeasonSummary,
  Standings,
} from "@/lib/domain/types";
import { recentForm, summarizeSeason } from "@/lib/format/stats";
import { dayOffsetInZone, KST_TIMEZONE } from "@/lib/format/datetime";
import { newsCategory } from "@/lib/interpret/news";
import { SEED_SEASON } from "@/lib/data/palmeiras-seed";

export interface DashboardModel {
  /** A match currently in progress (or just kicked off, feed lagging). */
  liveMatch: Match | null;
  nextMatch: Match | null;
  lastResult: Match | null;
  recentMatches: Match[];
  form: ReturnType<typeof recentForm>;
  season: SeasonSummary;
  changeLog: ChangeLogEntry[];
}

/**
 * A full match plus stoppage time comfortably fits in ~3h. A non-finished match
 * whose kickoff falls inside this trailing window is treated as in-progress —
 * this catches both an explicit "live" status and a "scheduled" match the feed
 * hasn't flipped yet, so an in-progress game never silently disappears from the
 * home view (it previously fell out of both the upcoming and finished buckets).
 */
const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

function isInProgress(m: Match, nowMs: number): boolean {
  if (m.status === "live") return true;
  if (m.status === "finished" || m.status === "postponed") return false;
  const k = new Date(m.kickoff).getTime();
  if (Number.isNaN(k)) return false;
  return k <= nowMs && nowMs - k <= LIVE_WINDOW_MS;
}

export function buildDashboard(
  teamId: string,
  matches: Match[],
  news: NewsItem[],
  standings: Standings | null,
  now: Date = new Date(),
): DashboardModel {
  const nowMs = now.getTime();
  const sorted = [...matches].sort((a, b) =>
    a.kickoff.localeCompare(b.kickoff),
  );

  const liveMatch = sorted.find((m) => isInProgress(m, nowMs)) ?? null;
  const upcoming = sorted.filter(
    (m) =>
      m.status !== "finished" &&
      !isInProgress(m, nowMs) &&
      new Date(m.kickoff).getTime() >= nowMs,
  );
  const finished = sorted.filter((m) => m.status === "finished");

  const nextMatch = upcoming[0] ?? null;
  // The "result" reading needs a score — pick the most recent finished match
  // that actually has one (don't surface a finished-but-scoreless data glitch).
  const lastResult =
    [...finished].reverse().find((m) => m.score) ??
    finished[finished.length - 1] ??
    null;
  const recentMatches = finished.slice(-5).reverse();

  const form = recentForm(matches, teamId, 5);
  const season = summarizeSeason(matches, teamId, SEED_SEASON);

  const changeLog = buildChangeLog(teamId, matches, news, standings, now);

  return {
    liveMatch,
    nextMatch,
    lastResult,
    recentMatches,
    form,
    season,
    changeLog,
  };
}

/** "What changed today" — items dated to the current KST day. */
export function buildChangeLog(
  teamId: string,
  matches: Match[],
  news: NewsItem[],
  standings: Standings | null,
  now: Date = new Date(),
): ChangeLogEntry[] {
  const entries: ChangeLogEntry[] = [];

  for (const m of matches) {
    const offset = dayOffsetInZone(m.kickoff, KST_TIMEZONE, now);
    if (offset !== 0) continue;
    if (m.status === "finished" && m.score) {
      const opp = m.home.id === teamId ? m.away.nameKo : m.home.nameKo;
      entries.push({
        date: m.kickoff,
        category: "match",
        text: `${opp}전 종료: ${m.score.home}-${m.score.away} (${m.competition.shortName})`,
      });
    } else {
      const opp = m.home.id === teamId ? m.away.nameKo : m.home.nameKo;
      entries.push({
        date: m.kickoff,
        category: "match",
        text: `오늘 경기: vs ${opp} (${m.competition.shortName})`,
      });
    }
  }

  for (const n of news) {
    // Keep the flagship "what changed" focused on the senior team.
    if (newsCategory(n) !== "senior") continue;
    const offset = dayOffsetInZone(n.publishedAt, KST_TIMEZONE, now);
    if (offset !== 0) continue;
    entries.push({
      date: n.publishedAt,
      category: "news",
      text: n.summaryKo.slice(0, 80),
    });
  }

  if (standings) {
    const tracked = standings.table.find((r) => r.isTracked);
    if (tracked) {
      entries.push({
        date: now.toISOString(),
        category: "standings",
        text: `${standings.competition.shortName} 현재 ${tracked.rank}위 · 승점 ${tracked.points}`,
      });
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
