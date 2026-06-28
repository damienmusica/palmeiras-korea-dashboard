import { allCompetitionContexts } from "@/lib/interpret/competitions";

/**
 * Beginner primer that explains the Brazilian competition landscape. Rendered as
 * native <details> so it's keyboard-accessible and collapsible without JS.
 */
export function CompetitionPrimer() {
  const contexts = allCompetitionContexts();
  return (
    <details className="pm-card group p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
        <span>📚 대회가 헷갈리나요? 브라질 축구 대회 한눈에 보기</span>
        <span
          className="text-[var(--pm-muted)] transition-transform group-open:rotate-180"
          aria-hidden="true"
        >
          ▾
        </span>
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {contexts.map((c) => (
          <div key={c.id} className="rounded-xl bg-black/[0.03] p-3">
            <p className="font-bold text-[var(--pm-primary-text)]">
              {c.nameKo}
            </p>
            <p className="text-xs font-semibold text-[var(--pm-muted)]">
              {c.taglineKo}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{c.explainerKo}</p>
            <p className="mt-1 text-xs font-semibold text-[var(--pm-primary-text)]">
              ⭐ {c.stakesKo}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}
