import type {
  CompetitionCampaign,
  CampaignTie,
  CampaignGroup,
} from "@/lib/domain/types";
import { Crest } from "@/components/ui/Crest";
import { formatGoalDiff } from "@/lib/format/stats";
import { toKST } from "@/lib/format/datetime";

const KIND_LABEL: Record<string, string> = {
  continental: "대륙",
  cup: "국내컵",
  league: "리그",
};

/**
 * The tracked team's continental (Libertadores) and domestic-cup (Copa do
 * Brasil) campaigns: a group mini-table when applicable plus the knockout tie(s)
 * it is in. Renders nothing when no campaign data is available (honest — we
 * never fabricate a bracket).
 */
export function CampaignSection({
  campaigns,
}: {
  campaigns: CompetitionCampaign[];
}) {
  if (campaigns.length === 0) return null;
  return (
    <section className="space-y-3" aria-labelledby="campaigns-heading">
      <div className="flex items-baseline justify-between">
        <h2 id="campaigns-heading" className="text-lg font-bold">
          🏆 대륙 대회 &amp; 컵
        </h2>
        <span className="text-xs text-[var(--pm-muted)]">
          리베르타도레스 · 코파 두 브라질
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {campaigns.map((c) => (
          <CampaignCard key={c.competition.id} campaign={c} />
        ))}
      </div>
      <p className="text-xs text-[var(--pm-muted)]">
        ※ 대륙·컵 대회는 조별리그 순위표와 토너먼트 대진을 ESPN 무료 데이터로
        구성합니다. 컵 대회(코파 두 브라질)는 순위표가 없는 단판/홈&amp;어웨이
        토너먼트입니다.
      </p>
    </section>
  );
}

