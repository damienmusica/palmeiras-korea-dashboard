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
      "비토르 호키·플라코 로페스 등 공격진의 더비 무대 결정력",
      "홈 알리안츠 파르키의 압도적 응원 분위기 (만석 매진)",
      "선두 수성을 위한 아벨 페헤이라 감독의 용병술",
    ],
    rivalryKo: "데르비 파울리스타 (vs 코린치안스)",
  },
  "m-2026-06-19": {
    resultReadingKo:
      "원정에서 볼리바르를 3-1로 잡은 값진 승리. 고지대 원정은 브라질 팀에 늘 까다로운데, 비토르 호키·베이가가 해결사 역할을 했습니다. 리베르타도레스 16강을 향해 유리한 고지를 점한 결과입니다.",
  },
  "m-2026-06-15": {
    resultReadingKo:
      "인테르나시오나우를 홈에서 2-0으로 완파하며 단독 선두 등극. 플라코 로페스를 앞세운 공격진이 살아난 점이 고무적입니다. '무실점 승리'는 수비 안정감까지 보여준 이상적인 결과입니다.",
  },
};

/**
 * Normalize a club name for matching: strip accents/case/punctuation and a
 * trailing club-type suffix (FC/EC/SC/CF/AC). So the rival "São Paulo FC" still
 * matches ESPN's "São Paulo", and "Santos FC" matches "Santos" — otherwise two
 * of the three derbies would silently fall through to generic watch points.
 */
function normName(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "")
    .replace(/(fc|ec|sc|cf|ac)$/g, "");
}

/** Detect a rivalry between the tracked team and an opponent (by name). The
 *  Latin name is the reliable key (always present from the feed); the Korean
 *  name is a fallback. Empty normalized strings never match, so a name that
 *  reduces to "" can't collide with the first rival. */
function detectRivalry(team: TeamConfig, oppName: string, oppNameKo: string) {
  const on = normName(oppName);
  const onKo = normName(oppNameKo);
  return team.rivals.find((r) => {
    const rn = normName(r.name);
    const rnKo = normName(r.nameKo);
    return (rn !== "" && rn === on) || (rnKo !== "" && rnKo === onKo);
  });
}

function opponentOf(match: Match, teamId: string) {
  return match.home.id === teamId ? match.away : match.home;
}

// --- Fixture-gap explainer ---------------------------------------------------
// A newcomer sees a 7-week hole between fixtures (e.g. the 2026 World Cup break)
// and wonders if the data is broken. Annotate abnormally long gaps with a
// deterministic, honest explanation of *why such gaps happen* — without
// asserting a specific cause we can't verify from the data.
const GAP_NOTABLE_DAYS = 18; // beyond a normal league/cup cadence (~3-7 days)
const GAP_MAJOR_DAYS = 35; // a major-tournament-sized break

/**
 * Korean explainer for the gap between two consecutive kickoffs, or null when
 * the gap is normal. `days` lets the UI also show the gap length.
 */
