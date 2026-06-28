"use client";

import { useRef } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * Accessible single-select chip group implementing the WAI-ARIA radiogroup
 * pattern: roving tabindex (only the checked chip is tabbable) and arrow-key
 * navigation (←/↑ previous, →/↓ next, Home/End jump) that moves selection and
 * focus together. Mouse users just click.
 */
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
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusIndex(i: number) {
    const n = options.length;
    const idx = ((i % n) + n) % n; // wrap
    onChange(options[idx].value);
    refs.current[idx]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, current: number) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusIndex(current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusIndex(current - 1);
        break;
      case "Home":
        e.preventDefault();
        focusIndex(0);
        break;
      case "End":
        e.preventDefault();
        focusIndex(options.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1.5"
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
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
