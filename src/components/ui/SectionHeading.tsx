import type { ReactNode } from "react";

/** Consistent section header with optional Portuguese/English subtitle + slot. */
export function SectionHeading({
  title,
  subtitle,
  source,
  children,
}: {
  title: string;
  subtitle?: string;
  source?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-[var(--pm-muted)]">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {source}
        {children}
      </div>
    </div>
  );
}
