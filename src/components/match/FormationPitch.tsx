import type { LineupPlayer, TeamLineup } from "@/lib/domain/types";

/** Left → centre → right hint from an ESPN position abbreviation. */
function horizRank(pos?: string): number {
  const p = (pos || "").toUpperCase();
  if (/^L|L$|LEFT/.test(p)) return 0;
  if (/^R|R$|RIGHT/.test(p)) return 2;
  return 1;
}

/**
 * Depth (defence → attack) rank from an ESPN position abbreviation, used to
 * order outfield players before slicing them into the formation's bands. The
 * coarse buckets are all that matter: fullbacks sit with the back line,
 * defensive mids ahead of them, then central/wide mids, attacking mids/wingers,
 * then forwards.
 */
function depthRank(pos?: string): number {
  const p = (pos || "").toUpperCase();
  if (/^G/.test(p)) return 0;
  if (/^(CB|CD|SW)/.test(p) || p === "D") return 10; // centre-backs
  if (/^(LB|RB|LWB|RWB|WB)/.test(p)) return 12; // full/wing-backs (back line)
  if (/^(DM|CDM|HM)/.test(p)) return 20; // holding mids
  if (/^(CM|LM|RM|WM|M)/.test(p)) return 30; // central / side mids
  if (/^(AM|CAM|LW|RW|SS|EM)/.test(p)) return 40; // attacking mids / wingers
  if (/^(CF|ST|F|LF|RF)/.test(p)) return 50; // forwards
  return 30; // unknown → treat as a midfielder
}

/**
 * Parse a formation string into its outfield band sizes (defence → attack),
 * e.g. "4-2-3-1" → [4,2,3,1]. Returns null when it isn't a clean 10-outfield
 * formation, so the caller falls back to coarse line bucketing.
 */
export function formationBands(formation?: string): number[] | null {
  if (!formation) return null;
  const nums = formation
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(Number);
  if (nums.length < 2 || nums.some((n) => !Number.isFinite(n) || n <= 0)) {
    return null;
  }
  if (nums.reduce((a, b) => a + b, 0) !== 10) return null; // 10 outfield + GK
  return nums;
}

export interface DistributedXI {
  gk: LineupPlayer;
  /** Outfield bands, defence → attack, each already L→R ordered. */
  rows: LineupPlayer[][];
}

/**
 * Distribute a starting XI into rows that match the formation label's numbers
 * (e.g. a 4-2-3-1 renders as 4 distinct rows, not a single 5-man midfield).
 * Players are ordered by positional depth and sliced into bands of the
 * formation's sizes; within a band they're ordered left → right. Returns null
 * when the formation can't be parsed or the XI isn't 1 GK + 10 outfield, so the
 * caller falls back to coarse GK/DEF/MID/FWD bucketing.
 */
export function distributeByFormation(
  starters: LineupPlayer[],
  formation?: string,
): DistributedXI | null {
  const bands = formationBands(formation);
  if (!bands) return null;
  const gk =
    starters.find((p) => /^G/.test((p.pos || "").toUpperCase())) ??
    starters.find((p) => p.line === "GK");
  if (!gk) return null;
  const outfield = starters.filter((p) => p !== gk);
  if (outfield.length !== 10) return null;

  const sorted = [...outfield].sort(
    (a, b) =>
      depthRank(a.pos) - depthRank(b.pos) ||
      (a.formationPlace ?? 99) - (b.formationPlace ?? 99),
  );
  const rows: LineupPlayer[][] = [];
  let i = 0;
  for (const n of bands) {
    const band = sorted
      .slice(i, i + n)
      .sort(
        (a, b) =>
          horizRank(a.pos) - horizRank(b.pos) ||
          (a.formationPlace ?? 99) - (b.formationPlace ?? 99),
      );
    rows.push(band);
    i += n;
  }
  return { gk, rows };
}

// Fallback: coarse GK/DEF/MID/FWD bucketing when the formation can't drive the
// layout. Lines top → bottom: forwards at the top (attacking), keeper at back.
const FALLBACK_LINES: LineupPlayer["line"][] = ["FWD", "MID", "DEF", "GK"];

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
 * Render one team's starting XI on a vertical pitch. When the formation string
 * is parseable the rows match its numbers exactly (a 4-2-3-1 shows four bands);
 * otherwise players fall back to coarse position-line bucketing. Subbed-off
 * starters get a marker and the bench is listed below. Deterministic — no
 * fabricated coordinates.
 */
export function FormationPitch({
  lineup,
  title,
}: {
  lineup: TeamLineup;
  title: string;
}) {
  const distributed = distributeByFormation(lineup.starters, lineup.formation);

  // Rows top → bottom: forwards at the top, keeper at the back.
  let rowsTopDown: LineupPlayer[][];
  if (distributed) {
    rowsTopDown = [
      ...[...distributed.rows].reverse(), // attack → defence
      [distributed.gk],
    ];
  } else {
    rowsTopDown = FALLBACK_LINES.map((line) =>
      lineup.starters
        .filter((p) => p.line === line)
        .sort(
          (a, b) =>
            horizRank(a.pos) - horizRank(b.pos) ||
            (a.formationPlace ?? 99) - (b.formationPlace ?? 99),
        ),
    );
  }
  const rows = rowsTopDown.filter((r) => r.length > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-bold">{title}</h3>
        {lineup.formation ? (
          <span className="pm-chip bg-[var(--pm-primary)]/10 font-bold text-[var(--pm-primary-text)]">
            {lineup.formation}
          </span>
        ) : null}
      </div>
      <div className="flex min-h-[18rem] flex-col justify-between gap-2 rounded-xl bg-gradient-to-b from-emerald-800 to-emerald-700 px-2 py-5">
        {rows.map((players, idx) => (
          <div key={idx} className="flex items-start justify-evenly gap-1">
            {players.map((p, i) => (
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
