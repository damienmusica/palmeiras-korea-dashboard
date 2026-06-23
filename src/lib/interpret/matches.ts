// =============================================================================
// Match interpretation. Produces "why this match matters", Korean viewing
// points, and (for finished games) a result reading. Combines:
//   1. hand-authored editorial overrides keyed by match id (richest), and
//   2. a rule-based generator using rivalry + competition + venue + result.
// Never invents precise factual claims; stays at the level of context/framing.
// =============================================================================

import type { Match, MatchInsight, TeamConfig } from "@/lib/domain/types";
import { resultForTeam } from "@/lib/format/stats";
import { competitionContext } from "@/lib/interpret/competitions";

/** Editorial overrides for specific seed fixtures (most context-rich). */
const EDITORIAL: Record<string, Partial<MatchInsight>> = {
  "m-2026-06-25": {
    whyItMattersKo:
      "최대 라이벌 코린치안스와의 '데르비 파울리스타'. 상파울루를 양분하는 두 클럽의 자존심 대결로, 승점 이상의 의미가 있는 시즌 최대 빅매치입니다. 선두 다툼 중이라 결과가 순위에도 직접 영향을 줍니다.",
    watchPointsKo: [
      "에스테벙(메시뉴)의 드리블 vs 코린치안스 수비 — 더비 무대에서의 영건",
      "홈 알리안츠 파르키의 압도적 응원 분위기 (만석 매진)",
      "선두 수성을 위한 아벨 페레이라 감독의 용병술",
    ],
    rivalryKo: "데르비 파울리스타 (vs 코린치안스)",
  },
  "m-2026-06-19": {
    resultReadingKo:
      "원정에서 볼리바르를 3-1로 잡은 값진 승리. 고지대 원정은 브라질 팀에 늘 까다로운데, 비토르 호키·베이가가 해결사 역할을 했습니다. 리베르타도레스 16강을 향해 유리한 고지를 점한 결과입니다.",
  },
  "m-2026-06-15": {
    resultReadingKo:
      "인테르나시오나우를 홈에서 2-0으로 완파하며 단독 선두 등극. 에스테벙과 플라코 로페스의 득점 조합이 살아난 점이 고무적입니다. '무실점 승리'는 수비 안정감까지 보여준 이상적인 결과입니다.",
  },
};

/** Detect a rivalry between the tracked team and an opponent (by name). */
function detectRivalry(team: TeamConfig, oppName: string, oppNameKo: string) {
  return team.rivals.find(
    (r) =>
      r.name.toLowerCase() === oppName.toLowerCase() || r.nameKo === oppNameKo,
  );
}

function opponentOf(match: Match, teamId: string) {
  return match.home.id === teamId ? match.away : match.home;
}

export function matchInsight(match: Match, team: TeamConfig): MatchInsight {
  const opp = opponentOf(match, team.id);
  const rivalry = detectRivalry(team, opp.name, opp.nameKo);
  const comp = competitionContext(match.competition.id);
  const venueKo =
    match.venue === "home"
      ? "홈"
      : match.venue === "away"
        ? "원정"
        : "중립경기";
  const editorial = EDITORIAL[match.id];

  // --- why it matters ---
  let whyItMattersKo: string;
  if (editorial?.whyItMattersKo) {
    whyItMattersKo = editorial.whyItMattersKo;
  } else if (rivalry) {
    whyItMattersKo = `${rivalry.nameKo}와의 라이벌전${
      rivalry.derbyKo ? ` '${rivalry.derbyKo}'` : ""
    }입니다. ${rivalry.context}`;
  } else {
    whyItMattersKo = `${comp.nameKo} 경기입니다. ${comp.stakesKo}. ${venueKo}에서 치러지는 만큼 ${
      match.venue === "home" ? "홈 이점을 살려" : "원정에서 승점을 챙기는 것이"
    } 중요합니다.`;
  }

  // --- watch points ---
  let watchPointsKo: string[];
  if (editorial?.watchPointsKo) {
    watchPointsKo = editorial.watchPointsKo;
  } else {
    watchPointsKo = [
      rivalry
        ? "라이벌전 특유의 거친 몸싸움과 뜨거운 분위기"
        : `${match.competition.shortName} 흐름 속 파우메이라스의 경기 운영`,
      match.venue === "home"
        ? "홈 관중을 등에 업은 초반 강한 압박"
        : "원정에서의 수비 안정과 역습 타이밍",
      "에스테벙·플라코 로페스 등 공격진의 골 결정력",
    ];
  }

  // --- result reading (finished only) ---
  let resultReadingKo: string | undefined;
  if (match.status === "finished" && match.score) {
    if (editorial?.resultReadingKo) {
      resultReadingKo = editorial.resultReadingKo;
    } else {
      const r = resultForTeam(match, team.id);
      const scoreline = `${match.score.home}-${match.score.away}`;
      if (r === "W") {
        resultReadingKo = `${scoreline} 승리. ${
          rivalry
            ? "라이벌을 꺾은 값진 승점 3점입니다."
            : "기대대로 승점 3점을 챙긴 좋은 결과입니다."
        }`;
      } else if (r === "L") {
        resultReadingKo = `${scoreline} 패배. ${
          rivalry
            ? "라이벌전 패배는 아프지만, 시즌은 길게 봐야 합니다."
            : "아쉬운 결과지만 다음 경기에서 만회할 기회가 있습니다."
        }`;
      } else {
        resultReadingKo = `${scoreline} 무승부. 승점 1점을 나눠 가졌습니다. ${
          match.venue === "away"
            ? "원정 무승부는 나쁘지 않은 결과입니다."
            : "홈에서는 다소 아쉬운 결과입니다."
        }`;
      }
    }
  }

  return {
    whyItMattersKo,
    watchPointsKo,
    resultReadingKo,
    rivalryKo:
      editorial?.rivalryKo ??
      (rivalry ? (rivalry.derbyKo ?? rivalry.nameKo) : undefined),
    source: editorial ? "editorial" : "rule",
  };
}
