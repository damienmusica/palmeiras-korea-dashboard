"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
}

/** Accessible search box with a clear button. Controlled. */
export function SearchInput({ value, onChange, placeholder, label }: Props) {
  return (
    <div className="relative w-full">
      <label className="sr-only" htmlFor="search-input">
        {label}
      </label>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pm-muted)]"
        aria-hidden="true"
      >
        🔍
      </span>
      <input
        id="search-input"
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-[var(--pm-surface)] py-2 pl-9 pr-9 text-sm outline-none focus:border-[var(--pm-primary)]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-sm text-[var(--pm-muted)] hover:bg-black/5"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
