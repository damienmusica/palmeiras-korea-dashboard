import { getActiveTeam } from "@/lib/teams";
import { getMatches, getNews, getSquad, getStandings } from "@/lib/adapters";
import { buildDashboard } from "@/lib/services/dashboard";
import { buildBriefing } from "@/lib/interpret/briefing";
import { Briefing } from "@/components/home/Briefing";
import { ClubHero } from "@/components/home/ClubHero";
import { QuickStats } from "@/components/home/QuickStats";
import { MatchCard } from "@/components/match/MatchCard";
import { FormBadges } from "@/components/ui/FormBadges";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

// Revalidate the home view periodically; adapters also cache server-side.
export const revalidate = 300;

export default async function HomePage() {
  const team = getActiveTeam();
  const [matchesRes, newsRes, squadRes, standingsRes] = await Promise.all([
    getMatches(),
    getNews(),
    getSquad(),
    getStandings(),
  ]);

  const model = buildDashboard(
    team.id,
    matchesRes.data,
    newsRes.data,
    standingsRes.data,
  );
  const briefing = buildBriefing(
    team,
    model,
    squadRes.data.players,
    newsRes.data,
  );
  const tracked = standingsRes.data.table.find((r) => r.isTracked) ?? null;

  return (
    <div className="space-y-6">
      <ClubHero team={team} />

      {/* Flagship: 5-minute briefing */}
      <Briefing briefing={briefing} />

      {/* Quick season snapshot */}
      <section aria-labelledby="snapshot-heading" className="space-y-3">
        <SectionHeading
          title="시즌 스냅샷"
          subtitle="Season snapshot"
          source={
            <FreshnessBadge
              origin={standingsRes.origin}
              source={standingsRes.source}
              fetchedAt={standingsRes.fetchedAt}
              fellBack={standingsRes.fellBack}
              note={standingsRes.note}
            />
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--pm-muted)]">최근 폼</span>
            <FormBadges form={model.form} size="sm" />
          </div>
        </SectionHeading>
        <QuickStats season={model.season} tracked={tracked} />
      </section>

      {/* Live match takes priority — never let an in-progress game disappear */}
      {model.liveMatch ? (
        <section aria-labelledby="live-heading" className="space-y-3">
          <h2
            id="live-heading"
            className="flex items-center gap-2 text-sm font-bold text-rose-600"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-600" />
            지금 진행 중
          </h2>
          <MatchCard match={model.liveMatch} />
        </section>
      ) : null}

      {/* Next + last match */}
      <section aria-labelledby="matches-heading" className="space-y-3">
        <SectionHeading
          title="다음 경기 · 지난 결과"
          subtitle="Next match & last result"
          source={
            <FreshnessBadge
              origin={matchesRes.origin}
              source={matchesRes.source}
              fetchedAt={matchesRes.fetchedAt}
              fellBack={matchesRes.fellBack}
              note={matchesRes.note}
            />
          }
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[var(--pm-muted)]">
              ⏭️ 다음 경기
            </h3>
            {model.nextMatch ? (
              <MatchCard match={model.nextMatch} />
            ) : (
              <EmptyState
                title="예정된 경기가 없습니다"
                description="다음 일정이 확정되면 여기에 표시됩니다."
              />
            )}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[var(--pm-muted)]">
              ⏮️ 지난 결과
            </h3>
            {model.lastResult ? (
              <MatchCard match={model.lastResult} />
            ) : (
              <EmptyState title="최근 경기 기록이 없습니다" />
            )}
          </div>
        </div>
      </section>

      {/* Trophy / honours summary */}
      <section aria-labelledby="trophies-heading" className="space-y-3">
        <SectionHeading title="우승 이력" subtitle="Trophy cabinet" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {team.trophies.map((t) => (
            <div key={t.competition} className="pm-card p-3 text-center">
              <p className="text-2xl font-extrabold text-[var(--pm-primary)]">
                {t.count}
              </p>
              <p className="text-xs font-semibold">{t.competitionKo}</p>
              {t.lastWon ? (
                <p className="text-[11px] text-[var(--pm-muted)]">
                  최근 {t.lastWon}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Discover the club's depth (history/legends/culture live in the guide) */}
      <section aria-labelledby="discover-heading" className="space-y-3">
        <SectionHeading
          title="클럽 깊이 알기"
          subtitle="처음이라면 여기서 — 110년 역사 · 레전드 · 응원 문화"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              href: "/guide#history-heading",
              icon: "📜",
              title: "클럽의 역사",
              desc: "Palestra Itália부터 아벨의 황금기까지 110년",
            },
            {
              href: "/guide#legends-heading",
              icon: "🏅",
              title: "레전드 & 명예의 전당",
              desc: "아데미르 다 기아·히바우두·엔드릭까지",
            },
            {
              href: "/guide#culture-heading",
              icon: "💚",
              title: "응원 문화와 정체성",
              desc: "Avanti Palestra · Porco · Mancha Verde",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="pm-card flex flex-col gap-1 p-4 transition-transform hover:-translate-y-0.5"
            >
              <span aria-hidden="true" className="text-2xl">
                {c.icon}
              </span>
              <span className="font-bold">{c.title} →</span>
              <span className="text-xs text-[var(--pm-muted)]">{c.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-links */}
      <nav
        aria-label="섹션 바로가기"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { href: "/news", label: "뉴스", icon: "📰" },
          { href: "/squad", label: "스쿼드", icon: "👥" },
          { href: "/standings", label: "순위표", icon: "📊" },
          { href: "/guide", label: "팬 가이드", icon: "📖" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="pm-card flex items-center gap-2 p-4 font-semibold transition-transform hover:-translate-y-0.5"
          >
            <span aria-hidden="true" className="text-xl">
              {l.icon}
            </span>
            {l.label} →
          </Link>
        ))}
      </nav>
    </div>
  );
}
