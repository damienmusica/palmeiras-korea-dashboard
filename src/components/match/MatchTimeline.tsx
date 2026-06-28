import type { Match, MatchEvent } from "@/lib/domain/types";

const ICON: Record<MatchEvent["type"], string> = {
  goal: "⚽",
  penalty: "⚽",
  yellow: "🟨",
  red: "🟥",
  sub: "🔁",
};

const TYPE_KO: Record<MatchEvent["type"], string> = {
  goal: "골",
  penalty: "페널티킥 골",
  yellow: "경고",
  red: "퇴장",
  sub: "교체",
};

/** Korean description of a single event (JSX so subs/goals can be styled). */
function describe(e: MatchEvent) {
  if (e.type === "sub") {
    return (
      <>
        <span className="font-semibold">{e.player}</span>
        <span className="font-bold text-emerald-600"> ▲</span>
        {e.detail ? (
          <span className="text-[var(--pm-muted)]">
            {" · "}
            {e.detail}
            <span className="font-bold text-rose-600"> ▼</span>
          </span>
        ) : null}
      </>
    );
  }
  if (e.type === "goal" || e.type === "penalty") {
    return (
      <>
        <span className="font-semibold">{e.player}</span>
        {e.type === "penalty" ? " (PK)" : ""}
        {e.detail ? (
          <span className="text-[var(--pm-muted)]"> (도움 {e.detail})</span>
        ) : null}
      </>
    );
  }
  return <span className="font-medium">{e.player}</span>;
}

/**
 * Chronological match event timeline (goals, cards, subs). Tracked-team-aware
 * coloring; home events align left, away events right. Returns null when there
 * are no events (the caller shows an honest placeholder).
 */
export function MatchTimeline({ match }: { match: Match }) {
  const events = (match.events ?? [])
    .slice()
    .sort((a, b) => a.minute - b.minute);
  if (events.length === 0) return null;

  return (
    <ol className="space-y-1">
      {events.map((e, i) => {
        const home = e.team === "home";
        return (
          <li
            key={i}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 odd:bg-black/[0.03] ${
              home ? "" : "flex-row-reverse text-right"
            }`}
          >
            <span className="w-12 shrink-0 text-center text-xs font-bold tabular-nums text-[var(--pm-muted)]">
              {e.clock ?? `${e.minute}'`}
            </span>
            <span className="text-base leading-none" aria-hidden="true">
              {ICON[e.type]}
            </span>
            <span className="flex-1 text-sm">
              <span className="sr-only">{TYPE_KO[e.type]}: </span>
              {describe(e)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
