"use client";

import { useMemo, useState } from "react";
import type { DataResult, NewsItem } from "@/lib/domain/types";
import { NewsCard } from "@/components/news/NewsCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";
import { Collapsible } from "@/components/ui/Collapsible";
import { newsCategory } from "@/lib/interpret/news";

type CategoryFilter = "ALL" | "senior" | "other";

export function NewsView({ initial }: { initial: DataResult<NewsItem[]> }) {
  const [result, setResult] = useState<DataResult<NewsItem[]>>(initial);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
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

  const counts = useMemo(() => {
    let senior = 0;
    for (const n of result.data) if (newsCategory(n) === "senior") senior += 1;
    return {
      ALL: result.data.length,
      senior,
      other: result.data.length - senior,
    };
  }, [result.data]);

  // Newest article's publish time — lets the badge separate "확인"(checked) from
  // "최신"(actual content), so a refresh with no new news can't look brand-new.
  const latestContentAt = useMemo(() => {
    let max = "";
    for (const n of result.data) if (n.publishedAt > max) max = n.publishedAt;
    return max || undefined;
  }, [result.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return result.data.filter((n) => {
      if (category !== "ALL" && newsCategory(n) !== category) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.summaryKo.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [result.data, query, category]);

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
          aria-label="가장 최근 자동 수집본 다시 불러오기"
          title="뉴스는 약 1시간마다 자동 수집됩니다. 이 버튼은 가장 최근 수집본을 다시 불러옵니다(요청 시점에 새로 수집하지 않습니다)."
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--pm-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <span
            className={status === "loading" ? "inline-block animate-spin" : ""}
            aria-hidden="true"
          >
            ↻
          </span>
          {status === "loading" ? "불러오는 중…" : "최신본 불러오기"}
        </button>
      </div>

      <FilterChips<CategoryFilter>
        ariaLabel="뉴스 분류 필터"
        value={category}
        onChange={setCategory}
        options={[
          { value: "ALL", label: "전체보기", count: counts.ALL },
          { value: "senior", label: "1군팀", count: counts.senior },
          { value: "other", label: "그 외 (유스·여자팀)", count: counts.other },
        ]}
      />

      {/* Polite live region: announces load/error/result-count changes to
          screen readers when the user refreshes or filters. */}
      <p
        role="status"
        aria-live="polite"
        className="flex items-center justify-between text-xs text-[var(--pm-muted)]"
      >
        <span>
          {status === "loading"
            ? "뉴스를 불러오는 중…"
            : status === "error"
              ? "뉴스를 불러오지 못했습니다."
              : `${filtered.length}건 표시 ${query ? `(검색: “${query}”)` : ""}`}
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--pm-muted)]">
          뉴스는 약 1시간마다 자동 수집됩니다.
        </p>
        <FreshnessBadge
          origin={result.origin}
          source={result.source}
          fetchedAt={result.fetchedAt}
          fellBack={result.fellBack}
          note={result.note}
          latestContentAt={latestContentAt}
        />
      </div>

      {/* One-time legend: with established media as the silent default, this
          explains that "no marker = normal outlet" so the absence reads as
          intentional, not missing — and explains the "AI 생성" caveat once
          instead of repeating it on every card. Collapsed by default. */}
      <Collapsible
        className="rounded-xl border border-black/5 bg-black/[0.02] px-3 py-2"
        summary={
          <span className="text-xs font-semibold text-[var(--pm-muted)]">
            ℹ︎ 표시 안내 (출처 신뢰도 · AI 해설)
          </span>
        }
        bodyClassName="mt-2"
      >
        <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--pm-muted)]">
          <li>
            <b>표시가 없는 기사</b> = 정평 있는 일반 스포츠 매체입니다(기본값).
            대부분의 기사가 여기에 해당합니다.
          </li>
          <li>
            <span className="pm-chip bg-emerald-100 text-emerald-800">
              ✓ 공식
            </span>{" "}
            — 구단·연맹 등 공식 1차 출처.
          </li>
          <li>
            <span className="pm-chip bg-amber-100 text-amber-800">
              루머·추측
            </span>{" "}
            — 확인되지 않은 이적설 등. 단정하지 말고 지켜보세요.
          </li>
          <li>
            <span className="pm-chip bg-black/5 text-[var(--pm-muted)]">
              재가공
            </span>{" "}
            — 원 출처를 재가공한 모음성 콘텐츠. 원문 확인을 권장합니다.
          </li>
          <li>
            <span className="pm-chip bg-black/5 text-[var(--pm-muted)]">
              기타 매체
            </span>{" "}
            — 사전 분류되지 않은 매체. 보도 내용은 원문에서 확인하세요.
          </li>
          <li className="border-t border-black/5 pt-1.5">
            <span className="pm-chip bg-black/5 text-[var(--pm-muted)]">
              AI 생성
            </span>{" "}
            — ‘왜 중요한가’·‘팬 한 줄’은 AI가 자동 생성한 해설입니다. 부정확할
            수 있으니 사실관계는 원문에서 확인하세요.
          </li>
        </ul>
      </Collapsible>

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
              : category === "other"
                ? "현재 유스·여자팀 관련 소식이 없습니다."
                : category === "senior"
                  ? "현재 1군팀 관련 소식이 없습니다."
                  : "라이브 뉴스 소스를 연결하거나 잠시 후 다시 시도해 주세요."
          }
          action={
            query || category !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("ALL");
                }}
                className="rounded-lg bg-[var(--pm-primary)] px-3 py-1.5 text-sm font-semibold text-white"
              >
                필터 초기화
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
