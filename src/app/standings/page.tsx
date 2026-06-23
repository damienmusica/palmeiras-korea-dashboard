import type { Metadata } from "next";
import { getStandings, getMatches } from "@/lib/adapters";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";
import { competitionContext } from "@/lib/interpret/competitions";
import { recentForm } from "@/lib/format/stats";
import { ACTIVE_TEAM_ID } from "@/lib/teams";

export const metadata: Metadata = {
  title: "순위·기록",
  description:
    "브라질레이렁 순위표와 득점·도움 순위를 한국어로 정리하고, 대회의 의미를 함께 설명합니다.",
};

export const revalidate = 300;

export default async function StandingsPage() {
  const [res, matchesRes] = await Promise.all([getStandings(), getMatches()]);
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

      {/* Top scorers / assisters */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">개인 기록</h2>
        {s.leadersSeason ? (
          <span className="pm-chip bg-black/5 text-[var(--pm-muted)]">
            {s.leadersSeason} 시즌 기준
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LeaderCard title="⚽ 득점 순위" rows={s.topScorers} unit="골" />
        <LeaderCard title="🅰️ 도움 순위" rows={s.topAssisters} unit="도움" />
      </div>
      <p className="text-xs text-[var(--pm-muted)]">
        ※ 순위표는 위 배지의 출처·시점 기준입니다(소스 장애 시 시드 데이터로
        자동 대체되며 그렇게 표기됩니다). 개인 기록은 무료 소스 한계로 과거
        시즌일 수 있어 시즌을 명시했습니다. 정확한 실시간 기록은 공식 출처를
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
