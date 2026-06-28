"use client";

import { useEffect, useMemo, useState } from "react";
import type { Coach, Player, PlayerPositionGroup } from "@/lib/domain/types";
import { PlayerCard } from "@/components/squad/PlayerCard";
import { PlayerRow } from "@/components/squad/PlayerRow";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterChips";
import { Collapsible } from "@/components/ui/Collapsible";
import { EmptyState } from "@/components/ui/EmptyState";

type GroupFilter = "ALL" | PlayerPositionGroup;
type View = "grid" | "list";

const GROUP_LABEL: Record<PlayerPositionGroup, string> = {
  GK: "골키퍼 (GK)",
  DF: "수비수 (DF)",
  MF: "미드필더 (MF)",
  FW: "공격수 (FW)",
};

const ORDER: PlayerPositionGroup[] = ["GK", "DF", "MF", "FW"];

const CHIP_LABEL: Record<PlayerPositionGroup, string> = {
  GK: "골키퍼",
  DF: "수비수",
  MF: "미드필더",
  FW: "공격수",
};

export function SquadView({
  players,
  coach,
}: {
  players: Player[];
  coach: Coach;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupFilter>("ALL");
  const [view, setView] = useState<View>("list");

  // Restore the reader's preferred density (set after mount → no SSR mismatch).
  useEffect(() => {
    const saved = localStorage.getItem("squad-view");
    if (saved === "list" || saved === "grid") setView(saved);
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem("squad-view", v);
    } catch {
      /* private mode — preference just won't persist */
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (group !== "ALL" && p.positionGroup !== group) return false;
      if (!q) return true;
      return (
        p.nameKo.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.positionKo.toLowerCase().includes(q) ||
        p.nationalityKo.toLowerCase().includes(q) ||
        String(p.number ?? "").includes(q)
      );
    });
  }, [players, query, group]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: players.length };
    for (const g of ORDER)
      c[g] = players.filter((p) => p.positionGroup === g).length;
    return c;
  }, [players]);

  const grouped = useMemo(() => {
    return ORDER.map((g) => ({
      group: g,
      players: filtered.filter((p) => p.positionGroup === g),
    })).filter((s) => s.players.length > 0);
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          label="선수 검색"
          value={query}
          onChange={setQuery}
          placeholder="이름·포지션·국적·번호로 검색"
        />
        <FilterChips<GroupFilter>
          ariaLabel="포지션 필터"
          value={group}
          onChange={setGroup}
          options={[
            { value: "ALL", label: "전체", count: counts.ALL },
            ...ORDER.map((g) => ({
              value: g,
              label: CHIP_LABEL[g],
              count: counts[g],
            })),
          ]}
        />
      </div>

      {/* Coaching staff — bio collapsed by default so it doesn't dominate the
          page top on every visit (the always-visible summary keeps the name). */}
      <section aria-labelledby="coach-heading" className="space-y-2">
        <h3
          id="coach-heading"
          className="text-sm font-bold text-[var(--pm-muted)]"
        >
          코칭스태프
        </h3>
        <div className="pm-card p-4">
          {coach.bio ? (
            <Collapsible
              summary={<CoachSummary coach={coach} />}
              bodyClassName="mt-2 border-t border-black/5 pt-2"
            >
              <p className="text-sm leading-relaxed text-[var(--pm-ink)]">
                {coach.bio}
              </p>
            </Collapsible>
          ) : (
            <CoachSummary coach={coach} noChevron />
          )}
        </div>
      </section>

      {/* Density toggle — list = scannable rows (skim many players), grid = rich
          cards. The reader's choice persists. */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-[var(--pm-muted)]">보기</span>
        <div
          role="group"
          aria-label="스쿼드 보기 방식"
          className="inline-flex overflow-hidden rounded-lg border border-black/10"
        >
          <ViewButton
            active={view === "list"}
            onClick={() => changeView("list")}
            label="목록"
          />
          <ViewButton
            active={view === "grid"}
            onClick={() => changeView("grid")}
            label="그리드"
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          title="검색 결과가 없습니다"
          description="다른 검색어나 포지션 필터를 시도해 보세요."
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setGroup("ALL");
              }}
              className="rounded-lg bg-[var(--pm-primary)] px-3 py-1.5 text-sm font-semibold text-white"
            >
              필터 초기화
            </button>
          }
        />
      ) : (
        grouped.map((section) => (
          <section
            key={section.group}
            aria-labelledby={`group-${section.group}`}
            className="space-y-2"
          >
            <h3
              id={`group-${section.group}`}
              className="sticky top-[3.5rem] z-20 -mx-1 bg-[var(--pm-bg)]/95 px-1 py-1 text-sm font-bold text-[var(--pm-muted)] backdrop-blur"
            >
              {GROUP_LABEL[section.group]} · {section.players.length}명
            </h3>
            {view === "grid" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.players.map((p) => (
                  <PlayerCard key={p.id} player={p} />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/5">
                {section.players.map((p) => (
                  <PlayerRow key={p.id} player={p} />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}

function CoachSummary({
  coach,
  noChevron = false,
}: {
  coach: Coach;
  noChevron?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${noChevron ? "" : "pr-1"}`}>
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--pm-primary)] text-xl text-white"
        aria-hidden="true"
      >
        🎯
      </span>
      <div className="min-w-0">
        <p className="font-bold">
          {coach.nameKo}{" "}
          <span className="text-sm font-normal text-[var(--pm-muted)]">
            {coach.name}
          </span>
        </p>
        <p className="text-xs text-[var(--pm-muted)]">
          {coach.roleKo} · {coach.nationalityKo}
          {coach.since ? ` · 부임 ${coach.since.slice(0, 4)}` : ""}
          {coach.bio ? " · 약력 보기" : ""}
        </p>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? "bg-[var(--pm-primary)] text-white"
          : "bg-[var(--pm-surface)] text-[var(--pm-muted)] hover:bg-black/5"
      }`}
    >
      {label}
    </button>
  );
}
