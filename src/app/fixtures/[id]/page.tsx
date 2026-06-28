import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMatches } from "@/lib/adapters";
import { MatchCard } from "@/components/match/MatchCard";
import { FormationPitch } from "@/components/match/FormationPitch";
import { MatchTimeline } from "@/components/match/MatchTimeline";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";

export async function generateStaticParams() {
  const res = await getMatches();
  return res.data.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await getMatches();
  const m = res.data.find((x) => x.id === id);
  if (!m) return { title: "경기를 찾을 수 없음" };
  return {
    title: `${m.home.nameKo} vs ${m.away.nameKo} — 라인업·타임라인`,
    description: `${m.competition.nameKo} · 포메이션·선발 라인업·골/카드/교체 타임라인을 한국어로 정리했습니다.`,
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getMatches();
  const match = res.data.find((m) => m.id === id);
  if (!match) notFound();

  const lineups = match.lineups;
  const hasEvents = (match.events?.length ?? 0) > 0;
  const concluded = match.status === "finished" || match.status === "live";

  return (
    <div className="space-y-5">
      <Link
        href="/fixtures"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--pm-primary)] hover:underline"
      >
        ← 일정·결과로 돌아가기
      </Link>

      {/* Rich match header (score, goals, fan interpretation). No self-link. */}
      <MatchCard match={match} />

      {/* Lineups + formation */}
      <section aria-labelledby="lineups-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="lineups-heading" className="text-lg font-bold">
            라인업 · 포메이션
          </h2>
          <FreshnessBadge
            origin={res.origin}
            source={res.source}
            fetchedAt={res.fetchedAt}
            fellBack={res.fellBack}
            note={res.note}
          />
        </div>
        {lineups ? (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormationPitch lineup={lineups.home} title={match.home.nameKo} />
              <FormationPitch lineup={lineups.away} title={match.away.nameKo} />
            </div>
            <p className="text-xs text-[var(--pm-muted)]">
              ※ 포지션은 ESPN 공개 데이터를 기준으로
              라인(GK·수비·미드필더·공격)에 배치했습니다. ↓ 표시는 교체로 빠진
              선수, 교체 명단의 ▲는 교체로 들어온 선수입니다.
            </p>
          </>
        ) : (
          <p className="pm-card p-4 text-sm italic text-[var(--pm-muted)]">
            {concluded
              ? "이 경기의 라인업·포메이션 정보가 공개 소스에서 제공되지 않습니다."
              : "경기 시작 전입니다. 선발 라인업은 보통 킥오프 約 1시간 전에 공개됩니다."}
          </p>
        )}
      </section>

      {/* Full event timeline (goals · cards · subs) */}
      <section aria-labelledby="timeline-heading" className="space-y-3">
        <h2 id="timeline-heading" className="text-lg font-bold">
          경기 타임라인
        </h2>
        {hasEvents ? (
          <div className="pm-card p-3">
            <MatchTimeline match={match} />
          </div>
        ) : (
          <p className="pm-card p-4 text-sm italic text-[var(--pm-muted)]">
            {concluded
              ? "골·카드·교체 등 이벤트 상세 정보가 제공되지 않습니다."
              : "경기가 시작되면 골·카드·교체가 시간순으로 표시됩니다."}
          </p>
        )}
      </section>
    </div>
  );
}
