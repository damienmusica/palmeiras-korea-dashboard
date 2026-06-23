import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getSquad, getMatches, getNews } from "@/lib/adapters";
import { playerInsight } from "@/lib/interpret/players";
import { NewsCard } from "@/components/news/NewsCard";
import { relatedNews } from "@/lib/interpret/relate";
import {
  ageFromBirthDate,
  availabilityKo,
  footKo,
  heightKo,
  aggregateStats,
} from "@/lib/format/stats";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";
import { InsightBlock } from "@/components/ui/InsightBlock";
import { Crest } from "@/components/ui/Crest";
import { toKST } from "@/lib/format/datetime";
import { ACTIVE_TEAM_ID } from "@/lib/teams";
import { resultForTeam } from "@/lib/format/stats";

export async function generateStaticParams() {
  const squad = await getSquad();
  return squad.data.players.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await getPlayer(id);
  if (!res.data) return { title: "선수를 찾을 수 없음" };
  return {
    title: `${res.data.nameKo} (${res.data.name})`,
    description: `${res.data.nameKo} — ${res.data.positionKo}. 역할·스타일·주목 이유를 한국어로 설명합니다.`,
  };
}

const toneClass = {
  ok: "bg-emerald-100 text-emerald-800",
  warn: "bg-rose-100 text-rose-800",
  info: "bg-sky-100 text-sky-800",
} as const;

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getPlayer(id);
  const player = res.data;
  if (!player) notFound();

  const insight = playerInsight(player);
  const age = ageFromBirthDate(player.birthDate);
  const status = availabilityKo(player.availability);
  const agg = aggregateStats(player.stats);

  // Recent matches the team played (player-level match logs aren't in seed, so
  // we show the team's recent fixtures as context, clearly framed).
  const matchesRes = await getMatches();
  const recent = matchesRes.data
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
    .slice(0, 5);

  // Player-specific latest coverage (deterministic name match).
  const newsRes = await getNews();
  const playerNews = relatedNews(player, newsRes.data, 4);

  const facts: { label: string; value: string; unknown?: boolean }[] = [
    {
      label: "등번호",
      value: player.number ? `${player.number}` : "미정",
      unknown: !player.number,
    },
    {
      label: "포지션",
      value: `${player.positionKo} (${player.positionGroup})`,
    },
    { label: "국적", value: player.nationalityKo },
    {
      label: "나이",
      value: age !== null ? `${age}세` : "정보 없음",
      unknown: age === null,
    },
    {
      label: "생년월일",
      value: player.birthDate ?? "정보 없음",
      unknown: !player.birthDate,
    },
    {
      label: "키",
      value: heightKo(player.heightCm) || "정보 없음",
      unknown: !player.heightCm,
    },
    {
      label: "주발",
      value: footKo(player.foot),
      unknown: !player.foot,
    },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/squad"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--pm-primary)] hover:underline"
      >
        ← 스쿼드로 돌아가기
      </Link>

      {/* Header */}
      <header className="pm-card flex flex-wrap items-center gap-4 p-5">
        <div className="relative shrink-0">
          {player.photo ? (
            <Crest
              src={player.photo}
              alt={`${player.name} 사진`}
              label={player.nameKo}
              size={72}
              className="rounded-2xl bg-black/5"
            />
          ) : (
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--pm-primary)] text-2xl font-extrabold text-white"
              aria-hidden="true"
            >
              {player.number ?? "–"}
            </span>
          )}
          {player.photo && player.number != null ? (
            <span className="absolute -bottom-1 -right-1 flex h-6 min-w-[24px] items-center justify-center rounded-md bg-[var(--pm-primary)] px-1 text-xs font-bold text-white">
              {player.number}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold">{player.nameKo}</h1>
          <p className="text-sm text-[var(--pm-muted)]">
            {player.fullName ?? player.name} · {player.positionKo}
          </p>
        </div>
        <span className={`pm-chip ${toneClass[status.tone]}`}>
          {status.label}
        </span>
      </header>

      {player.statusNote || player.loanNote ? (
        <InsightBlock icon="🩺" title="현재 상태" tone="warn">
          {player.statusNote ?? player.loanNote}
        </InsightBlock>
      ) : null}

      {/* Bio facts */}
      <section aria-labelledby="bio-heading" className="space-y-2">
        <h2 id="bio-heading" className="text-lg font-bold">
          기본 정보
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="pm-card p-3">
              <dt className="text-xs text-[var(--pm-muted)]">{f.label}</dt>
              <dd
                className={`mt-0.5 font-semibold ${
                  f.unknown ? "text-[var(--pm-muted)] italic" : ""
                }`}
              >
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Korean fan interpretation */}
      <section aria-labelledby="insight-heading" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 id="insight-heading" className="text-lg font-bold">
            한국 팬을 위한 해설
          </h2>
          <FreshnessBadge
            origin="editorial"
            source="에디토리얼 (수기 해설)"
            fetchedAt={res.fetchedAt}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <InsightBlock icon="🎽" title="팀 내 역할" source={insight.source}>
            {insight.roleKo}
          </InsightBlock>
          <InsightBlock icon="🎮" title="플레이 스타일" source={insight.source}>
            {insight.styleKo}
          </InsightBlock>
          <InsightBlock
            icon="❤️"
            title="왜 주목해야 하나"
            source={insight.source}
          >
            {insight.whyCareKo}
          </InsightBlock>
          {insight.narrativeKo ? (
            <InsightBlock
              icon="🧵"
              title="현재 내러티브"
              source={insight.source}
            >
              {insight.narrativeKo}
            </InsightBlock>
          ) : null}
          {insight.archetypeKo ? (
            <InsightBlock
              icon="🔍"
              title="비슷한 유형 (느슨한 비유)"
              source={insight.source}
              tone="neutral"
            >
              {insight.archetypeKo}
            </InsightBlock>
          ) : null}
          {insight.nameNoteKo ? (
            <InsightBlock
              icon="🗣️"
              title="이름·발음 메모"
              source={insight.source}
              tone="neutral"
            >
              {insight.nameNoteKo}
            </InsightBlock>
          ) : null}
        </div>
        {player.bio ? (
          <p className="pm-card p-4 text-sm leading-relaxed">{player.bio}</p>
        ) : null}
      </section>

      {/* Season stats */}
      <section aria-labelledby="stats-heading" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 id="stats-heading" className="text-lg font-bold">
            시즌 스탯
          </h2>
          <FreshnessBadge
            origin={res.origin}
            source={res.source}
            fetchedAt={res.fetchedAt}
            fellBack={res.fellBack}
            note={res.note}
          />
        </div>
        {agg ? (
          <dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <Stat label="출전" value={agg.appearances} />
            <Stat label="골" value={agg.goals} />
            <Stat label="도움" value={agg.assists} />
            <Stat label="경고" value={agg.yellowCards ?? 0} />
            <Stat label="퇴장" value={agg.redCards ?? 0} />
            {player.positionGroup === "GK" ? (
              <Stat label="클린시트" value={agg.cleanSheets ?? 0} />
            ) : (
              <Stat label="출전(분)" value={agg.minutes ?? 0} />
            )}
          </dl>
        ) : (
          <p className="pm-card p-4 text-sm italic text-[var(--pm-muted)]">
            이 선수의 시즌 스탯 정보가 제공되지 않습니다.
          </p>
        )}
      </section>

      {/* Player-specific related news */}
      <section aria-labelledby="news-heading" className="space-y-2">
        <h2 id="news-heading" className="text-lg font-bold">
          관련 뉴스
        </h2>
        {playerNews.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {playerNews.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="pm-card p-4 text-sm italic text-[var(--pm-muted)]">
            이 선수를 직접 언급한 최신 뉴스가 아직 없습니다. 전체 뉴스는{" "}
            <Link href="/news" className="text-[var(--pm-primary)] underline">
              뉴스 페이지
            </Link>
            에서 확인하세요.
          </p>
        )}
      </section>

      {/* Team recent matches as context */}
      <section aria-labelledby="recent-heading" className="space-y-2">
        <h2 id="recent-heading" className="text-lg font-bold">
          팀 최근 경기
        </h2>
        <p className="text-xs text-[var(--pm-muted)]">
          ※ 개별 선수 출전 기록은 시드 데이터에 포함되어 있지 않아, 팀의 최근
          경기 결과를 맥락으로 보여줍니다.
        </p>
        <ul className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/5">
          {recent.map((m) => {
            const opp = m.home.id === ACTIVE_TEAM_ID ? m.away : m.home;
            const r = resultForTeam(m, ACTIVE_TEAM_ID);
            const kst = toKST(m.kickoff);
            const rc =
              r === "W"
                ? "text-emerald-600"
                : r === "L"
                  ? "text-rose-600"
                  : "text-gray-500";
            return (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 bg-[var(--pm-surface)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--pm-muted)]">{kst.date}</span>
                <span className="flex-1 truncate">
                  vs {opp.nameKo}{" "}
                  <span className="text-xs text-[var(--pm-muted)]">
                    ({m.competition.shortName})
                  </span>
                </span>
                {m.score ? (
                  <span className={`font-bold ${rc}`}>
                    {m.score.home}-{m.score.away}{" "}
                    {r === "W" ? "승" : r === "L" ? "패" : "무"}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="pm-card p-3 text-center">
      <p className="text-xl font-extrabold text-[var(--pm-primary)] tabular-nums">
        {value}
      </p>
      <p className="text-xs text-[var(--pm-muted)]">{label}</p>
    </div>
  );
}
