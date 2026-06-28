import type { LegendEntry } from "@/lib/domain/types";

function LegendCard({ legend }: { legend: LegendEntry }) {
  return (
    <div className="pm-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h4 className="font-bold">{legend.nameKo}</h4>
        <span className="text-xs text-[var(--pm-muted)]">{legend.name}</span>
        {legend.nicknameKo ? (
          <span className="pm-chip bg-[var(--pm-primary)]/10 text-[var(--pm-primary-text)]">
            {legend.nicknameKo}
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--pm-muted)]">
        <span className="pm-chip bg-black/5">{legend.positionKo}</span>
        <span className="tabular-nums">{legend.era}</span>
        {legend.movedToKo ? (
          <span className="pm-chip bg-amber-50 text-amber-700">
            → {legend.movedToKo}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed">{legend.whyKo}</p>
    </div>
  );
}

/** Club legends + recent notable departures, grouped for a newcomer. */
export function LegendsView({ legends }: { legends: LegendEntry[] }) {
  const icons = legends.filter((l) => l.group === "icon");
  const recent = legends.filter((l) => l.group === "recent");

  return (
    <div className="space-y-4">
      {icons.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[var(--pm-muted)]">
            🏛️ 역대 레전드 (꼭 알아야 할 클럽 아이콘)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {icons.map((l) => (
              <LegendCard key={l.name} legend={l} />
            ))}
          </div>
        </div>
      ) : null}

      {recent.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-[var(--pm-muted)]">
            ✈️ 최근 떠난 주역 (좋은 사이로 더 큰 무대로)
          </h3>
          <p className="text-xs text-[var(--pm-muted)]">
            지금 스쿼드엔 없지만, 최근까지 팀의 중심이었던 선수들입니다. 옛 경기
            영상이나 뉴스에서 이름을 보면 누구인지 알 수 있도록 정리했습니다.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recent.map((l) => (
              <LegendCard key={l.name} legend={l} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
