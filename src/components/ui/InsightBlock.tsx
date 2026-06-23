import type { ReactNode } from "react";
import type { InterpretationSource } from "@/lib/domain/types";

const SOURCE_LABEL: Record<InterpretationSource, string> = {
  editorial: "에디토리얼",
  rule: "자동 해설",
  seed: "기본 해설",
};

/**
 * Highlighted block for interpretive Korean content ("왜 중요한가", viewing
 * points, result reading, etc.). Always carries a small provenance tag so users
 * know this is editorial context, not a raw data field.
 */
export function InsightBlock({
  icon = "💡",
  title,
  source,
  children,
  tone = "primary",
}: {
  icon?: string;
  title: string;
  source?: InterpretationSource;
  children: ReactNode;
  tone?: "primary" | "neutral" | "warn";
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-300 bg-amber-50"
      : tone === "neutral"
        ? "border-black/10 bg-black/[0.02]"
        : "border-[var(--pm-primary)]/30 bg-[var(--pm-primary)]/[0.06]";

  return (
    <section className={`rounded-xl border p-3 ${toneClass}`}>
      <header className="mb-1 flex items-center gap-1.5">
        <span aria-hidden="true">{icon}</span>
        <h4 className="text-sm font-bold">{title}</h4>
        {source ? (
          <span className="pm-chip ml-auto bg-black/5 text-[10px] text-[var(--pm-muted)]">
            ✎ {SOURCE_LABEL[source]}
          </span>
        ) : null}
      </header>
      <div className="text-sm leading-relaxed text-[var(--pm-ink)]">
        {children}
      </div>
    </section>
  );
}
