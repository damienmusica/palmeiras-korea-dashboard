import Link from "next/link";
import type { Briefing as BriefingType } from "@/lib/domain/types";
import { relativeTimeKo } from "@/lib/format/datetime";

/**
 * "오늘의 5분 파우메이라스 브리핑" — the flagship interpretation surface. A scannable
 * set of cards a newcomer can read in five minutes to understand where the club
 * stands right now and why it matters.
 */
export function Briefing({ briefing }: { briefing: BriefingType }) {
  return (
    <section
      aria-labelledby="briefing-heading"
      className="overflow-hidden rounded-2xl border border-[var(--pm-primary)]/20 bg-gradient-to-br from-[var(--pm-primary)] to-[var(--pm-primary-dark)] text-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <div>
          <h2 id="briefing-heading" className="text-xl font-extrabold">
            ⏱️ 오늘의 5분 파우메이라스 브리핑
          </h2>
          <p className="text-sm text-white/80">
            지금 파우메이라스를 한국어로 가장 빠르게 이해하는 법
          </p>
        </div>
        <span
          className="pm-chip bg-white/15 text-white"
          title={`기준 시각: ${briefing.asOf}`}
        >
          ✎ 에디토리얼 · {relativeTimeKo(briefing.asOf)} 기준
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {briefing.items.map((item, i) => {
          const inner = (
            <div className="flex h-full flex-col gap-1 bg-[var(--pm-primary)] p-4 transition-colors hover:bg-[var(--pm-primary-dark)]">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </div>
              <p className="text-sm font-bold leading-snug">
                {item.headlineKo}
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
                {item.bodyKo}
              </p>
              {item.href ? (
                <span className="mt-auto pt-1 text-xs font-semibold text-[var(--pm-accent)]">
                  자세히 →
                </span>
              ) : null}
            </div>
          );
          return item.href ? (
            <Link
              key={i}
              href={item.href}
              className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {inner}
            </Link>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
