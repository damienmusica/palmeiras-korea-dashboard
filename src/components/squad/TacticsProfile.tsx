import type { TacticalProfile } from "@/lib/domain/types";
import { Collapsible } from "@/components/ui/Collapsible";

/**
 * "How they play" — the manager's system in plain Korean. Collapsed by default
 * (progressive disclosure) so it doesn't wall off the top of the squad page; the
 * summary line names the system and the base formation, full detail one tap away.
 */
export function TacticsProfile({ tactics }: { tactics: TacticalProfile }) {
  return (
    <Collapsible
      className="pm-card p-4"
      bodyClassName="mt-3 space-y-3 border-t border-black/5 pt-3"
      summary={
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span aria-hidden="true" className="text-xl leading-none">
            ⚙️
          </span>
          <h3 className="font-bold">아벨의 시스템 — 이렇게 싸운다</h3>
          <span className="rounded bg-[var(--pm-primary)]/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-[var(--pm-primary-text)]">
            {tactics.baseFormationKo.split(/[ (]/)[0]}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--pm-muted)]">
            <span aria-hidden="true">✎</span> 에디토리얼
          </span>
        </div>
      }
    >
      <p className="text-sm leading-relaxed">{tactics.summaryKo}</p>

      <div className="rounded-lg bg-[var(--pm-primary)]/8 px-3 py-2">
        <p className="text-[11px] font-semibold text-[var(--pm-muted)]">
          기본 포메이션
        </p>
        <p className="text-sm font-bold tabular-nums text-[var(--pm-primary-text)]">
          {tactics.baseFormationKo}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tactics.principlesKo.map((p) => (
          <li key={p.titleKo} className="rounded-lg border border-black/5 p-3">
            <p className="text-sm font-bold">{p.titleKo}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--pm-ink)]">
              {p.bodyKo}
            </p>
          </li>
        ))}
      </ul>

      {tactics.noteKo ? (
        <p className="text-xs italic text-[var(--pm-muted)]">
          ※ {tactics.noteKo}
        </p>
      ) : null}
    </Collapsible>
  );
}
