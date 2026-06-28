import type { SeasonSummary, StandingRow } from "@/lib/domain/types";
import { formatGoalDiff } from "@/lib/format/stats";

/**
 * Compact season snapshot. Critically, league-only figures (rank, points, the
 * league W-D-L) are kept separate from the all-competition aggregate so the
 * numbers always reconcile — a fan must never see "17승 7무 2패" sitting next to
 * "승점 41" and conclude the data is broken.
 */
export function QuickStats({
  season,
  tracked,
}: {
  season: SeasonSummary;
  tracked?: StandingRow | null;
}) {
  const cells: { label: string; value: string; sub?: string }[] = [];

  if (tracked) {
    cells.push({
      label: "리그 순위",
      value: `${tracked.rank}위`,
      sub: "Brasileirão",
    });
    cells.push({
      label: "리그 전적",
      value: `${tracked.won}승 ${tracked.drawn}무 ${tracked.lost}패`,
      sub: `승점 ${tracked.points}`,
    });
  }

  cells.push({
    label: "전체 대회 전적",
    value: `${season.wins}승 ${season.draws}무 ${season.losses}패`,
    sub: `${season.matchesPlayed}경기 · ${season.competitionsActive}개 대회`,
  });

  cells.push({
    label: "득실 (전체)",
    value: `${season.goalsFor} : ${season.goalsAgainst}`,
    sub: `득실차 ${formatGoalDiff(season.goalsFor - season.goalsAgainst)}`,
  });

  // No live table (seed fallback): fall back to showing active-competition count
  // so the grid stays balanced.
  if (!tracked) {
    cells.push({
      label: "참가 대회",
      value: `${season.competitionsActive}개`,
      sub: "진행 중",
    });
  }

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label} className="pm-card p-3 text-center">
          <dt className="text-xs text-[var(--pm-muted)]">{c.label}</dt>
          <dd className="mt-0.5 text-lg font-extrabold text-[var(--pm-primary-text)]">
            {c.value}
          </dd>
          {c.sub ? (
            <dd className="text-[11px] text-[var(--pm-muted)]">{c.sub}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
