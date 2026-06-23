import type { DataOrigin } from "@/lib/domain/types";
import { relativeTimeKo } from "@/lib/format/datetime";

interface Props {
  origin: DataOrigin;
  source: string;
  fetchedAt: string;
  fellBack?: boolean;
  note?: string;
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
}: Props) {
  const meta = ORIGIN_META[origin] ?? ORIGIN_META.seed;
  const labelKo = fellBack ? "소스 불가 · 시드 데이터" : meta.labelKo;
  const tone = fellBack ? "warn" : meta.tone;

  const rel = relativeTimeKo(fetchedAt);
  const title = [
    `출처: ${source}`,
    `갱신: ${rel}`,
    note ? `메모: ${note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <span className={`pm-chip ${TONE_CLASS[tone]}`} title={title}>
      <span aria-hidden="true">{meta.dot}</span>
      <span>{labelKo}</span>
      {rel ? <span className="font-normal opacity-70">· {rel}</span> : null}
    </span>
  );
}