function CampaignCard({ campaign }: { campaign: CompetitionCampaign }) {
  const { competition: comp, group, currentRound, path } = campaign;
  return (
    <article className="pm-card flex flex-col gap-3 p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-[var(--pm-primary)]">{comp.nameKo}</h3>
          <p className="text-xs text-[var(--pm-muted)]">{comp.name}</p>
        </div>
        <span className="pm-chip shrink-0 bg-black/5 text-[var(--pm-muted)]">
          {KIND_LABEL[comp.kind] ?? comp.kind}
        </span>
      </header>

      {group ? <GroupTable group={group} /> : null}

      {path && path.length > 0 ? (
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-[var(--pm-muted)]">여정</h4>
          <ul className="space-y-1">
            {path.map((tie, i) => (
              <li key={i}>
                <PathRow tie={tie} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {currentRound ? <CurrentTie tie={currentRound} /> : null}

      {!group && !currentRound && (!path || path.length === 0) ? (
        <p className="text-sm italic text-[var(--pm-muted)]">
          현재 라운드 정보가 아직 제공되지 않습니다.
        </p>
      ) : null}
    </article>
  );
}

function GroupTable({ group }: { group: CampaignGroup }) {
  const advance = group.advanceCount ?? 0;
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-bold text-[var(--pm-muted)]">
        조별리그 · {group.nameKo} 최종 순위
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <caption className="sr-only">{group.nameKo} 조별리그 순위표</caption>
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-[var(--pm-muted)]">
              <th scope="col" className="py-1.5 pr-2">
                순위
              </th>
              <th scope="col" className="py-1.5 pr-2">
                팀
              </th>
              <th
                scope="col"
                className="px-1.5 py-1.5 text-center"
                title="경기"
              >
                경
              </th>
              <th scope="col" className="px-1.5 py-1.5 text-center" title="승">
                승
              </th>
              <th scope="col" className="px-1.5 py-1.5 text-center" title="무">
                무
              </th>
              <th scope="col" className="px-1.5 py-1.5 text-center" title="패">
                패
              </th>
              <th
                scope="col"
                className="px-1.5 py-1.5 text-center"
                title="득실차"
              >
                득실
              </th>
              <th
                scope="col"
                className="px-1.5 py-1.5 text-center font-bold"
                title="승점"
              >
                승점
              </th>
            </tr>
          </thead>
          <tbody>
            {group.table.map((row) => {
              const qualifies = advance > 0 && row.rank <= advance;
              return (
                <tr
                  key={row.teamId}
                  className={`border-b border-black/5 ${
                    row.isTracked
                      ? "bg-[var(--pm-primary)]/[0.08] font-semibold"
                      : ""
                  }`}
                >
                  <td className="py-1.5 pr-2">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs ${
                        qualifies
                          ? "bg-emerald-700 text-white"
                          : "bg-black/5 text-[var(--pm-ink)]"
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2">
                    <span className="flex items-center gap-1.5">
                      <Crest
                        src={row.crest}
                        alt={`${row.teamName} 엠블럼`}
                        label={row.teamName}
                        size={18}
                      />
                      <span className="truncate">{row.teamNameKo}</span>
                      {row.isTracked ? (
                        <span
                          className="text-[var(--pm-primary)]"
                          aria-hidden="true"
                        >
                          ●
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-1.5 py-1.5 text-center tabular-nums">
                    {row.played}
                  </td>
                  <td className="px-1.5 py-1.5 text-center tabular-nums">
                    {row.won}
                  </td>
                  <td className="px-1.5 py-1.5 text-center tabular-nums">
                    {row.drawn}
                  </td>
                  <td className="px-1.5 py-1.5 text-center tabular-nums">
                    {row.lost}
                  </td>
                  <td className="px-1.5 py-1.5 text-center tabular-nums">
                    {formatGoalDiff(row.goalDifference)}
                  </td>
                  <td className="px-1.5 py-1.5 text-center font-bold tabular-nums">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
        {advance > 0 ? (
          <span className="inline-flex items-center gap-1 text-[var(--pm-muted)]">
            <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-700 align-middle" />
            상위 {advance}팀 토너먼트 진출
          </span>
        ) : null}
        {group.qualifiedKo ? (
          <span className="font-semibold text-[var(--pm-primary)]">
            📍 {group.qualifiedKo}
          </span>
        ) : null}
      </p>
    </div>
  );
}

const RESULT_STYLE: Record<string, string> = {
  advanced: "bg-emerald-700 text-white",
  eliminated: "bg-rose-700 text-white",
  ongoing: "bg-black/5 text-[var(--pm-muted)]",
};
const RESULT_LABEL: Record<string, string> = {
  advanced: "진출",
  eliminated: "탈락",
  ongoing: "진행 중",
};

/** Compact one-line summary of a concluded knockout tie ("여정"). */
function PathRow({ tie }: { tie: CampaignTie }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="pm-chip shrink-0 bg-black/5 text-[var(--pm-muted)]">
        {tie.roundKo}
      </span>
      <Crest
        src={tie.opponentCrest}
        alt={`${tie.opponentName} 엠블럼`}
        label={tie.opponentName}
        size={18}
      />
      <span className="flex-1 truncate">{tie.opponentNameKo}</span>
      <span className="truncate text-xs text-[var(--pm-muted)]">
        {tie.outcomeKo}
      </span>
      <span
        className={`pm-chip shrink-0 ${RESULT_STYLE[tie.result] ?? RESULT_STYLE.ongoing}`}
      >
        {RESULT_LABEL[tie.result] ?? tie.result}
      </span>
    </div>
  );
}

/** The current/next knockout tie, with both legs' dates + home/away. */
function CurrentTie({ tie }: { tie: CampaignTie }) {
  return (
    <div className="rounded-xl border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/[0.06] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="pm-chip bg-[var(--pm-primary)] text-white">
          현재 · {tie.roundKo}
        </span>
        {tie.outcomeKo ? (
          <span className="text-xs font-semibold text-[var(--pm-primary)]">
            {tie.outcomeKo}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Crest
          src={tie.opponentCrest}
          alt={`${tie.opponentName} 엠블럼`}
          label={tie.opponentName}
          size={28}
        />
        <div className="min-w-0">
          <p className="truncate font-bold">vs {tie.opponentNameKo}</p>
          <p className="truncate text-xs text-[var(--pm-muted)]">
            {tie.opponentName}
          </p>
        </div>
      </div>
      <ul className="mt-2 space-y-1">
        {tie.legs.map((leg, i) => {
          const k = toKST(leg.kickoff);
          const played =
            leg.score && (leg.status === "finished" || leg.status === "live");
          const tracked = leg.trackedHome ? leg.score?.home : leg.score?.away;
          const opp = leg.trackedHome ? leg.score?.away : leg.score?.home;
          return (
            <li
              key={i}
              className="flex items-center gap-2 text-xs tabular-nums"
            >
              <span className="font-semibold text-[var(--pm-ink)]">
                {leg.legKo}
              </span>
              <span className="text-[var(--pm-muted)]">
                {k.date} ({k.weekday}) {k.time}
              </span>
              <span
                className={`pm-chip ${
                  leg.venue === "home"
                    ? "bg-[var(--pm-primary)]/15 text-[var(--pm-primary)]"
                    : "bg-black/5 text-[var(--pm-muted)]"
                }`}
              >
                {leg.venue === "home" ? "홈" : "원정"}
              </span>
              {played ? (
                <span className="font-bold">
                  {tracked}-{opp}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-[10px] text-[var(--pm-muted)]">
        시간은 한국 시간(KST) 기준
      </p>
    </div>
  );
}
