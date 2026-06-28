import type { LineupLine, LineupPlayer, TeamLineup } from "@/lib/domain/types";

// Lines top → bottom: forwards at the top (attacking), keeper at the back.
const LINES_TOP_DOWN: LineupLine[] = ["FWD", "MID", "DEF", "GK"];

/** Left → centre → right hint from an ESPN position abbreviation. */
function horizRank(pos?: string): number {
  const p = (pos || "").toUpperCase();
  if (/^L|L$|LEFT/.test(p)) return 0;
  if (/^R|R$|RIGHT/.test(p)) return 2;
  return 1;
}

function PlayerChip({ p }: { p: LineupPlayer }) {
  return (
    <div className="flex w-[4.25rem] flex-col items-center gap-0.5 text-center">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-extrabold tabular-nums text-[var(--pm-primary)] shadow">
        {p.number ?? "–"}
        {p.subbedOut ? (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white"
            title="교체 아웃"
            aria-label="교체 아웃"
          >
            ↓
          </span>
        ) : null}
      </span>
      <span className="max-w-[4.25rem] truncate text-[10px] font-semibold leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
        {p.nameKo}
      </span>
    </div>
  );
}

/**
 * Render one team's starting XI on a vertical pitch, grouped into position
 * lines derived from each player's ESPN position. The formation string is shown
 * as reported by the source; subbed-off starters get a marker and the bench is
 * listed below. Deterministic — no fabricated coordinates.
 */
export function FormationPitch({
  lineup,
  title,
}: {
  lineup: TeamLineup;
  title: string;
}) {
  const rows = LINES_TOP_DOWN.map((line) => ({
    line,
    players: lineup.starters
      .filter((p) => p.line === line)
      .sort(
        (a, b) =>
          horizRank(a.pos) - horizRank(b.pos) ||
          (a.formationPlace ?? 99) - (b.formationPlace ?? 99),
      ),
  })).filter((r) => r.players.length > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-bold">{title}</h3>
        {lineup.formation ? (
          <span className="pm-chip bg-[var(--pm-primary)]/10 font-bold text-[var(--pm-primary)]">
            {lineup.formation}
          </span>
        ) : null}
      </div>
      <div className="flex min-h-[18rem] flex-col justify-between gap-2 rounded-xl bg-gradient-to-b from-emerald-700 to-emerald-600 px-2 py-5">
        {rows.map((r) => (
          <div key={r.line} className="flex items-start justify-evenly gap-1">
            {r.players.map((p, i) => (
              <PlayerChip key={`${p.name}-${i}`} p={p} />
            ))}
          </div>
        ))}
      </div>
      {lineup.bench.length > 0 ? (
        <p className="text-xs leading-relaxed text-[var(--pm-muted)]">
          <span className="font-semibold text-[var(--pm-ink)]">교체 명단</span>{" "}
          {lineup.bench
            .map(
              (b) =>
                `${b.number != null ? b.number + " " : ""}${b.nameKo}${
                  b.subbedIn ? " ▲" : ""
                }`,
            )
            .join(", ")}
        </p>
      ) : null}
    </div>
  );
}
