// =============================================================================
// Palmeiras legends & notable recent departures — curated club history.
//
// Departed players who shaped the club are kept here as HISTORY, not deleted: a
// newcomer should know who Endrick, Estêvão, Weverton or Richard Ríos are, and
// the all-time icons (Ademir da Guia, Marcos, the Parmalat-era stars). Every
// fact below was researched and cross-checked from multiple sources during the
// build phase (per the "deterministic / research fixed facts" principle) — no
// fabrication. Korean names follow the project's Brazilian-PT orthography.
// =============================================================================

import type { LegendEntry } from "@/lib/domain/types";

export const PALMEIRAS_LEGENDS: LegendEntry[] = [
  // --- All-time icons --------------------------------------------------------
  {
    name: "Ademir da Guia",
    nameKo: "아데미르 다 기아",
    nicknameKo: "오 디비누 (신성)",
    era: "1961–1977",
    positionKo: "공격형 미드필더",
    group: "icon",
    whyKo:
      "거의 모든 팬이 꼽는 클럽 역사상 최고의 아이콘. 900경기 이상을 뛴 최다 출전 선수로, 1960~70년대 전설적인 ‘아카데미아(Academia)’ 황금기를 지휘했습니다. 우아한 경기 운영으로 ‘신성’이라 불렸습니다.",
  },
  {
    name: "Marcos",
    nameKo: "마르코스",
    nicknameKo: "상 마르코스 (성 마르코스)",
    era: "1992–2012",
    positionKo: "골키퍼",
    group: "icon",
    whyKo:
      "데뷔부터 은퇴까지 파우메이라스만 지킨 원클럽맨. 1999년 첫 리베르타도레스 우승의 수호신이자 2002년 브라질 월드컵 우승 멤버입니다. 세리이 B 강등 시기에도 팀을 떠나지 않은 충성심의 상징입니다.",
  },
  {
    name: "Luís Pereira",
    nameKo: "루이스 페레이라",
    era: "1970–1975",
    positionKo: "센터백",
    group: "icon",
    whyKo:
      "‘아카데미아 2기’의 수비 핵으로, 흔히 클럽 역사상 최고의 수비수로 꼽힙니다. 큰 키와 기술, 정확한 빌드업 패스를 겸비해 ‘시대를 앞선 수비수’로 평가받았고 이후 스페인 아틀레티코 마드리드로 이적했습니다.",
  },
  {
    name: "Roberto Carlos",
    nameKo: "호베르투 카를루스",
    era: "1993–1995",
    positionKo: "왼쪽 풀백",
    group: "icon",
    whyKo:
      "파르말라트 황금기를 거쳐 인테르 밀란·레알 마드리드로 떠나 역대 최고의 왼쪽 풀백 중 한 명이 됐습니다. 강력한 왼발 프리킥의 대명사로, 파우메이라스가 키운 세계적 스타입니다.",
  },
  {
    name: "Rivaldo",
    nameKo: "히바우두",
    era: "1994–1996",
    positionKo: "공격형 미드필더 / 공격수",
    group: "icon",
    whyKo:
      "파르말라트 시대의 핵심 공격 자원으로, 코린치안스와의 전국 리그 결승에서 결정적 활약을 했습니다. 이후 바르셀로나에서 발롱도르(1999)를 받고 2002년 월드컵 우승을 차지한 전설입니다.",
  },
  {
    name: "Evair",
    nameKo: "에바이르",
    era: "1991–1996",
    positionKo: "중앙 공격수",
    group: "icon",
    whyKo:
      "파르말라트 시대의 해결사. 1993년 파울리스타 우승골로 17년간 이어진 무관을 끝내며 클럽의 부활을 알린 상징적인 스트라이커입니다.",
  },
  {
    name: "Edmundo",
    nameKo: "에드문두",
    nicknameKo: "오 아니마우 (야수)",
    era: "1993–1995",
    positionKo: "공격수",
    group: "icon",
    whyKo:
      "폭발적인 플레이와 결정적인 골로 1993·1994년 전국 리그 2연패를 이끈 1990년대의 대표 아이콘입니다.",
  },
  {
    name: "César Sampaio",
    nameKo: "세자르 삼파이우",
    era: "1990년대",
    positionKo: "수비형 미드필더",
    group: "icon",
    whyKo:
      "파르말라트 시대 중원의 사령탑. 경기를 손에 쥐고 풀어가는 볼란치로 1993·1994년 전국 리그와 1999년 첫 리베르타도레스 우승의 핵심이었습니다.",
  },
  {
    name: "Gabriel Jesus",
    nameKo: "가브리에우 제주스",
    era: "2015–2017",
    positionKo: "공격수",
    group: "icon",
    movedToKo: "맨체스터 시티 (2017)",
    whyKo:
      "아카데미 산실의 상징. 2015년 코파 두 브라질과 신인상, 2016년 12골·올해의 선수(볼라 지 오루)로 22년 만의 전국 리그 우승을 견인한 뒤 2017년 1월 맨체스터 시티로 약 £2,700만에 이적했습니다. 엔드릭·에스테벙으로 이어지는 유스 황금기의 출발점입니다.",
  },
  // --- Recent notable departures (kept as history for newcomers) -------------
  {
    name: "Endrick",
    nameKo: "엔드릭",
    era: "2022–2024",
    positionKo: "공격수",
    group: "recent",
    movedToKo: "레알 마드리드 (2024)",
    whyKo:
      "11세에 입단한 ‘아카데미 산실(Cria da Academia)’. 16세에 1군 데뷔해 큰 화제를 모았고, 약 6,000만 유로에 레알 마드리드로 이적하며 클럽의 유스 육성 모델을 상징하게 됐습니다.",
  },
  {
    name: "Estêvão",
    nameKo: "에스테벙",
    nicknameKo: "메시뉴 (작은 메시)",
    era: "2023–2025",
    positionKo: "윙어",
    group: "recent",
    movedToKo: "첼시 (2025)",
    whyKo:
      "엔드릭의 뒤를 이은 아카데미 산실. 왼발 드리블과 결정력으로 ‘메시뉴’라 불렸고, 약 6,200만 유로에 첼시로 이적했습니다. 브라질 국가대표로도 발탁된 세계적 유망주였습니다.",
  },
  {
    name: "Richard Ríos",
    nameKo: "히샤르드 히오스",
    era: "2022–2025",
    positionKo: "중앙 미드필더",
    group: "recent",
    movedToKo: "벤피카 (2025)",
    whyKo:
      "풋살 출신의 콜롬비아 미드필더로, 파우메이라스에서 만개해 2024 코파 아메리카 준우승 멤버가 됐습니다. 2025년 벤피카로 이적하며 좋은 사이로 유럽 무대에 진출했습니다.",
  },
  {
    name: "Weverton",
    nameKo: "베베르통",
    era: "2018–2026",
    positionKo: "골키퍼",
    group: "recent",
    movedToKo: "그레미우 (2026)",
    whyKo:
      "454경기를 뛰며 12개의 우승 트로피를 든, 클럽 역사상 가장 많이 우승한 골키퍼. 2016 리우 올림픽 금메달과 2020 리베르타도레스 우승의 주역으로, 2026년 그레미우로 떠나며 헌사를 받았습니다.",
  },
  {
    name: "Raphael Veiga",
    nameKo: "하파엘 베이가",
    era: "2017–2026",
    positionKo: "공격형 미드필더",
    group: "recent",
    movedToKo: "클루브 아메리카 (2026, 임대)",
    whyKo:
      "아벨 페헤이라 황금기의 두뇌이자 해결사. 왼발 플레이메이커로 2020·2021 리베르타도레스 결승에서 모두 득점하며 ‘백투백’ 대륙 제패를 이끈 클럽의 상징적 선수입니다. 2026년 멕시코 클루브 아메리카로 임대를 떠났지만(계약은 파우메이라스 잔류) 한 시대를 대표한 미드필더로 기억됩니다.",
  },
];
