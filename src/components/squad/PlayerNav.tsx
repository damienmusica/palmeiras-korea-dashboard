import Link from "next/link";
import type { Player } from "@/lib/domain/types";

/**
 * Previous/next player navigation, so a reader can move between squad members
 * (e.g. read the forwards in sequence) without going back to the list and
 * re-scrolling — the "return to where you were / keep exploring" UX.
 */
export function PlayerNav({
  prev,
  next,
  ariaLabel = "선수 이동",
}: {
  prev: Player | null;
  next: Player | null;
  /** Distinct per instance so two navs on one page stay landmark-unique. */
  ariaLabel?: string;
}) {
  if (!prev && !next) return null;
  return (
    <nav aria-label={ariaLabel} className="flex items-stretch gap-2">
      <NavLink player={prev} dir="prev" />
      <NavLink player={next} dir="next" />
    </nav>
  );
}

function NavLink({
  player,
  dir,
}: {
  player: Player | null;
  dir: "prev" | "next";
}) {
  const isPrev = dir === "prev";
  if (!player) return <span className="flex-1" aria-hidden="true" />;
  return (
    <Link
      href={`/squad/${player.id}`}
      className={`flex flex-1 items-center gap-2 rounded-xl border border-black/5 bg-[var(--pm-surface)] px-3 py-2 transition-colors hover:bg-[var(--pm-primary)]/[0.05] focus-visible:bg-[var(--pm-primary)]/[0.05] ${
        isPrev ? "" : "flex-row-reverse text-right"
      }`}
      aria-label={`${isPrev ? "이전" : "다음"} 선수: ${player.nameKo}`}
    >
      <span aria-hidden="true" className="text-lg text-[var(--pm-muted)]">
        {isPrev ? "←" : "→"}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] text-[var(--pm-muted)]">
          {isPrev ? "이전" : "다음"}
        </span>
        <span className="block truncate text-sm font-bold">
          {player.nameKo}
        </span>
        <span className="block truncate text-[10px] text-[var(--pm-muted)]">
          {player.positionKo}
        </span>
      </span>
    </Link>
  );
}
