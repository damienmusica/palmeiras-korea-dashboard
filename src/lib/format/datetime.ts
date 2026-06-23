// =============================================================================
// Date/time formatting. The dashboard is Korea-first: default timezone is
// Asia/Seoul, but matches additionally show Brazil local time. We rely on the
// platform Intl API (no extra dependency) for correct, DST-aware conversions.
// =============================================================================

export const KST_TIMEZONE = "Asia/Seoul";
export const BRAZIL_TIMEZONE = "America/Sao_Paulo";

export interface ZonedTime {
  /** e.g. "2026. 6. 23. (화) 오전 8:00" style — locale formatted. */
  formatted: string;
  /** Short date, e.g. "6월 23일". */
  date: string;
  /** Short time, e.g. "오전 8:00". */
  time: string;
  /** Weekday, e.g. "화". */
  weekday: string;
  timeZone: string;
}

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

/**
 * Format an ISO timestamp into a target timezone with Korean locale parts.
 * Throws on invalid input so callers handle it explicitly.
 */
export function formatInZone(
  iso: string,
  timeZone: string,
  locale = "ko-KR",
): ZonedTime {
  const d = new Date(iso);
  if (!isValidDate(d)) {
    throw new Error(`Invalid ISO timestamp: ${iso}`);
  }

  const date = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "long",
    day: "numeric",
  }).format(d);

  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

  const weekday = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
  }).format(d);

  const formatted = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

  return { formatted, date, time, weekday, timeZone };
}

/** Convenience: KST representation of an instant. */
export function toKST(iso: string, locale = "ko-KR"): ZonedTime {
  return formatInZone(iso, KST_TIMEZONE, locale);
}

/** Convenience: Brazil (São Paulo) representation of an instant. */
export function toBrazil(iso: string, locale = "ko-KR"): ZonedTime {
  return formatInZone(iso, BRAZIL_TIMEZONE, locale);
}

/**
 * Relative "time ago / from now" in Korean. Pass `now` for deterministic tests.
 * Returns strings like "3시간 전", "방금 전", "2일 후".
 */
export function relativeTimeKo(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (!isValidDate(d)) return "";
  const diffMs = d.getTime() - now.getTime();
  const future = diffMs > 0;
  const absSec = Math.abs(diffMs) / 1000;

  if (absSec < 45) return "방금 전";

  // Thresholds in seconds → (divisor, Korean unit), checked low to high.
  const SCALES: { limit: number; per: number; label: string }[] = [
    { limit: 3600, per: 60, label: "분" },
    { limit: 86400, per: 3600, label: "시간" },
    { limit: 86400 * 7, per: 86400, label: "일" },
    { limit: 86400 * 30, per: 86400 * 7, label: "주" },
    { limit: 86400 * 365, per: 86400 * 30, label: "개월" },
    { limit: Infinity, per: 86400 * 365, label: "년" },
  ];
  const scale = SCALES.find((s) => absSec < s.limit)!;
  const value = Math.round(absSec / scale.per);

  return future ? `${value}${scale.label} 후` : `${value}${scale.label} 전`;
}

/**
 * Whole-day difference between an instant and `now`, evaluated in a timezone.
 * 0 = today, 1 = tomorrow, -1 = yesterday. Used for "what changed today".
 */
export function dayOffsetInZone(
  iso: string,
  timeZone: string,
  now: Date = new Date(),
): number {
  const d = new Date(iso);
  if (!isValidDate(d)) return NaN;
  const toYmd = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const a = new Date(`${toYmd(d)}T00:00:00Z`).getTime();
  const b = new Date(`${toYmd(now)}T00:00:00Z`).getTime();
  return Math.round((a - b) / 86400000);
}

/** True when the instant is on "today" in the given timezone. */
export function isTodayInZone(
  iso: string,
  timeZone: string,
  now: Date = new Date(),
): boolean {
  return dayOffsetInZone(iso, timeZone, now) === 0;
}
