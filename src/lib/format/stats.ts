// =============================================================================
// Pure formatting/normalization helpers for stats and player data. Kept free of
// React so they are trivially unit-testable.
// =============================================================================

import type {
  FormResult,
  Match,
  Player,
  PlayerSeasonStats,
  SeasonSummary,
  StandingRow,
} from "@/lib/domain/types";

/** Compute age in whole years from an ISO birthdate. Null when unknown. */
export function ageFromBirthDate(
  birthDate?: string,
  now: Date = new Date(),
): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

/** Korean label for a preferred foot, with a safe default. */
export function footKo(foot?: Player["foot"]): string {
  switch (foot) {
    case "left":
      return "왼발";
    case "right":
      return "오른발";
    case "both":
      return "양발";
    default:
      return "정보 없음";
  }
}

/** Korean label for availability/status. */
export function availabilityKo(status: Player["availability"]): {
  label: string;
  tone: "ok" | "warn" | "info";
} {
  switch (status) {
    case "injured":
      return { label: "부상", tone: "warn" };
    case "suspended":
      return { label: "출전 정지", tone: "warn" };
    case "loan":
      return { label: "임대", tone: "info" };
    case "available":
    default:
      return { label: "출전 가능", tone: "ok" };
  }
}

/** Height formatting, e.g. 184 -> "184cm". Empty when unknown. */
export function heightKo(heightCm?: number): string {
  if (!heightCm || heightCm <= 0) return "";
  return `${heightCm}cm`;
}

/** Sum a player's season stats across competitions into a single line. */
export function aggregateStats(
  stats: PlayerSeasonStats[] | undefined,
): PlayerSeasonStats | null {
  if (!stats || stats.length === 0) return null;
  return stats.reduce<PlayerSeasonStats>(
    (acc, s) => ({
      season: acc.season || s.season,
      appearances: acc.appearances + (s.appearances || 0),
      goals: acc.goals + (s.goals || 0),
      assists: acc.assists + (s.assists || 0),
      yellowCards: (acc.yellowCards ?? 0) + (s.yellowCards ?? 0),
      redCards: (acc.redCards ?? 0) + (s.redCards ?? 0),
      minutes: (acc.minutes ?? 0) + (s.minutes ?? 0),
      cleanSheets: (acc.cleanSheets ?? 0) + (s.cleanSheets ?? 0),
      saves: (acc.saves ?? 0) + (s.saves ?? 0),
      goalsConceded: (acc.goalsConceded ?? 0) + (s.goalsConceded ?? 0),
    }),
    {
      season: "",
      appearances: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutes: 0,
      cleanSheets: 0,
      saves: 0,
      goalsConceded: 0,
    },
  );
}

/** Win/draw/loss for a finished match from the tracked team's perspective. */
export function resultForTeam(
  match: Match,
  trackedTeamId: string,
): FormResult | null {
  if (match.status !== "finished" || !match.score) return null;
  const isHome = match.home.id === trackedTeamId;
  const isAway = match.away.id === trackedTeamId;
  if (!isHome && !isAway) return null;
  const ourGoals = isHome ? match.score.home : match.score.away;
  const theirGoals = isHome ? match.score.away : match.score.home;
  if (ourGoals > theirGoals) return "W";
  if (ourGoals < theirGoals) return "L";
  return "D";
}

/** Build a recent-form array (most recent last) from finished matches. */
export function recentForm(
  matches: Match[],
  trackedTeamId: string,
  limit = 5,
): FormResult[] {
  return matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .map((m) => resultForTeam(m, trackedTeamId))
    .filter((r): r is FormResult => r !== null)
    .slice(-limit);
}

/** Aggregate a season summary from finished matches for the tracked team. */
export function summarizeSeason(
  matches: Match[],
  trackedTeamId: string,
  season: string,
): SeasonSummary {
  const finished = matches.filter((m) => m.status === "finished" && m.score);
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const comps = new Set<string>();

  for (const m of finished) {
    const isHome = m.home.id === trackedTeamId;
    const isAway = m.away.id === trackedTeamId;
    if (!isHome && !isAway) continue;
    comps.add(m.competition.id);
    const our = isHome ? m.score!.home : m.score!.away;
    const their = isHome ? m.score!.away : m.score!.home;
    goalsFor += our;
    goalsAgainst += their;
    if (our > their) wins += 1;
    else if (our < their) losses += 1;
    else draws += 1;
  }

  return {
    season,
    competitionsActive: comps.size,
    matchesPlayed: wins + draws + losses,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
  };
}

/** Format a goal difference with an explicit sign, e.g. +7 / -3 / 0. */
export function formatGoalDiff(diff: number): string {
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

/** Korean tone for a form letter, used for badge coloring. */
export function formTone(r: FormResult): "win" | "draw" | "loss" {
  if (r === "W") return "win";
  if (r === "D") return "draw";
  return "loss";
}

/** Korean label for a form letter. */
export function formLabelKo(r: FormResult): string {
  if (r === "W") return "승";
  if (r === "D") return "무";
  return "패";
}

/** Sort standings deterministically: points, then GD, then GF. */
export function sortStandings(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName),
  );
}
