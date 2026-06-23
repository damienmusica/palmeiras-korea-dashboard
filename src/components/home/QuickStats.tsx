import type { SeasonSummary, StandingRow } from "@/lib/domain/types";
import { formatGoalDiff } from "@/lib/format/stats";

/** Compact season snapshot: record, goals, and league position. */
export function QuickStats({
  season,
  tracked,
}: {
  season: SeasonSummary;
  tracked?: StandingRow | null;
}) {
  const cells: { label: string; value: string; sub?: string }[] = [
    {
      label: "리그 순위",
      value: tracked ? `${tracked.rank}위` : "–",
      sub: tracked ? `승점 ${tracked.points}` : undefined,
    },
    {
      label: "시즌 전적",
      value: `${season.wins}승 ${season.draws}무 ${season.losses}패`,
      sub: `${season.matchesPlayed}경기`,
    },
    {
      label: "득실",
      value: `${season.goalsFor} : ${season.goalsAgainst}`,
      sub: `득실차 ${formatGoalDiff(season.goalsFor - season.goalsAgainst)}`,
    },
    {
      label: "참가 대회",
      value: `${season.competitionsActive}개`,
      sub: "진행 중",
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label} className="pm-card p-3 text-center">
          <dt className="text-xs text-[var(--pm-muted)]">{c.label}</dt>
          <dd className="mt-0.5 text-lg font-extrabold text-[var(--pm-primary)]">
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
