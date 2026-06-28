import type { FormResult } from "@/lib/domain/types";
import { formLabelKo, formTone } from "@/lib/format/stats";

// White text on these fills clears WCAG-AA (emerald-700 5.5:1, gray-500 4.8:1,
// rose-600 4.7:1); emerald-600/gray-400 would not.
const toneClass: Record<ReturnType<typeof formTone>, string> = {
  win: "bg-emerald-700 text-white",
  draw: "bg-gray-500 text-white",
  loss: "bg-rose-600 text-white",
};

/** Recent form as a row of W/D/L pills. Includes an accessible label. */
export function FormBadges({
  form,
  size = "md",
}: {
  form: FormResult[];
  size?: "sm" | "md";
}) {
  if (form.length === 0) {
    return <span className="text-xs text-[var(--pm-muted)]">기록 없음</span>;
  }
  const dim = size === "sm" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs";
  const aria = form.map((f) => formLabelKo(f)).join(", ");
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`최근 폼: ${aria}`}
    >
      {form.map((f, i) => (
        <span
          key={i}
          className={`inline-flex items-center justify-center rounded-md font-bold ${dim} ${toneClass[formTone(f)]}`}
          aria-hidden="true"
        >
          {f}
        </span>
      ))}
    </div>
  );
}
