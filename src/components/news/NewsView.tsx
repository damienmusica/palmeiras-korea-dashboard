"use client";

import { useMemo, useState } from "react";
import type { DataResult, NewsItem } from "@/lib/domain/types";
import { NewsCard } from "@/components/news/NewsCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";

export function NewsView({ initial }: { initial: DataResult<NewsItem[]> }) {
  const [result, setResult] = useState<DataResult<NewsItem[]>>(initial);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function refresh() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/news?refresh=1", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DataResult<NewsItem[]>;
      setResult(json);
      setStatus("idle");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return result.data;
    return result.data.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.summaryKo.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [result.data, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          label="뉴스 검색"
          value={query}
          onChange={setQuery}
          placeholder="제목·요약·출처·태그 검색"
        />
        <button
          type="button"
          onClick={refresh}
          disabled={status === "loading"}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--pm-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <span
            className={status === "loading" ? "inline-block animate-spin" : ""}
            aria-hidden="true"
          >
            ↻
          </span>
          {status === "loading" ? "불러오는 중…" : "새로고침"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--pm-muted)]">
          {filtered.length}건 표시 {query ? `(검색: “${query}”)` : ""}
        </p>
        <FreshnessBadge
          origin={result.origin}
          source={result.source}
          fetchedAt={result.fetchedAt}
          fellBack={result.fellBack}
          note={result.note}
        />
      </div>

      {status === "loading" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : status === "error" ? (
        <EmptyState
          tone="error"
          icon="⚠️"
          title="뉴스를 불러오지 못했습니다"
          description={`잠시 후 다시 시도해 주세요. (${errorMsg})`}
          action={
            <button
              type="button"
              onClick={refresh}
              className="rounded-lg bg-[var(--pm-primary)] px-3 py-1.5 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "검색 결과가 없습니다" : "표시할 뉴스가 없습니다"}
          description={
            query
              ? "다른 검색어를 입력해 보세요."
              : "라이브 뉴스 소스를 연결하거나 잠시 후 다시 시도해 주세요."
          }
          action={
            query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-lg bg-[var(--pm-primary)] px-3 py-1.5 text-sm font-semibold text-white"
              >
                검색 초기화
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
