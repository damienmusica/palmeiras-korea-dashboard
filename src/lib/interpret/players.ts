// =============================================================================
// Player interpretation. Hand-authored Korean fan context per key player, with
// a position-based fallback so every player still gets a beginner-friendly
// reading. All content is editorial/seed — framed as context, not as precise
// factual claims, and labeled accordingly in the UI.
// =============================================================================

import type { Player, PlayerInsight } from "@/lib/domain/types";

const EDITORIAL: Record<string, Omit<PlayerInsight, "source">> = {
  weverton: {
    roleKo: "주전 골키퍼이자 팀 주장",
    styleKo:
      "안정적인 선방과 침착한 빌드업, 그리고 라인을 조율하는 리더십이 강점입니다.",
    whyCareKo:
      "오랜 기간 골문을 지킨 베테랑으로, 2016 리우 올림픽 금메달 멤버이기도 합니다. 팀의 정신적 기둥입니다.",
    narrativeKo: "경험에서 우러나는 안정감으로 수비진 전체를 안정시키는 존재.",
    nameNoteKo:
      "‘웨베르통’이 아니라 ‘베베르통’에 가깝게 발음합니다 (Weverton).",
  },
  "gustavo-gomez": {
    roleKo: "수비의 핵심 센터백",
    styleKo:
      "강한 대인 방어와 제공권, 그리고 세트피스 상황의 헤더 득점력까지 갖춘 수비수입니다.",
    whyCareKo:
      "파라과이 국가대표 주장 출신으로, 수비 리더이자 가끔 결정적인 골까지 넣는 든든한 기둥입니다.",
    narrativeKo: "‘몬스터’라 불릴 만큼 끈질긴 수비. 빅매치에서 더 강합니다.",
    archetypeKo: "투지와 리더십을 겸비한 정통 중앙 수비수 유형.",
  },
  piquerez: {
    roleKo: "공격적인 왼쪽 풀백",
    styleKo:
      "폭발적인 오버래핑과 정확한 크로스, 왕성한 활동량으로 측면을 지배합니다.",
    whyCareKo:
      "우루과이 국가대표 풀백으로, 수비뿐 아니라 공격 작업에서도 큰 비중을 차지합니다.",
    archetypeKo:
      "현대 축구의 ‘윙백형’ 풀백 — 공수 양면에서 측면 전체를 책임지는 유형.",
  },
  "richard-rios": {
    roleKo: "중원의 엔진, 박스 투 박스 미드필더",
    styleKo:
      "탈압박과 드리블로 전진하고, 수비와 공격을 모두 오가는 활동량이 인상적입니다.",
    whyCareKo:
      "콜롬비아 국가대표로 성장한 미드필더. 풋살 출신다운 발재간으로 압박을 풀어내는 능력이 돋보입니다.",
    narrativeKo: "유럽 빅클럽들이 주목하는 떠오르는 중원 자원.",
  },
  "raphael-veiga": {
    roleKo: "팀의 두뇌, 공격형 미드필더(플레이메이커)",
    styleKo:
      "왼발 킥과 시야로 찬스를 만들고, 페널티킥·프리킥 등 세트피스를 책임집니다.",
    whyCareKo:
      "리베르타도레스 결승 득점 등 ‘큰 경기에 강한 남자’. 팀의 정신적 지주이자 해결사입니다.",
    narrativeKo: "베테랑이 된 지금도 중요한 순간엔 베이가를 찾게 됩니다.",
    nameNoteKo: "‘라파엘 베이가’ — Veiga는 ‘베이가’로 읽습니다.",
  },
  mauricio: {
    roleKo: "2선 침투형 공격형 미드필더",
    styleKo:
      "박스 안으로 침투해 득점에 가담하는 능력과 부지런한 움직임이 강점입니다.",
    whyCareKo:
      "꾸준히 성장 중인 영건으로, 득점과 도움을 고루 기록하는 멀티 자원입니다.",
  },
  estevao: {
    roleKo: "팀의 미래, 오른쪽 윙어",
    styleKo:
      "왼발 드리블로 안쪽으로 파고드는 ‘인사이드 포워드’. 가속과 결정력이 또래 최고 수준입니다.",
    whyCareKo:
      "‘메시뉴(작은 메시)’라 불리는 세계적 유망주입니다. 브라질 국가대표에도 발탁됐고, 이미 유럽 빅클럽 이적이 예정될 만큼 주목받는 재능입니다.",
    narrativeKo: "지금 파우메이라스를 봐야 하는 가장 큰 이유 중 하나.",
    archetypeKo:
      "왼발잡이 인사이드 윙어 — ‘안쪽으로 접고 슈팅’하는 현대 윙어 유형.",
    nameNoteKo:
      "‘에스테벙’ (Estêvão) — 끝의 ‘-ão’은 콧소리 ‘-엉/-앙’에 가깝습니다.",
  },
  "flaco-lopez": {
    roleKo: "최전방 중앙 공격수(타깃맨)",
    styleKo:
      "큰 키를 활용한 제공권과 박스 안 위치 선정으로 득점을 만들어냅니다.",
    whyCareKo:
      "아르헨티나 출신 스트라이커로 팀 내 최다 득점을 다투는 해결사입니다. 별명 ‘플라코(마른)’와 달리 몸싸움도 강합니다.",
    archetypeKo: "정통 9번 — 골문 앞에서 득점에 집중하는 센터포워드.",
    nameNoteKo:
      "‘플라코 로페스’ — Flaco는 스페인어로 ‘마른’이라는 뜻의 애칭입니다.",
  },
  "vitor-roque": {
    roleKo: "폭발력 있는 영건 스트라이커",
    styleKo: "빠른 스피드와 저돌적인 침투, 양발 마무리로 골문을 노립니다.",
    whyCareKo:
      "‘티그리뉴(작은 호랑이)’라 불리는 유망주로, 바르셀로나를 거쳐 브라질로 돌아와 부활을 노립니다.",
    narrativeKo: "유럽에서의 아쉬움을 딛고 다시 떠오르는 스토리.",
    nameNoteKo:
      "‘비토르 호키’ — Roque의 R은 브라질식으로 ‘ㅎ’에 가깝게 발음합니다.",
  },
  "felipe-anderson": {
    roleKo: "경험 많은 윙어/2선 공격수",
    styleKo:
      "측면 돌파와 연계, 그리고 풍부한 유럽 경험에서 나오는 영리한 움직임이 특징입니다.",
    whyCareKo:
      "라치오 등 유럽 무대를 누빈 베테랑으로, 큰 무대 경험을 팀에 더해줍니다.",
  },
};

