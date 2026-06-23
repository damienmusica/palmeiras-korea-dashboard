import type { Metadata } from "next";
import { getActiveTeam } from "@/lib/teams";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlossaryView } from "@/components/guide/GlossaryView";
import { CompetitionPrimer } from "@/components/fixtures/CompetitionPrimer";

export const metadata: Metadata = {
  title: "팬 가이드",
  description:
    "파우메이라스를 처음 보는 한국 팬을 위한 시작 가이드 — 정체성, 라이벌(코린치안스 더비), 브라질 축구 대회 구조, 용어집, 이름 발음, 공식 링크.",
};

export default function GuidePage() {
  const team = getActiveTeam();

  return (
    <div className="space-y-8">
      <SectionHeading
        title="팬 가이드"
        subtitle="파우메이라스를 한국어로 이해하는 가장 빠른 방법"
      />

      {/* 1. Starter guide */}
      <section aria-labelledby="starter-heading" className="space-y-3">
        <h2 id="starter-heading" className="text-lg font-extrabold">
          🌱 처음 보는 팬을 위한 시작 가이드
        </h2>
        <ol className="space-y-2">
          {team.starterGuide.map((step, i) => (
            <li key={i} className="pm-card flex gap-3 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--pm-primary)] text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 2. Identity */}
      <section aria-labelledby="identity-heading" className="space-y-3">
        <h2 id="identity-heading" className="text-lg font-extrabold">
          🟢 클럽 정체성: 색·애칭·문화
        </h2>
        <div className="pm-card space-y-2 p-4 text-sm leading-relaxed">
          <p>{team.identity}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="pm-chip bg-[var(--pm-primary)] text-white">
              상징색 녹색·흰색
            </span>
            <span className="pm-chip bg-black/5">애칭 {team.nicknameKo}</span>
            <span className="pm-chip bg-black/5">{team.founded} 창단</span>
          </div>
        </div>
      </section>

      {/* 3. Stadium */}
      <section aria-labelledby="stadium-heading" className="space-y-3">
        <h2 id="stadium-heading" className="text-lg font-extrabold">
          🏟️ 홈구장
        </h2>
        <div className="pm-card space-y-1 p-4">
          <p className="font-bold">
            {team.stadium.nameKo}{" "}
            <span className="text-sm font-normal text-[var(--pm-muted)]">
              {team.stadium.name}
            </span>
          </p>
          <p className="text-xs text-[var(--pm-muted)]">
            {team.stadium.city} · 수용 {team.stadium.capacity.toLocaleString()}
            석 · {team.stadium.opened} 개장
          </p>
          <p className="pt-1 text-sm leading-relaxed">{team.stadium.note}</p>
        </div>
      </section>

      {/* 4. Rivalries */}
      <section aria-labelledby="rivals-heading" className="space-y-3">
        <h2 id="rivals-heading" className="text-lg font-extrabold">
          🔥 라이벌과 더비
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {team.rivals.map((r) => (
            <div key={r.name} className="pm-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">vs {r.nameKo}</h3>
                {r.derbyKo ? (
                  <span className="pm-chip bg-rose-100 text-rose-700">
                    {r.derbyKo}
                  </span>
                ) : null}
                <span className="text-xs text-[var(--pm-muted)]">
                  {r.name}
                  {r.derby ? ` · ${r.derby}` : ""}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed">{r.context}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Competition hierarchy */}
      <section aria-labelledby="comp-heading" className="space-y-3">
        <h2 id="comp-heading" className="text-lg font-extrabold">
          🗂️ 브라질 축구 달력과 대회 구조
        </h2>
        <p className="text-sm text-[var(--pm-muted)]">
          브라질은 연초 주(州)선수권 → 전국 리그(브라질레이렁) + 컵대회(코파 두
          브라질) + 대륙대회(리베르타도레스)가 한 해에 동시에 돌아갑니다.
          아래에서 각 대회의 의미를 확인하세요.
        </p>
        <CompetitionPrimer />
      </section>

      {/* 6. Glossary */}
      <section aria-labelledby="glossary-heading" className="space-y-3">
        <h2 id="glossary-heading" className="text-lg font-extrabold">
          📖 브라질 축구 용어집 (한국어 풀이)
        </h2>
        <GlossaryView entries={team.glossary} />
      </section>

      {/* 7. Name & pronunciation notes */}
      <section aria-labelledby="names-heading" className="space-y-3">
        <h2 id="names-heading" className="text-lg font-extrabold">
          🗣️ 이름·발음 메모
        </h2>
        <ul className="space-y-2">
          {team.nameNotes.map((n, i) => (
            <li key={i} className="pm-card p-3 text-sm leading-relaxed">
              {n}
            </li>
          ))}
        </ul>
      </section>

      {/* 8. Official links */}
      <section aria-labelledby="links-heading" className="space-y-3">
        <h2 id="links-heading" className="text-lg font-extrabold">
          🔗 공식 링크 · 추천 외부 소스
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {team.officialLinks.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pm-card flex items-center justify-between p-3 font-semibold transition-transform hover:-translate-y-0.5"
            >
              <span>
                {l.labelKo}{" "}
                <span className="text-xs font-normal text-[var(--pm-muted)]">
                  {l.label}
                </span>
              </span>
              <span className="text-[var(--pm-primary)]" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
        <p className="text-xs text-[var(--pm-muted)]">
          이 앱은 라이브 스코어·이적 정보의 정확도에서 Sofascore, FotMob,
          Flashscore, Transfermarkt, 공식 앱을 대체하지 않습니다. 그 위에서 한국
          팬을 위한 <b>번역·큐레이션·해설</b> 역할을 합니다. 정밀한 실시간
          데이터는 위 공식·전문 소스를 함께 활용하세요.
        </p>
      </section>
    </div>
  );
}
