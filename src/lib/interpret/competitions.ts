// =============================================================================
// Competition context explainers. Korean beginners often don't know how the
// Brazilian calendar fits together (state championship vs national league vs
// cups vs the continental Libertadores). This module turns a competition id
// into a beginner-friendly Korean explanation. Editorial/seed content.
// =============================================================================

import type { CompetitionContext } from "@/lib/domain/types";

const CONTEXTS: Record<string, CompetitionContext> = {
  brasileirao: {
    id: "brasileirao",
    nameKo: "브라질 세리이 A (브라질레이렁)",
    taglineKo: "브라질 전국 1부 리그 — 한 시즌 가장 중요한 무대",
    explainerKo:
      "브라질 전국 20개 클럽이 겨루는 1부 리그입니다. 5월~12월에 홈&어웨이 38라운드로 진행되며, 승점이 가장 높은 팀이 우승합니다. 유럽처럼 강등(하위 4팀)이 있고, 상위권은 다음 시즌 리베르타도레스 출전권을 얻습니다. 한 해 농사의 핵심으로, 팬들이 가장 꾸준히 신경 쓰는 대회입니다.",
    stakesKo: "최우선 목표 · 꾸준함이 곧 명문의 증거",
  },
  libertadores: {
    id: "libertadores",
    nameKo: "코파 리베르타도레스",
    taglineKo: "남미판 챔피언스리그 — 대륙 최고를 가린다",
    explainerKo:
      "남미 각국 리그 상위 팀들이 모이는 대륙 최강자 결정전입니다. 유럽 챔피언스리그에 해당하며, 조별리그 → 토너먼트로 진행되고 결승은 단판 승부입니다. 브라질 팬에게는 '꿈의 무대'로, 우승 시 클럽 위상이 한 단계 올라갑니다. 파우메이라스는 이 대회 우승 경험이 많은 강호입니다.",
    stakesKo: "최고 영예 · 단판 결승의 긴장감",
  },
  "copa-do-brasil": {
    id: "copa-do-brasil",
    nameKo: "코파 두 브라질",
    taglineKo: "브라질 국내 컵대회 — 토너먼트 한 방 승부",
    explainerKo:
      "브라질 전역의 클럽이 참가하는 단판/홈&어웨이 토너먼트 컵대회입니다. (한국의 FA컵과 비슷) 하위 디비전 팀이 강호를 잡는 이변이 자주 나오고, 우승하면 다음 시즌 리베르타도레스 출전권과 큰 상금을 얻습니다. 리그와 병행되어 일정 부담이 큽니다.",
    stakesKo: "이변의 매력 · 리베르타도레스行 티켓",
  },
  paulista: {
    id: "paulista",
    nameKo: "캄페오나투 파울리스타 (상파울루 주 선수권)",
    taglineKo: "시즌 초반 상파울루 주 대회 — 워밍업이자 자존심 싸움",
    explainerKo:
      "브라질은 전국 리그 전, 연초(1~4월)에 각 주(州)별 선수권을 먼저 치릅니다. 파우메이라스가 속한 상파울루 주는 코린치안스·상파울루·산투스 등 강팀이 모여 수준이 가장 높습니다. 전국 대회 전 컨디션을 끌어올리는 무대이자, 지역 라이벌과의 자존심 대결입니다.",
    stakesKo: "시즌 출발점 · 지역 더비 무대",
  },
};

const FALLBACK: CompetitionContext = {
  id: "unknown",
  nameKo: "대회",
  taglineKo: "대회 정보",
  explainerKo:
    "이 대회에 대한 한국어 설명이 아직 준비되지 않았습니다. 추후 업데이트될 예정입니다.",
  stakesKo: "정보 준비 중",
};

export function competitionContext(id: string): CompetitionContext {
  return CONTEXTS[id] ?? { ...FALLBACK, id };
}

export function allCompetitionContexts(): CompetitionContext[] {
  return Object.values(CONTEXTS);
}
