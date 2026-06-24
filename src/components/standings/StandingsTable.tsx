import type { Standings } from "@/lib/domain/types";
import { FormBadges } from "@/components/ui/FormBadges";
import { Crest } from "@/components/ui/Crest";
import { formatGoalDiff } from "@/lib/format/stats";

/** League table with the tracked team highlighted + qualification-zone hints. */
export function StandingsTable({ standings }: { standings: Standings }) {
  return (
    <div className="pm-card overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">
          {standings.competition.nameKo} {standings.season} 순위표
        </caption>
        <thead>
          <tr className="border-b border-black/10 text-left text-xs text-[var(--pm-muted)]">
            <th scope="col" className="px-3 py-2">
              순위
            </th>
            <th scope="col" className="px-3 py-2">
              팀
            </th>
            <th scope="col" className="px-2 py-2 text-center" title="경기">
              경기
            </th>
            <th scope="col" className="px-2 py-2 text-center" title="승">
              승
            </th>
            <th scope="col" className="px-2 py-2 text-center" title="무">
              무
            </th>
            <th scope="col" className="px-2 py-2 text-center" title="패">
              패
            </th>
            <th scope="col" className="px-2 py-2 text-center" title="득실차">
              득실
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-center font-bold"
              title="승점"
            >
              승점
            </th>
            <th scope="col" className="px-3 py-2 text-center">
              최근 5
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.table.map((row) => (
            <tr
              key={row.teamId}
              className={`border-b border-black/5 ${
                row.isTracked
                  ? "bg-[var(--pm-primary)]/[0.08] font-semibold"
                  : ""
              }`}
            >
              <td className="px-3 py-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs ${
                    row.rank <= 4
                      ? "bg-emerald-600 text-white"
                      : row.rank <= 6
                        ? "bg-sky-500 text-white"
                        : "bg-black/5 text-[var(--pm-ink)]"
                  }`}
                >
                  {row.rank}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-2">
                  <Crest
                    src={row.crest}
                    alt={`${row.teamName} 엠블럼`}
                    label={row.teamName}
                    size={20}
                  />
                  <span>{row.teamNameKo}</span>
                  {row.isTracked ? (
                    <span className="text-[var(--pm-primary)]">●</span>
                  ) : null}
                </span>
              </td>
              <td className="px-2 py-2 text-center tabular-nums">
                {row.played}
              </td>
              <td className="px-2 py-2 text-center tabular-nums">{row.won}</td>
              <td className="px-2 py-2 text-center tabular-nums">
                {row.drawn}
              </td>
              <td className="px-2 py-2 text-center tabular-nums">{row.lost}</td>
              <td className="px-2 py-2 text-center tabular-nums">
                {formatGoalDiff(row.goalDifference)}
              </td>
              <td className="px-2 py-2 text-center font-bold tabular-nums">
                {row.points}
              </td>
              <td className="px-3 py-2">
                <div className="flex justify-center">
                  {row.form.length > 0 ? (
                    <FormBadges form={row.form} size="sm" />
                  ) : (
                    <span
                      className="text-xs text-[var(--pm-muted)]"
                      title="최근 폼 데이터 미제공"
                    >
                      —
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 border-t border-black/5 px-3 py-2 text-xs text-[var(--pm-muted)]">
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-emerald-600 align-middle" />
          리베르타도레스권 (대략)
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-sky-500 align-middle" />
          상위권
        </span>
      </div>
    </div>
  );
}
