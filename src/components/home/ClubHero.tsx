import { Crest } from "@/components/ui/Crest";
import type { TeamConfig } from "@/lib/domain/types";

/** Club identity header: crest, colors, nickname, one-line identity. */
export function ClubHero({ team }: { team: TeamConfig }) {
  return (
    <section className="pm-card flex items-center gap-4 p-5">
      <Crest
        src={team.crest}
        alt={`${team.name} 엠블럼`}
        label={team.shortName}
        size={72}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">
            파우메이라스
          </h1>
          <span className="pm-chip bg-[var(--pm-primary)] text-white">
            {team.nicknameKo}
          </span>
        </div>
        <p className="text-sm text-[var(--pm-muted)]">
          {team.name} · {team.founded} 창단 ·{" "}
          {team.stadium.commonName ?? team.stadium.name}
        </p>
        <p className="mt-2 text-sm leading-relaxed">{team.identity}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {team.competitions.map((c) => (
            <span
              key={c.id}
              className="pm-chip bg-black/5 text-[var(--pm-muted)]"
            >
              {c.shortName}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