export function fixtureGapKo(
  prevIso: string,
  nextIso: string,
): { days: number; labelKo: string } | null {
  const a = new Date(prevIso).getTime();
  const b = new Date(nextIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const days = Math.round((b - a) / 86_400_000);
  if (days < GAP_NOTABLE_DAYS) return null;
  const labelKo =
    days >= GAP_MAJOR_DAYS
      ? `약 ${days}일간 경기가 없습니다 — 월드컵 등 메이저 국제 대회 기간에는 브라질 리그가 장기간 중단됩니다.`
      : `약 ${days}일 일정 공백 — 보통 대표팀 A매치 기간이나 대회 일정 조정으로 생깁니다.`;
  return { days, labelKo };
}

// --- Opponent-specific watch-point rule engine -------------------------------
// Deterministic, no fabricated stats — derby-aware framing keyed on the actual
// opponent + competition + venue, so a fan gets context tailored to *this* match
// instead of a generic 3-liner. Keyed by the rival's canonical name.
const DERBY_WATCH: Record<string, string[]> = {
  Corinthians: [
    "상파울루를 양분하는 최대 더비 '데르비 파울리스타' — 순위와 무관하게 한 판 승부, 이변이 잦습니다.",
    "양 팀 조직 응원단(만샤 베르지 vs 가비옹이스)이 만드는 폭발적 분위기와 거친 신경전.",
    "감정이 격해지며 경고·퇴장이 쏟아지기 쉬운 경기 — 11명을 끝까지 유지하는 자제력이 승부처.",
  ],
  "São Paulo FC": [
    "'쇼키-헤이(왕들의 충돌)' — 풍부한 우승 역사를 가진 두 명문의 자존심 대결.",
    "중원 주도권 싸움이 핵심 — 빌드업을 누가 지배하느냐가 흐름을 가릅니다.",
    "트리콜로르(상파울루) 특유의 끈끈한 수비를 어떻게 허무느냐가 관건.",
  ],
  "Santos FC": [
    "펠레의 산투스와의 전통 클라시쿠 '클라시쿠 다 사우다지(그리움의 더비)' — 향수와 자존심이 걸린 한 판.",
    "두 팀의 공격적인 성향상 골이 오가는 열린 경기가 되기 쉽습니다.",
    "역사적 무게가 큰 경기인 만큼 경기 외적 동기부여가 변수.",
  ],
};

// Notable Brazilian clubs → a "빅매치" framing for non-derby league games.
const BIG_CLUBS = new Set(
  [
    "Flamengo",
    "Botafogo",
    "Fluminense",
    "Vasco da Gama",
    "Cruzeiro",
    "Atlético Mineiro",
    "Atlético-MG",
    "Internacional",
    "Grêmio",
    "Bahia",
    "RB Bragantino",
    "Red Bull Bragantino",
  ].map((n) => n.toLowerCase()),
);

/**
 * Build opponent-aware watch points. Order of specificity: derby → competition
 * kind (continental/cup/league) → big-match framing → venue → a Palmeiras
 * team-level point. Returns 3-4 lines; never names specific players (avoids any
 * stale/transfer fabrication — that stays in per-match editorial overrides).
 */
function ruleWatchPoints(
  match: Match,
  rivalry: ReturnType<typeof detectRivalry>,
  oppNameKo: string,
  oppName: string,
): string[] {
  if (rivalry && DERBY_WATCH[rivalry.name]) {
    const pts = [...DERBY_WATCH[rivalry.name]];
    pts.push(
      match.venue === "home"
        ? "홈에서 열리는 더비인 만큼 관중을 등에 업은 초반 기선 제압이 중요합니다."
        : "적지에서 열리는 더비 — 상대 응원에 흔들리지 않는 침착함이 필요합니다.",
    );
    return pts;
  }

  const kind = match.competition.kind;
  const pts: string[] = [];

  if (kind === "continental") {
    pts.push(
      `${match.competition.shortName} 토너먼트 — 남미 무대 특유의 거친 분위기와 심판 변수에 대한 대응.`,
    );
    pts.push(
      match.venue === "away"
        ? `원정 1·2차전 합산을 염두에 둔 실점 관리 — ${oppNameKo}의 홈 압박을 버텨내는 것이 관건.`
        : "홈에서 잡아야 할 승부 — 원정 다득점/실점을 의식한 결과 관리.",
    );
  } else if (kind === "cup") {
    pts.push(
      `${match.competition.shortName} — 토너먼트 승부인 만큼 단 한 번의 실수가 탈락으로 이어집니다.`,
    );
    pts.push(
      "로테이션과 베스트 멤버 사이, 아벨 페헤이라 감독의 우선순위 선택.",
    );
  } else {
    // League
    pts.push(
      `${oppNameKo} 상대의 리그 승점 관리 — 선두권 경쟁에서 놓칠 수 없는 경기.`,
    );
    if (BIG_CLUBS.has(oppName.toLowerCase())) {
      pts.push(
        `브라질 명문 ${oppNameKo}와의 빅매치 — 우승 경쟁 구도에 직접 영향을 주는 6점짜리 승부.`,
      );
    }
  }

  pts.push(
    match.venue === "home"
      ? "홈 관중을 등에 업은 초반 강한 압박과 측면 공략."
      : `원정 ${oppNameKo}전에서의 수비 안정과 역습 타이밍.`,
  );
  pts.push("파우메이라스 공격진의 골 결정력과 세트피스 상황.");

  // Keep it tight: at most 4 lines.
  return pts.slice(0, 4);
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

  // --- watch points (opponent-aware rule engine; editorial wins) ---
  const watchPointsKo = editorial?.watchPointsKo
    ? editorial.watchPointsKo
    : ruleWatchPoints(match, rivalry, opp.nameKo, opp.name);

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
