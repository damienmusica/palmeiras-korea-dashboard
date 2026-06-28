import Link from "next/link";
import type { Match } from "@/lib/domain/types";
import { Crest } from "@/components/ui/Crest";
import { InsightBlock } from "@/components/ui/InsightBlock";
import { toBrazil, toKST } from "@/lib/format/datetime";
import { ACTIVE_TEAM_ID, getActiveTeam } from "@/lib/teams";
import { resultForTeam } from "@/lib/format/stats";
import { matchInsight } from "@/lib/interpret/matches";

const VENUE_KO: Record<Match["venue"], string> = {
  home: "홈",
  away: "원정",
  neutral: "중립",
};

const STATUS_KO: Record<Match["status"], string> = {
  scheduled: "예정",
  live: "진행 중",
  finished: "종료",
  postponed: "연기",
};

function ResultPill({ match }: { match: Match }) {
  const r = resultForTeam(match, ACTIVE_TEAM_ID);
  if (!r) return null;
  const map = {
    W: "bg-emerald-600",
    D: "bg-gray-400",
    L: "bg-rose-600",
  } as const;
  const label = { W: "승", D: "무", L: "패" }[r];
  return (
    <span
      className={`pm-chip text-white ${map[r]}`}
      aria-label={`결과 ${label}`}
    >
      {label}
    </span>
  );
}

export function MatchCard({
  match,
  showInsight = true,
  linkToDetail = false,
}: {
  match: Match;
  showInsight?: boolean;
  /** When true, append a link to the match detail (lineups + timeline) page. */
  linkToDetail?: boolean;
}) {
  const kst = toKST(match.kickoff);
  const br = toBrazil(match.kickoff);
  const finished = match.status === "finished" && match.score;
  const live = match.status === "live";
  const showScore = (match.status === "finished" || live) && match.score;
  const tracked = ACTIVE_TEAM_ID;
  const homeTracked = match.home.id === tracked;
  const awayTracked = match.away.id === tracked;
  const insight = showInsight ? matchInsight(match, getActiveTeam()) : null;
  const goals = (match.events ?? []).filter(
    (e) => e.type === "goal" || e.type === "penalty",
  );
  // The detail page is only worth a link when there's lineup/timeline depth.
  const hasDepth = Boolean(match.lineups || (match.events?.length ?? 0) > 0);

  return (
    <article className="pm-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="pm-chip bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]">
          {match.competition.shortName}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--pm-muted)]">
            {VENUE_KO[match.venue]} · {match.round ?? ""}
          </span>
          {live ? (
            <span
              className="pm-chip inline-flex items-center gap-1 bg-rose-600 font-bold text-white"
              aria-label="진행 중"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
          ) : finished ? (
            <ResultPill match={match} />
          ) : (
            <span className="pm-chip bg-black/5 text-[var(--pm-muted)]">
              {STATUS_KO[match.status]}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <TeamSide
          name={match.home.nameKo}
          crest={match.home.crest}
          label={match.home.name}
          highlight={homeTracked}
          align="start"
        />
        <div className="flex min-w-[64px] flex-col items-center">
          {showScore ? (
            <span
              className={`text-xl font-extrabold tabular-nums ${
                live ? "text-rose-600" : ""
              }`}
            >
              {match.score!.home} : {match.score!.away}
            </span>
          ) : (
            <span className="text-sm font-bold text-[var(--pm-muted)]">VS</span>
          )}
        </div>
        <TeamSide
          name={match.away.nameKo}
          crest={match.away.crest}
          label={match.away.name}
          highlight={awayTracked}
          align="end"
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-black/5 pt-3 text-xs">
        <div>
          <dt className="font-semibold text-[var(--pm-primary)]">
            🇰🇷 한국 (KST)
          </dt>
          <dd className="text-[var(--pm-muted)]">{kst.formatted}</dd>
        </div>
        <div>
          <dt className="font-semibold">🇧🇷 브라질 (BRT)</dt>
          <dd className="text-[var(--pm-muted)]">{br.formatted}</dd>
        </div>
      </dl>

      {match.stadium ? (
        <p className="mt-2 text-xs text-[var(--pm-muted)]">
          📍 {match.stadium}
        </p>
      ) : null}

      {(finished || live) && goals.length === 0 ? (
        <p className="mt-2 text-xs italic text-[var(--pm-muted)]">
          {live
            ? "득점 정보가 아직 없습니다."
            : "경기 이벤트 상세 정보가 제공되지 않습니다."}
        </p>
      ) : null}

      {goals.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {goals.map((e, i) => {
            const scorerTeamId =
              e.team === "home" ? match.home.id : match.away.id;
            const byTracked = scorerTeamId === tracked;
            return (
              <li
                key={i}
                className={
                  byTracked
                    ? "font-semibold text-[var(--pm-primary)]"
                    : "text-[var(--pm-muted)]"
                }
              >
                ⚽ {e.minute}&apos; {e.player}
                {e.type === "penalty" ? " (PK)" : ""}
                {e.detail ? (
                  <span className="font-normal text-[var(--pm-muted)]">
                    {" "}
                    (도움 {e.detail})
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Interpretation: the "fan intelligence" layer */}
      {insight ? (
        <div className="mt-3 space-y-2">
          {insight.rivalryKo ? (
            <span className="pm-chip bg-rose-100 font-bold text-rose-700">
              🔥 {insight.rivalryKo}
            </span>
          ) : null}

          <InsightBlock
            icon="🎯"
            title="이 경기가 중요한 이유"
            source={insight.source}
          >
            {insight.whyItMattersKo}
          </InsightBlock>

          {insight.resultReadingKo ? (
            <InsightBlock
              icon="🧭"
              title="결과 해석"
              source={insight.source}
              tone="neutral"
            >
              {insight.resultReadingKo}
            </InsightBlock>
          ) : null}

          {insight.watchPointsKo.length > 0 ? (
            <InsightBlock
              icon="👀"
              title="한국 팬 관전 포인트"
              source={insight.source}
              tone="neutral"
            >
              <ul className="list-disc space-y-0.5 pl-4">
                {insight.watchPointsKo.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </InsightBlock>
          ) : null}
        </div>
      ) : null}

      {linkToDetail && hasDepth ? (
        <Link
          href={`/fixtures/${match.id}`}
          className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-[var(--pm-primary)]/30 bg-[var(--pm-primary)]/[0.05] py-2 text-sm font-semibold text-[var(--pm-primary)] hover:bg-[var(--pm-primary)]/10"
        >
          📋 라인업 · 경기 타임라인 보기 →
        </Link>
      ) : null}
    </article>
  );
}

function TeamSide({
  name,
  crest,
  label,
  highlight,
  align,
}: {
  name: string;
  crest?: string;
  label: string;
  highlight: boolean;
  align: "start" | "end";
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-2 ${
        align === "end" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <Crest src={crest} alt={`${label} 엠블럼`} label={label} size={32} />
      <span
        className={`text-sm font-bold ${
          highlight ? "text-[var(--pm-primary)]" : ""
        }`}
      >
        {name}
      </span>
    </div>
  );
}
