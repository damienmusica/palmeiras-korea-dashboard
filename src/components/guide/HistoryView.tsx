import type { HistoryEra, HonourLine } from "@/lib/domain/types";

/** Vertical milestone timeline of the club's history. */
export function HistoryTimeline({ history }: { history: HistoryEra[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-[var(--pm-primary)]/20 pl-5">
      {history.map((e) => (
        <li key={e.period} className="relative">
          <span
            className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[var(--pm-primary)]"
            aria-hidden="true"
          />
          <div className="pm-card p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="pm-chip bg-[var(--pm-primary)] text-white tabular-nums">
                {e.period}
              </span>
              <h3 className="font-bold">{e.titleKo}</h3>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed">{e.bodyKo}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const TIER_CLASS: Record<string, string> = {
  대륙: "bg-amber-100 text-amber-800",
  국제: "bg-amber-100 text-amber-800",
  전국: "bg-emerald-100 text-emerald-800",
  국내컵: "bg-sky-100 text-sky-800",
  국내: "bg-sky-100 text-sky-800",
};

/** Detailed honours with exact winning years. */
export function HonoursList({ honours }: { honours: HonourLine[] }) {
  const total = honours.reduce((n, h) => n + h.count, 0);
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {honours.map((h) => (
          <li key={h.competition} className="pm-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`pm-chip ${TIER_CLASS[h.tierKo] ?? "bg-black/5 text-[var(--pm-muted)]"}`}
              >
                {h.tierKo}
              </span>
              <h3 className="font-bold">{h.competitionKo}</h3>
              <span className="text-xs text-[var(--pm-muted)]">
                {h.competition}
              </span>
              <span className="ml-auto text-lg font-extrabold text-[var(--pm-primary-text)] tabular-nums">
                {h.count}
                <span className="ml-0.5 text-xs font-normal text-[var(--pm-muted)]">
                  회
                </span>
              </span>
            </div>
            <p className="mt-1 text-sm tabular-nums text-[var(--pm-ink)]">
              {h.yearsKo}
            </p>
            {h.noteKo ? (
              <p className="mt-1 text-xs italic text-[var(--pm-muted)]">
                ※ {h.noteKo}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--pm-muted)]">
        주요 공식 타이틀만 추렸으며, 집계 기준에 따라 합계는 달라질 수 있습니다
        (위 기준 합계 약 {total}회).
      </p>
    </div>
  );
}
