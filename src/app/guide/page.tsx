import type { Metadata } from "next";
import { getActiveTeam } from "@/lib/teams";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlossaryView } from "@/components/guide/GlossaryView";
import { LegendsView } from "@/components/guide/LegendsView";
import { HistoryTimeline, HonoursList } from "@/components/guide/HistoryView";
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

      {/* 2.5 Club history timeline */}
      {team.history && team.history.length > 0 ? (
        <section aria-labelledby="history-heading" className="space-y-3">
          <h2 id="history-heading" className="text-lg font-extrabold">
            📜 클럽의 역사 (한눈에 보는 110년)
          </h2>
          <p className="text-sm text-[var(--pm-muted)]">
            창단부터 오늘까지, 파우메이라스를 이해하는 데 꼭 필요한 결정적
            순간들입니다.
          </p>
          <HistoryTimeline history={team.history} />
        </section>
      ) : null}

      {/* 2.6 Detailed honours */}
      {team.honours && team.honours.length > 0 ? (
        <section aria-labelledby="honours-heading" className="space-y-3">
          <h2 id="honours-heading" className="text-lg font-extrabold">
            🏆 우승 연혁 (연도별)
          </h2>
          <p className="text-sm text-[var(--pm-muted)]">
            파우메이라스가 ‘남미를 대표하는 빅클럽’으로 불리는 이유 — 주요 공식
            타이틀을 연도와 함께 정리했습니다.
          </p>
          <HonoursList honours={team.honours} />
        </section>
      ) : null}

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

      {/* 4.5 Legends & history */}
      {team.legends && team.legends.length > 0 ? (
        <section aria-labelledby="legends-heading" className="space-y-3">
          <h2 id="legends-heading" className="text-lg font-extrabold">
            🏅 레전드 & 명예의 전당
          </h2>
          <p className="text-sm text-[var(--pm-muted)]">
            파우메이라스의 역사를 만든 인물들. 한 클럽을 이해하려면 지금의
            스쿼드만큼 ‘누가 이 팀을 위대하게 만들었는가’도 알아야 합니다.
          </p>
          <LegendsView legends={team.legends} />
        </section>
      ) : null}

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

      {/* 7.5 How to follow from Korea */}
      <section aria-labelledby="watch-heading" className="space-y-3">
        <h2 id="watch-heading" className="text-lg font-extrabold">
          🇰🇷 한국에서 따라가는 법
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="pm-card space-y-1 p-4">
            <h3 className="font-bold">⏰ 경기 시간 (한국 기준)</h3>
            <p className="text-sm leading-relaxed">
              브라질 경기는 현지 저녁에 열려 한국에선 보통{" "}
              <b>주중 아침~오전, 주말 새벽~아침</b>입니다. 리베르타도레스는 한국
              시간 이른 아침인 경우가 많아요. 이 앱의 일정·결과는 모두{" "}
              <b>한국 시간(KST)과 브라질 시간을 함께</b> 표시합니다.
            </p>
          </div>
          <div className="pm-card space-y-1 p-4">
            <h3 className="font-bold">📺 중계는 어디서?</h3>
            <p className="text-sm leading-relaxed">
              브라질 리그·컵의 한국 정식 중계는 제한적입니다. 가장 현실적인
              방법은 <b>공식 유튜브(TV Palmeiras)의 하이라이트</b>와 클럽 SNS,
              그리고 <b>본 대시보드로 일정·결과·뉴스</b>를 챙기는 것입니다.
              (확실하지 않은 비공식 스트림은 권장하지 않습니다.)
            </p>
          </div>
          <div className="pm-card space-y-1 p-4">
            <h3 className="font-bold">🔁 매일 1분 루틴</h3>
            <p className="text-sm leading-relaxed">
              아침에 홈의 <b>‘오늘의 5분 브리핑’</b> → 다음 경기·지난 결과 확인
              → 뉴스 탭에서 <b>‘왜 중요한가’</b>만 훑어도 흐름을 놓치지
              않습니다.
            </p>
          </div>
          <div className="pm-card space-y-1 p-4">
            <h3 className="font-bold">🧭 더 깊이 보고 싶다면</h3>
            <p className="text-sm leading-relaxed">
              실시간 스코어·상세 기록은 Sofascore·FotMob, 브라질 현지 소식은{" "}
              <b>ge.globo</b>, 대륙대회는 <b>CONMEBOL</b> 공식을 함께 보세요. 이
              앱은 그 위에서 <b>한국어 해설·맥락</b>을 더하는 역할입니다.
            </p>
          </div>
        </div>
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
