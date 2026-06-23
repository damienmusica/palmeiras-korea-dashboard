import type { ReactNode } from "react";

/** Polished empty/error placeholder used across sections. */
export function EmptyState({
  icon = "🌱",
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={`pm-card flex flex-col items-center justify-center gap-2 px-6 py-10 text-center ${
        tone === "error" ? "border-rose-200" : ""
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-[var(--pm-muted)]">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
