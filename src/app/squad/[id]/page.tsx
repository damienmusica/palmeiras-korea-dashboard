import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getSquad, getMatches, getNews } from "@/lib/adapters";
import { playerInsight } from "@/lib/interpret/players";
import { getDossier, hasCareerFacts } from "@/lib/teams/palmeiras-dossier";
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

  // Low-confidence rows get NO auto-generated commentary (data-integrity gate).
  const unverified = player.confidence === "unverified";
  const insight = unverified ? null : playerInsight(player);
  // Web-verified structured career facts (curated dossier). Suppressed for
  // unverified rows, same as the editorial — we never attach a career/transfer
  // history to a player we could not cross-verify (the Ghareeb gate principle).
  const dossier = unverified ? null : getDossier(player.name);
  const careerFacts = dossier && hasCareerFacts(dossier) ? dossier : null;
  const careerRows: { icon: string; label: string; value: string }[] =
    careerFacts
      ? [
          {
            icon: "🧭",
            label: "이전 커리어",
            value: careerFacts.careerKo ?? "",
          },
          {
            icon: "✍️",
            label: "파우메이라스 합류",
            value: careerFacts.transfersKo ?? "",
          },
          {
            icon: "🌐",
            label: "국가대표",
            value: careerFacts.nationalTeamKo ?? "",
          },
          {
            icon: "📄",
            label: "계약 현황",
            value: careerFacts.contractKo ?? "",
          },
        ].filter((r) => r.value)
      : [];
  const age = ageFromBirthDate(player.birthDate);
  const status = availabilityKo(player.availability);
  const agg = aggregateStats(player.stats);
  const statsMeta = player.stats?.[0];
  const statCells: { label: string; value: number }[] = agg
    ? [
        { label: "출전", value: agg.appearances },
        { label: "골", value: agg.goals },
        { label: "도움", value: agg.assists },
        { label: "경고", value: agg.yellowCards ?? 0 },
        { label: "퇴장", value: agg.redCards ?? 0 },
        ...(player.positionGroup === "GK"
          ? [
              { label: "선방", value: agg.saves ?? 0 },
              { label: "실점", value: agg.goalsConceded ?? 0 },
            ]
          : []),
      ]
    : [];

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
            {player.tierKo ? (
              <span className="ml-1.5 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-800">
                {player.tierKo}
              </span>
            ) : null}
          </p>
        </div>
        <span
          className={`pm-chip ${unverified ? toneClass.warn : toneClass[status.tone]}`}
        >
          {unverified ? "확인 필요" : status.label}
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

      {/* Korean fan interpretation — suppressed for unverified rows: we do not
          auto-generate commentary on a player we could not cross-verify. */}
      {insight ? (
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
            <InsightBlock
              icon="🎮"
              title="플레이 스타일"
              source={insight.source}
            >
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
      ) : (
        <InsightBlock icon="🔎" title="확인 필요" tone="warn">
          {player.integrityNoteKo ??
            "1군 공식 기록(ESPN)에서 교차검증되지 않은 선수입니다. 부정확한 정보를 보여주지 않기 위해 자동 해설을 생성하지 않았습니다."}
        </InsightBlock>
      )}

      {/* Web-verified career & transfer facts (curated, multi-source). Shown
          only for cross-verified players, complementing the prose bio above. */}
      {careerRows.length > 0 ? (
        <section aria-labelledby="career-heading" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 id="career-heading" className="text-lg font-bold">
              커리어 & 이적
            </h2>
            <FreshnessBadge
              origin="editorial"
              source="에디토리얼 (다출처 웹검증)"
              fetchedAt={res.fetchedAt}
            />
          </div>
          <dl className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/5">
            {careerRows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-1 gap-1 bg-[var(--pm-surface)] px-4 py-3 sm:grid-cols-[7.5rem_1fr] sm:gap-3"
              >
                <dt className="flex items-center gap-1.5 text-sm font-semibold text-[var(--pm-primary)]">
                  <span aria-hidden="true">{r.icon}</span>
                  {r.label}
                </dt>
                <dd className="text-sm leading-relaxed">{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-[var(--pm-muted)]">
            ※ 커리어·이적료·계약 정보는 공개 자료를 다출처 교차검증해 수기로
            반영했습니다. 검증되지 않은 시장가치 등은 표시하지 않습니다.
          </p>
        </section>
      ) : null}

      {/* Season stats */}
      <section aria-labelledby="stats-heading" className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 id="stats-heading" className="text-lg font-bold">
            시즌 스탯
            {statsMeta ? (
              <span className="ml-2 align-middle text-xs font-normal text-[var(--pm-muted)]">
                {statsMeta.season}
                {statsMeta.competition ? ` · ${statsMeta.competition}` : ""}
              </span>
            ) : null}
          </h2>
          <FreshnessBadge
            origin={res.origin}
            source={res.source}
            fetchedAt={res.fetchedAt}
            fellBack={res.fellBack}
            note={res.note}
          />
        </div>
        {statCells.length > 0 ? (
          <dl className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {statCells.map((c) => (
              <Stat key={c.label} label={c.label} value={c.value} />
            ))}
          </dl>
        ) : (
          <p className="pm-card p-4 text-sm italic text-[var(--pm-muted)]">
            이 선수의 시즌 출전 기록이 아직 없습니다. (현재 시즌 1군 출전이
            없거나, 공개 소스에서 기록을 제공하지 않습니다.)
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
          ※ 경기별 개별 출전 기록은 무료 공개 소스에서 제공되지 않아, 팀의 최근
          경기 결과를 맥락으로 함께 보여줍니다.
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
