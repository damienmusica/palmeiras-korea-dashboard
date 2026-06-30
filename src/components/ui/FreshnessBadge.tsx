import type { DataOrigin } from "@/lib/domain/types";
import { relativeTimeKo, freshnessLevel } from "@/lib/format/datetime";

interface Props {
  origin: DataOrigin;
  source: string;
  fetchedAt: string;
  fellBack?: boolean;
  note?: string;
  /**
   * Minutes after which a live-origin snapshot is flagged "확인 지연". Defaults
   * to 180 (3 h) — GitHub throttles the 30-min cron to ~hourly, so only a
   * genuinely-broken pipeline trips the warning; pass a tighter value (e.g. 15)
   * inside match windows where a stalled feed matters within minutes.
   */
  staleAfterMin?: number;
  /**
   * Newest underlying CONTENT timestamp (e.g. the most recent article's
   * publishedAt). `fetchedAt` only says when we last CHECKED the source — it
   * advances every cron run even with no new content — so when this is provided
   * the badge also shows "최신 …" to separate "checked" from "actually changed".
   */
  latestContentAt?: string;
}

interface OriginMeta {
  labelKo: string;
  tone: "live" | "seed" | "warn" | "neutral";
  dot: string;
}

const ORIGIN_META: Record<DataOrigin, OriginMeta> = {
  live: { labelKo: "라이브", tone: "live", dot: "●" },
  api: { labelKo: "API 라이브", tone: "live", dot: "●" },
  rss: { labelKo: "RSS 라이브", tone: "live", dot: "●" },
  cache: { labelKo: "캐시", tone: "neutral", dot: "◑" },
  seed: { labelKo: "시드 데이터 (mock)", tone: "seed", dot: "◐" },
  mock: { labelKo: "목업 데이터", tone: "seed", dot: "◐" },
  manual: { labelKo: "수기 입력", tone: "seed", dot: "◐" },
  editorial: { labelKo: "에디토리얼", tone: "seed", dot: "✎" },
  unavailable: { labelKo: "소스 불가", tone: "warn", dot: "○" },
};

const TONE_CLASS: Record<OriginMeta["tone"], string> = {
  live: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  seed: "bg-amber-100 text-amber-800 border border-amber-200",
  warn: "bg-rose-100 text-rose-800 border border-rose-200",
  neutral: "bg-sky-100 text-sky-800 border border-sky-200",
};

/**
 * Badge that always tells the user where data came from and how fresh it is.
 * Seed/fallback/editorial content is explicitly labeled so nothing looks more
 * "live" than it actually is.
 */
export function FreshnessBadge({
  origin,
  source,
  fetchedAt,
  fellBack,
  note,
  staleAfterMin,
  latestContentAt,
}: Props) {
  const meta = ORIGIN_META[origin] ?? ORIGIN_META.seed;

  // A live-origin snapshot that hasn't been re-checked in a while must NOT keep
  // looking live — downgrade it to a "확인 지연" warning so freshness stays
  // honest if the cron stalls. Seed/editorial/manual content is timeless and
  // exempt; an explicit fallback already warns on its own.
  const isLiveOrigin = meta.tone === "live";
  const stale =
    isLiveOrigin &&
    !fellBack &&
    freshnessLevel(fetchedAt, staleAfterMin) === "stale";

  const labelKo = fellBack
    ? "소스 불가 · 시드 데이터"
    : stale
      ? "확인 지연"
      : meta.labelKo;
  const tone = fellBack || stale ? "warn" : meta.tone;
  const dot = stale ? "○" : meta.dot;

  // `fetchedAt` = last time we CHECKED the source (advances every run even with
  // no new content); `latestContentAt` = how new the content actually is.
  const checkedRel = relativeTimeKo(fetchedAt);
  const contentRel = latestContentAt ? relativeTimeKo(latestContentAt) : "";
  const title = [
    `출처: ${source}`,
    `마지막 확인: ${checkedRel} (데이터 변경이 아니라 수집 시도 시각)`,
    contentRel ? `최신 콘텐츠: ${contentRel}` : null,
    stale
      ? "자동 수집이 지연되고 있습니다 (데이터가 최신이 아닐 수 있음)"
      : null,
    note ? `메모: ${note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <span className={`pm-chip ${TONE_CLASS[tone]}`} title={title}>
      <span aria-hidden="true">{dot}</span>
      <span>{labelKo}</span>
      {/* No opacity dimming: on the warn (rose) tone it drops below WCAG-AA
          (~3.85:1). The leading "·" already sets each part apart. "확인" is the
          honest frame — it's a check time, not a content-changed time. */}
      {checkedRel ? (
        <span className="font-normal">· 확인 {checkedRel}</span>
      ) : null}
      {contentRel ? (
        <span className="font-normal">· 최신 {contentRel}</span>
      ) : null}
    </span>
  );
}
