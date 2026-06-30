import type { NewsItem, SourceLanguage } from "@/lib/domain/types";
import { relativeTimeKo, toKST } from "@/lib/format/datetime";
import { RELIABILITY_META, isNotableReliability } from "@/lib/interpret/news";
import { safeUrl } from "@/lib/security/url";

const LANG_KO: Record<SourceLanguage, string> = {
  pt: "포르투갈어",
  en: "영어",
  ko: "한국어",
  es: "스페인어",
  other: "기타",
};

const RELIABILITY_TONE: Record<string, string> = {
  official: "bg-emerald-100 text-emerald-800",
  good: "bg-sky-100 text-sky-800",
  warn: "bg-amber-100 text-amber-800",
  neutral: "bg-black/5 text-[var(--pm-muted)]",
};

export function NewsCard({ item }: { item: NewsItem }) {
  const kst = toKST(item.publishedAt);
  const reliability = item.reliability ?? "unknown";
  const relMeta = RELIABILITY_META[reliability];
  // Only surface the reliability marker when it differentiates (공식/루머/재가공/
  // 기타). Established media is the silent baseline — no chip — so the marker
  // stays meaningful instead of decorating ~2/3 of cards. official also gets a ✓.
  const showReliability = isNotableReliability(reliability);
  // The "왜 중요한가"/"팬 한 줄" are written by the free-tier LLM (tagged
  // "AI요약" at ingest) and can be wrong, so they carry a visible AI disclosure.
  // Deterministic-template fallbacks (no tag) are safe generics and don't.
  const aiInterpreted = (item.tags ?? []).includes("AI요약");

  return (
    <article className="pm-card flex flex-col gap-2 p-4">
      {/* metadata row: source / reliability (only when notable) / language / time */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="pm-chip bg-[var(--pm-primary)]/10 text-[var(--pm-primary-text)]">
          {item.source}
        </span>
        {showReliability ? (
          <span
            className={`pm-chip ${RELIABILITY_TONE[relMeta.tone]}`}
            title={relMeta.descKo}
          >
            {reliability === "official"
              ? `✓ ${relMeta.labelKo}`
              : relMeta.labelKo}
          </span>
        ) : null}
        <span className="pm-chip bg-black/5 text-[var(--pm-muted)]">
          원문: {LANG_KO[item.language]}
        </span>
        <time
          dateTime={item.publishedAt}
          className="ml-auto text-[var(--pm-muted)]"
          title={kst.formatted}
        >
          {relativeTimeKo(item.publishedAt)}
        </time>
      </div>

      {/* original headline (preserved) + Korean summary */}
      <h3 className="text-base font-bold leading-snug">{item.title}</h3>
      <p className="text-sm text-[var(--pm-ink)]">{item.summaryKo}</p>

      {item.excerpt ? (
        <p className="border-l-2 border-black/10 pl-2 text-xs italic text-[var(--pm-muted)]">
          “{item.excerpt}”
        </p>
      ) : null}

      {/* interpretation: why it matters */}
      {item.whyItMattersKo ? (
        <div className="rounded-lg bg-[var(--pm-primary)]/[0.06] p-2.5">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-[var(--pm-primary-text)]">
              왜 중요한가
            </p>
            {aiInterpreted ? (
              <span
                className="pm-chip bg-black/5 text-[var(--pm-muted)]"
                title="이 해설은 AI가 자동 생성했습니다. 사실관계는 원문에서 확인하세요."
              >
                AI 생성
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm leading-relaxed">
            {item.whyItMattersKo}
          </p>
        </div>
      ) : null}

      {/* fan one-liner */}
      {item.fanTakeKo ? (
        <p className="text-sm">
          <span className="font-bold">🟢 팬 한 줄:</span>{" "}
          <span className="text-[var(--pm-ink)]">{item.fanTakeKo}</span>
        </p>
      ) : null}

      {/* The per-card "AI 생성" chip above is the visible provenance signal;
          the caveat ("AI-written, verify at source") is explained once in the
          list legend rather than repeated on every card — same anti-noise rule
          as the reliability markers. */}

      <div className="mt-1 flex items-center justify-end">
        <a
          href={safeUrl(item.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-semibold text-[var(--pm-primary-text)] hover:underline"
        >
          원문 보기 ↗
        </a>
      </div>
    </article>
  );
}
