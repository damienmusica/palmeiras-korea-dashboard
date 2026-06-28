"use client";

import { useMemo, useState } from "react";
import type { Match } from "@/lib/domain/types";
import { MatchCard } from "@/components/match/MatchCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { fixtureGapKo } from "@/lib/interpret/matches";

type StatusFilter = "all" | "upcoming" | "finished";

/**
 * Render upcoming fixtures with a deterministic divider whenever there's an
 * abnormally long gap between consecutive matches (e.g. a World Cup break), so
 * the empty stretch reads as "the league is paused", not "the data is broken".
 */
function UpcomingGrid({
  items,
  precedingKickoff,
}: {
  items: Match[];
  /** Kickoff of the most recent finished match, so the gap BEFORE the first
   *  upcoming fixture (e.g. the World Cup break) is annotated too. */
  precedingKickoff?: string;
}) {
  const segments = useMemo(() => {
    const segs: { gapBeforeKo?: string; rows: Match[] }[] = [];
    items.forEach((m, i) => {
      const prevIso = i > 0 ? items[i - 1].kickoff : precedingKickoff;
      const gap = prevIso ? fixtureGapKo(prevIso, m.kickoff) : null;
      if (i === 0 || gap) segs.push({ gapBeforeKo: gap?.labelKo, rows: [m] });
      else segs[segs.length - 1].rows.push(m);
    });
    return segs;
  }, [items, precedingKickoff]);

  return (
    <div className="space-y-4">
      {segments.map((seg, i) => (
        <div key={i} className="space-y-4">
          {seg.gapBeforeKo ? (
            <div
              role="note"
              className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--pm-primary)]/40 bg-[var(--pm-primary)]/[0.05] px-3 py-2 text-xs text-[var(--pm-ink)]"
            >
              <span aria-hidden="true">🌍</span>
              <span>{seg.gapBeforeKo}</span>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {seg.rows.map((m) => (
              <MatchCard key={m.id} match={m} linkToDetail />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FixturesView({ matches }: { matches: Match[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [comp, setComp] = useState<string>("all");

  const competitions = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matches) map.set(m.competition.id, m.competition.shortName);
    return Array.from(map.entries());
  }, [matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches
      .filter((m) => {
        if (comp !== "all" && m.competition.id !== comp) return false;
        if (statusFilter === "upcoming" && m.status === "finished")
          return false;
        if (statusFilter === "finished" && m.status !== "finished")
          return false;
        if (!q) return true;
        return (
          m.home.nameKo.toLowerCase().includes(q) ||
          m.away.nameKo.toLowerCase().includes(q) ||
          m.home.name.toLowerCase().includes(q) ||
          m.away.name.toLowerCase().includes(q) ||
          m.competition.shortName.toLowerCase().includes(q) ||
          (m.stadium ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // upcoming ascending, finished descending — group naturally by status.
        if (statusFilter === "finished")
          return b.kickoff.localeCompare(a.kickoff);
        if (statusFilter === "upcoming")
          return a.kickoff.localeCompare(b.kickoff);
        return a.kickoff.localeCompare(b.kickoff);
      });
  }, [matches, query, statusFilter, comp]);

  const upcoming = filtered.filter((m) => m.status !== "finished");
  const finished = filtered
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff));

  // Most recent finished match in the current competition scope — used to
  // annotate the gap before the first upcoming fixture (e.g. a tournament break).
  const lastFinishedKickoff = useMemo(() => {
    const f = matches
      .filter(
        (m) =>
          (comp === "all" || m.competition.id === comp) &&
          m.status === "finished",
      )
      .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
    return f[0]?.kickoff;
  }, [matches, comp]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <SearchInput
          label="경기 검색"
          value={query}
          onChange={setQuery}
          placeholder="상대팀·대회·경기장 검색"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips<StatusFilter>
            ariaLabel="경기 상태 필터"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "전체" },
              { value: "upcoming", label: "예정" },
              { value: "finished", label: "결과" },
            ]}
          />
          <span className="h-4 w-px bg-black/10" aria-hidden="true" />
          <FilterChips
            ariaLabel="대회 필터"
            value={comp}
            onChange={setComp}
            options={[
              { value: "all", label: "모든 대회" },
              ...competitions.map(([id, label]) => ({ value: id, label })),
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="조건에 맞는 경기가 없습니다"
          description="필터나 검색어를 변경해 보세요."
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setComp("all");
              }}
              className="rounded-lg bg-[var(--pm-primary)] px-3 py-1.5 text-sm font-semibold text-white"
            >
              필터 초기화
            </button>
          }
        />
      ) : statusFilter === "all" ? (
        <div className="space-y-5">
          {upcoming.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--pm-muted)]">
                ⏭️ 예정된 경기 ({upcoming.length})
              </h2>
              <UpcomingGrid
                items={upcoming}
                precedingKickoff={lastFinishedKickoff}
              />
            </section>
          ) : null}
          {finished.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--pm-muted)]">
                ✅ 지난 결과 ({finished.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {finished.map((m) => (
                  <MatchCard key={m.id} match={m} linkToDetail />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : statusFilter === "upcoming" ? (
        <UpcomingGrid items={filtered} precedingKickoff={lastFinishedKickoff} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} linkToDetail />
          ))}
        </div>
      )}
    </div>
  );
}
