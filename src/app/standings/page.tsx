import type { Metadata } from "next";
import type { Player } from "@/lib/domain/types";
import { getStandings, getMatches, getSquad } from "@/lib/adapters";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";
import { competitionContext } from "@/lib/interpret/competitions";
import { aggregateStats, recentForm } from "@/lib/format/stats";
import { ACTIVE_TEAM_ID } from "@/lib/teams";

interface Leader {
  playerName: string;
  playerNameKo: string;
  value: number;
}

/** Current-season Palmeiras leaders for a stat, from the real squad snapshot. */
function squadLeaders(players: Player[], key: "goals" | "assists"): Leader[] {
  return players
    .map((p) => ({
      playerName: p.name,
      playerNameKo: p.nameKo,
      value: aggregateStats(p.stats)?.[key] ?? 0,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export const metadata: Metadata = {
  title: "순위·기록",
  description:
    "브라질레이렁 순위표와 득점·도움 순위를 한국어로 정리하고, 대회의 의미를 함께 설명합니다.",
};

export const revalidate = 300;

export default async function StandingsPage() {
  const [res, matchesRes, squadRes] = await Promise.all([
    getStandings(),
    getMatches(),
    getSquad(),
  ]);
  // ESPN's standings feed carries no recent-form string, so derive the tracked
  // team's last-5 from the fixtures snapshot (others stay blank — honest, since
  // we don't have every club's match log).
  const trackedForm = recentForm(matchesRes.data, ACTIVE_TEAM_ID, 5);
  const s = {
    ...res.data,
    table: res.data.table.map((r) =>
      r.isTracked && r.form.length === 0 ? { ...r, form: trackedForm } : r,
    ),
  };
  const ctx = competitionContext(s.competition.id);
  const tracked = s.table.find((r) => r.isTracked);

  // Individual records: show the tracked team's CURRENT-season scorers/assisters
  // from the real squad snapshot (ESPN), instead of a stale league-wide list.
  const topScorers = squadLeaders(squadRes.data.players, "goals");
  const topAssisters = squadLeaders(squadRes.data.players, "assists");
  const recordsSeason =
    squadRes.data.players.find((p) => p.stats?.length)?.stats?.[0]?.season ??
    s.season;

  return (
    <div className="space-y-5">
      <SectionHeading
        title="순위 · 기록"
        subtitle={`${s.competition.nameKo} · ${s.season} 시즌`}
        source={
          <FreshnessBadge
            origin={res.origin}
            source={res.source}
            fetchedAt={res.fetchedAt}
            fellBack={res.fellBack}
            note={res.note}
          />
        }
      />

      <div className="rounded-xl border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/[0.06] p-3 text-sm">
        <p className="font-bold text-[var(--pm-primary)]">{ctx.taglineKo}</p>
        <p className="mt-1 leading-relaxed">{ctx.explainerKo}</p>
        {tracked ? (
          <p className="mt-2 font-semibold">
            📍 현재 파우메이라스는 <b>{tracked.rank}위</b> (승점{" "}
            {tracked.points}, {tracked.won}승 {tracked.drawn}무 {tracked.lost}
            패)
          </p>
        ) : null}
      </div>

      <StandingsTable standings={s} />

      {/* Palmeiras current-season scorers / assisters (real squad data) */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">파우메이라스 개인 기록</h2>
        <span className="pm-chip bg-black/5 text-[var(--pm-muted)]">
          {recordsSeason} 시즌 · 세리이 A
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LeaderCard title="⚽ 팀 내 득점" rows={topScorers} unit="골" />
        <LeaderCard title="🅰️ 팀 내 도움" rows={topAssisters} unit="도움" />
      </div>
      <p className="text-xs text-[var(--pm-muted)]">
        ※ 순위표는 위 배지의 출처·시점 기준입니다(소스 장애 시 시드 데이터로
        자동 대체되며 그렇게 표기됩니다). 개인 기록은 파우메이라스 선수단의 현재
        시즌 리그(세리이 A) 출전 기준이며, 리그 전체 득점왕은 공식 출처를
        확인하세요.
      </p>
    </div>
  );
}

function LeaderCard({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: { playerName: string; playerNameKo: string; value: number }[];
  unit: string;
}) {
  return (
    <section className="pm-card p-4">
      <h2 className="mb-2 font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm italic text-[var(--pm-muted)]">
          현재 데이터 소스에서 득점·도움 순위를 제공하지 않습니다.
        </p>
      ) : null}
      <ol className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={r.playerName} className="flex items-center gap-2 text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-black/5 text-xs font-bold">
              {i + 1}
            </span>
            <span className="flex-1 truncate">
              {r.playerNameKo}{" "}
              <span className="text-xs text-[var(--pm-muted)]">
                {r.playerName}
              </span>
            </span>
            <span className="font-extrabold text-[var(--pm-primary)] tabular-nums">
              {r.value}
              <span className="ml-0.5 text-xs font-normal text-[var(--pm-muted)]">
                {unit}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
