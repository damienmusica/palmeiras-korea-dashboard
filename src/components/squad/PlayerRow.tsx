import Link from "next/link";
import type { Player } from "@/lib/domain/types";
import { ageFromBirthDate, aggregateStats } from "@/lib/format/stats";
import { Crest } from "@/components/ui/Crest";

/**
 * Compact one-line squad row for the scannable "list" view — lets a reader skim
 * many players (e.g. all forwards) with minimal scrolling, vs the taller grid
 * cards. Links to the same detail page.
 */
export function PlayerRow({ player }: { player: Player }) {
  const agg = aggregateStats(player.stats);
  const age = ageFromBirthDate(player.birthDate);
  const unverified = player.confidence === "unverified";
  const isGK = player.positionGroup === "GK";
  const keyStat = agg
    ? isGK
      ? `${agg.appearances}경기 · ${agg.saves ?? 0}선방`
      : `${agg.appearances}경기 · ${agg.goals}골 ${agg.assists}도움`
    : "기록 없음";

  return (
    <Link
      href={`/squad/${player.id}`}
      className="flex items-center gap-3 bg-[var(--pm-surface)] px-3 py-2 transition-colors hover:bg-[var(--pm-primary)]/[0.05] focus-visible:bg-[var(--pm-primary)]/[0.05]"
    >
      <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded bg-black/5 text-xs font-bold tabular-nums text-[var(--pm-muted)]">
        {player.number ?? "–"}
      </span>
      <Crest
        src={player.photo}
        alt={`${player.name} 사진`}
        label={player.nameKo}
        size={28}
        className="rounded-md bg-black/5"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-bold">{player.nameKo}</span>
          {unverified ? (
            <span className="shrink-0 rounded bg-rose-100 px-1 text-[10px] font-semibold text-rose-800">
              확인 필요
            </span>
          ) : null}
        </span>
        <span className="truncate text-xs text-[var(--pm-muted)]">
          {player.positionKo}
          {age !== null ? ` · ${age}세` : ""} · {player.nationalityKo}
        </span>
      </span>
      <span className="shrink-0 text-right text-xs tabular-nums text-[var(--pm-muted)]">
        {keyStat}
      </span>
    </Link>
  );
}
