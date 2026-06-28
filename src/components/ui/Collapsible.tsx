import type { ReactNode } from "react";

/**
 * Progressive-disclosure wrapper. Long/secondary content is collapsed by default
 * so a reader opens only what they want (see the user UX directive). Built on the
 * native <details>/<summary> so it's keyboard-accessible and works without JS —
 * no client component needed. `summary` is the always-visible header; a chevron
 * is appended and rotates on open via a CSS-only group variant.
 */
export function Collapsible({
  summary,
  children,
  defaultOpen = false,
  className = "",
  bodyClassName = "mt-2",
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <details open={defaultOpen} className={`group ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">{summary}</div>
        <span
          aria-hidden="true"
          className="shrink-0 text-[var(--pm-muted)] transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className={bodyClassName}>{children}</div>
    </details>
  );
}
