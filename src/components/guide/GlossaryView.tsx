"use client";

import { useMemo, useState } from "react";
import type { GlossaryEntry } from "@/lib/domain/types";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterChips";
import { EmptyState } from "@/components/ui/EmptyState";

type Cat = "all" | GlossaryEntry["category"];

const CAT_LABEL: Record<GlossaryEntry["category"], string> = {
  general: "일반",
  club: "클럽",
  tactics: "전술/포지션",
  culture: "응원 문화",
  chant: "응원가",
};

export function GlossaryView({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (!q) return true;
      return (
        e.term.toLowerCase().includes(q) ||
        e.reading.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q)
      );
    });
  }, [entries, query, cat]);

  const cats = useMemo(() => {
    const present = new Set(entries.map((e) => e.category));
    return (Object.keys(CAT_LABEL) as GlossaryEntry["category"][]).filter((c) =>
      present.has(c),
    );
  }, [entries]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          label="용어 검색"
          value={query}
          onChange={setQuery}
          placeholder="포르투갈어/한국어 용어 검색"
        />
        <FilterChips<Cat>
          ariaLabel="용어 분류 필터"
          value={cat}
          onChange={setCat}
          options={[
            { value: "all", label: "전체" },
            ...cats.map((c) => ({ value: c, label: CAT_LABEL[c] })),
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="검색 결과가 없습니다"
          description="다른 검색어나 분류를 선택해 보세요."
        />
      ) : (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((e) => (
            <div key={e.term} className="pm-card flex flex-col gap-0.5 p-3">
              <dt className="flex items-baseline gap-2">
                <span className="font-bold text-[var(--pm-primary-text)]">
                  {e.term}
                </span>
                <span className="text-xs text-[var(--pm-muted)]">
                  /{e.reading}/
                </span>
                <span className="pm-chip ml-auto bg-black/5 text-[10px] text-[var(--pm-muted)]">
                  {CAT_LABEL[e.category]}
                </span>
              </dt>
              <dd className="text-sm">{e.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