const POSITION_FALLBACK: Record<
  Player["positionGroup"],
  Omit<PlayerInsight, "source">
> = {
  GK: {
    roleKo: "골키퍼",
    styleKo: "골문을 지키며 수비 라인을 조율하는 역할입니다.",
    whyCareKo: "안정적인 선방은 승점으로 직결됩니다.",
  },
  DF: {
    roleKo: "수비수",
    styleKo: "상대 공격을 차단하고 후방에서 빌드업을 돕습니다.",
    whyCareKo: "탄탄한 수비는 강팀의 기본기입니다.",
  },
  MF: {
    roleKo: "미드필더",
    styleKo: "공수를 연결하며 경기 템포를 조절합니다.",
    whyCareKo: "중원 장악은 경기 흐름을 좌우합니다.",
  },
  FW: {
    roleKo: "공격수",
    styleKo: "득점과 찬스 메이킹으로 공격을 이끕니다.",
    whyCareKo: "골은 결국 경기의 승패를 가릅니다.",
  },
};

export function playerInsight(player: Player): PlayerInsight {
  const editorial = EDITORIAL[player.id];
  if (editorial) {
    return { ...editorial, source: "editorial" };
  }
  return { ...POSITION_FALLBACK[player.positionGroup], source: "seed" };
}

export function hasEditorialInsight(playerId: string): boolean {
  return playerId in EDITORIAL;
}
