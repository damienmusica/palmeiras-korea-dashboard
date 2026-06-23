import Link from "next/link";
import type { Player } from "@/lib/domain/types";
import {
  ageFromBirthDate,
  availabilityKo,
  aggregateStats,
} from "@/lib/format/stats";
import { playerInsight } from "@/lib/interpret/players";
import { Crest } from "@/components/ui/Crest";

const toneClass = {
  ok: "bg-emerald-100 text-emerald-800",
  warn: "bg-rose-100 text-rose-800",
  info: "bg-sky-100 text-sky-800",
} as const;

export function PlayerCard({ player }: { player: Player }) {
  const age = ageFromBirthDate(player.birthDate);
  const status = availabilityKo(player.availability);
  const agg = aggregateStats(player.stats);
  const insight = playerInsight(player);

  return (
    <Link
      href={`/squad/${player.id}`}
      className="pm-card group flex flex-col gap-3 p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {player.photo ? (
            <Crest
              src={player.photo}
              alt={`${player.name} 사진`}
              label={player.nameKo}
              size={48}
              className="rounded-xl bg-black/5"
            />
          ) : (
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pm-primary)] text-lg font-extrabold text-white"
              aria-hidden="true"
            >
              {player.number ?? "–"}
            </span>
          )}
          {player.photo && player.number != null ? (
            <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-md bg-[var(--pm-primary)] px-1 text-[10px] font-bold text-white">
              {player.number}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold group-hover:text-[var(--pm-primary)]">
            {player.nameKo}
          </h3>
          <p className="truncate text-xs text-[var(--pm-muted)]">
            {player.name} · {player.positionKo}
          </p>
        </div>
        <span className={`pm-chip ${toneClass[status.tone]}`}>
          {status.label}
        </span>
      </div>

      {/* one-line Korean interpretation */}
      <p className="line-clamp-2 rounded-lg bg-[var(--pm-primary)]/[0.06] px-2 py-1.5 text-xs text-[var(--pm-ink)]">
        <span className="font-bold text-[var(--pm-primary)]">
          {insight.roleKo}
        </span>{" "}
        · {insight.styleKo}
      </p>

      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="국적" value={player.nationalityKo} />
        <Stat label="나이" value={age !== null ? `${age}세` : "–"} />
        <Stat label="포지션" value={player.positionGroup} />
      </dl>

      {agg ? (
        <div className="flex items-center justify-around border-t border-black/5 pt-2 text-center">
          <Mini label="출전" value={agg.appearances} />
          {player.positionGroup === "GK" ? (
            <>
              <Mini label="선방" value={agg.saves ?? 0} />
              <Mini label="실점" value={agg.goalsConceded ?? 0} />
            </>
          ) : (
            <>
              <Mini label="골" value={agg.goals} />
              <Mini label="도움" value={agg.assists} />
            </>
          )}
        </div>
      ) : (
        <p className="border-t border-black/5 pt-2 text-center text-xs italic text-[var(--pm-muted)]">
          시즌 스탯 정보 없음
        </p>
      )}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/[0.03] py-1.5">
      <dt className="text-[10px] text-[var(--pm-muted)]">{label}</dt>
      <dd className="truncate font-semibold">{value}</dd>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-base font-extrabold tabular-nums text-[var(--pm-primary)]">
        {value}
      </p>
      <p className="text-[10px] text-[var(--pm-muted)]">{label}</p>
    </div>
  );
}
