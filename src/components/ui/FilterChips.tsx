"use client";

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Accessible single-select chip group (radio semantics). */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              active
                ? "bg-[var(--pm-primary)] text-white"
                : "bg-black/5 text-[var(--pm-ink)] hover:bg-black/10"
            }`}
          >
            {opt.label}
            {typeof opt.count === "number" ? (
              <span
                className={active ? "opacity-80" : "text-[var(--pm-muted)]"}
              >
                {" "}
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
