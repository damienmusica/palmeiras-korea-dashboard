// =============================================================================
// Palmeiras team configuration — the single source of truth for club identity.
// To add another team, create a sibling file exporting a TeamConfig and register
// it in src/lib/teams/index.ts. The UI reads only from TeamConfig.
// =============================================================================

import type { CompetitionRef, TeamConfig } from "@/lib/domain/types";

export const BRASILEIRAO: CompetitionRef = {
  id: "brasileirao",
  name: "Campeonato Brasileiro Série A",
  nameKo: "브라질 세리이 A (전국 리그)",
  shortName: "Brasileirão",
  kind: "league",
};

export const LIBERTADORES: CompetitionRef = {
  id: "libertadores",
  name: "CONMEBOL Libertadores",
  nameKo: "코파 리베르타도레스 (남미 챔피언스리그)",
  shortName: "Libertadores",
  kind: "continental",
};

export const COPA_DO_BRASIL: CompetitionRef = {
  id: "copa-do-brasil",
  name: "Copa do Brasil",
  nameKo: "코파 두 브라질 (국내컵)",
  shortName: "Copa do Brasil",
  kind: "cup",
};

export const PAULISTA: CompetitionRef = {
  id: "paulista",
  name: "Campeonato Paulista",
  nameKo: "상파울루 주 선수권",
  shortName: "Paulistão",
  kind: "league",
};

export const PALMEIRAS: TeamConfig = {
  id: "palmeiras",
  name: "Sociedade Esportiva Palmeiras",
  nameKo: "소시에다지 에스포르치바 파우메이라스",
  shortName: "Palmeiras",
  nickname: "Verdão",
  nicknameKo: "베르덩 (거대한 녹색)",
  founded: 1914,
  country: "BR",
  homeTimezone: "America/Sao_Paulo",
  colors: {
    primary: "#006437", // Palmeiras green
    secondary: "#ffffff",
    accent: "#9fd5b7",
  },
  crest: "/teams/palmeiras/crest.png", // real club crest (ESPN), bundled locally
  stadium: {
    name: "Allianz Parque",
    nameKo: "알리안츠 파르키",
    commonName: "Allianz Parque (Arena Palestra Itália)",
    capacity: 43713,
    city: "São Paulo",
    opened: 2014,
    note: "상파울루 시 서부 아구아 브랑카 지역의 홈구장. 옛 파레스트라 이탈리아 경기장 자리에 2014년 재건축되었습니다. 콘서트와 다목적 아레나로도 쓰이며 팬들 사이에서는 여전히 '파레스트라'로 불립니다.",
  },
  competitions: [BRASILEIRAO, LIBERTADORES, COPA_DO_BRASIL, PAULISTA],
  officialLinks: [
    {
      label: "Official site",
      labelKo: "공식 홈페이지",
      url: "https://www.palmeiras.com.br/",
    },
    {
      label: "Instagram (@palmeiras)",
      labelKo: "인스타그램",
      url: "https://www.instagram.com/palmeiras/",
    },
    {
      label: "X / Twitter (@Palmeiras)",
      labelKo: "X (트위터)",
      url: "https://x.com/Palmeiras",
    },
    {
      label: "YouTube (TV Palmeiras)",
      labelKo: "유튜브 (TV 파우메이라스)",
      url: "https://www.youtube.com/@TVPalmeiras",
    },
    {
      label: "CBF — Brasileirão",
      labelKo: "CBF (브라질 축구협회)",
      url: "https://www.cbf.com.br/",
    },
  ],
  trophies: [
    {
      competition: "Campeonato Brasileiro Série A",
      competitionKo: "브라질 세리이 A",
      count: 12,
      lastWon: 2023,
    },
    {
      competition: "Copa Libertadores",
      competitionKo: "코파 리베르타도레스",
      count: 3,
      lastWon: 2021,
    },
    {
      competition: "Copa do Brasil",
      competitionKo: "코파 두 브라질",
      count: 4,
      lastWon: 2020,
    },
    {
      competition: "Campeonato Paulista",
      competitionKo: "상파울루 주 선수권",
      count: 26,
      lastWon: 2024,
    },
    {
      competition: "Copa Rio (Mundial 1951)",
      competitionKo: "코파 히우 (1951 세계 클럽 대회)",
      count: 1,
      lastWon: 1951,
    },
  ],
  rivals: [
    {
      name: "Corinthians",
      nameKo: "코린치안스",
      derby: "Derby Paulista",
      derbyKo: "데르비 파울리스타",
      context:
        "파우메이라스 최대 라이벌. 상파울루를 양분하는 두 거대 클럽의 더비로, 브라질에서 가장 뜨거운 라이벌전 중 하나입니다. 1933년 첫 경기 이후 100년 넘게 이어지고 있습니다.",
    },
    {
      name: "São Paulo FC",
      nameKo: "상파울루 FC",
      derby: "Choque-Rei",
      derbyKo: "쇼키-헤이 ('왕들의 충돌')",
      context:
        "상파울루를 대표하는 또 다른 명문과의 더비. 두 클럽 모두 풍부한 우승 역사를 가지고 있어 '왕들의 충돌'로 불립니다.",
    },
    {
      name: "Santos FC",
      nameKo: "산투스 FC",
      derby: "Clássico da Saudade",
      derbyKo: "클라시쿠 다 사우다지 ('그리움의 더비')",
      context:
        "펠레의 산투스와의 전통 더비. 1960~70년대 명승부가 많아 '그리움의 더비'라는 향수 어린 이름이 붙었습니다.",
    },
  ],
  nameNotes: [
    "파우메이라스(Palmeiras)는 포르투갈어로 '야자수들'을 뜻합니다. 브라질 현지 발음에 가깝게 '파우메이라스'로 표기했지만, 한국 언론에서는 영어식으로 '팔메이라스'라고 쓰는 경우도 많습니다 — 같은 팀입니다.",
    "애칭 'Verdão(베르덩)'은 '큰 초록'이라는 뜻으로, 팀의 상징색인 녹색에서 왔습니다.",
    "1914년 이탈리아 이민자들이 'Palestra Itália(파레스트라 이탈리아)'라는 이름으로 창단했고, 2차 세계대전 중인 1942년 현재의 이름으로 바꿨습니다.",
    "서포터의 상징은 'Porco(포르쿠, 돼지)'로, 한때 상대 팬들의 조롱이었으나 팬들이 자랑스럽게 받아들여 마스코트가 되었습니다.",
  ],
  glossary: [
    {
      term: "Verdão",
      reading: "베르덩",
      meaning: "'거대한 초록'. 파우메이라스의 대표 애칭.",
      category: "club",
    },
    {
      term: "Porco / Porcada",
      reading: "포르쿠 / 포르카다",
      meaning: "'돼지'. 파우메이라스와 그 팬들을 가리키는 애정 어린 별명.",
      category: "club",
    },
    {
      term: "Palestra",
      reading: "파레스트라",
      meaning: "창단 당시 이름(Palestra Itália)에서 온 홈구장·클럽의 옛 애칭.",
      category: "club",
    },
    {
      term: "Torcida",
      reading: "토르시다",
      meaning: "서포터즈, 응원단. 'Torcida Organizada'는 조직된 응원단.",
      category: "culture",
    },
    {
      term: "Mancha Verde",
      reading: "만샤 베르지",
      meaning: "'녹색 얼룩'. 파우메이라스의 대표적인 조직 응원단 이름.",
      category: "culture",
    },
    {
      term: "Derby / Clássico",
      reading: "데르비 / 클라시쿠",
      meaning: "라이벌전, 빅매치. 같은 도시·지역 강팀 간의 경기.",
      category: "general",
    },
    {
      term: "Volante",
      reading: "볼란치",
      meaning: "수비형 미드필더. 브라질 축구의 핵심 포지션 용어.",
      category: "tactics",
    },
    {
      term: "Lateral",
      reading: "라테라우",
      meaning: "측면 수비수(풀백). 'lateral-direito'는 오른쪽 풀백.",
      category: "tactics",
    },
    {
      term: "Meia",
      reading: "메이아",
      meaning: "공격형/중앙 미드필더(플레이메이커).",
      category: "tactics",
    },
    {
      term: "Camisa 10",
      reading: "카미자 데스",
      meaning: "등번호 10번. 팀의 핵심 창조형 선수를 상징.",
      category: "tactics",
    },
    {
      term: "Garra",
      reading: "가하",
      meaning: "'투지·근성'. 끝까지 싸우는 정신을 칭찬할 때 쓰는 말.",
      category: "culture",
    },
    {
      term: "Avanti Palestra",
      reading: "아반치 파레스트라",
      meaning: "'전진하라 파레스트라'. 클럽 응원가의 상징적인 문구.",
      category: "chant",
    },
  ],
  starterGuide: [
    {
      title: "한 줄 소개",
      body: "파우메이라스는 1914년 상파울루에서 이탈리아 이민자들이 세운 브라질 최고 명문 중 하나입니다. 상징색은 녹색이며 'Verdão(베르덩)'으로 불립니다.",
    },
    {
      title: "왜 강팀인가",
      body: "브라질 전국 리그(세리이 A) 최다 우승팀 중 하나(12회)이며, 남미 챔피언스리그인 리베르타도레스를 3회 우승했습니다. 최근 10년간 가장 꾸준한 강팀입니다.",
    },
    {
      title: "꼭 아는 더비",
      body: "최대 라이벌은 코린치안스(데르비 파울리스타). 상파울루 FC, 산투스와의 경기도 빅매치입니다.",
    },
    {
      title: "응원 문화",
      body: "팬들은 스스로를 'Porco(돼지)'라 부르며, 대표 응원단은 'Mancha Verde'입니다. 홈구장 알리안츠 파르키의 분위기는 브라질 최고 수준입니다.",
    },
    {
      title: "이렇게 즐기세요",
      body: "이 대시보드에서 다음 경기 일정(한국·브라질 시간), 최근 폼, 스쿼드, 순위, 뉴스를 한눈에 확인하세요. 경기는 보통 브라질 저녁(한국 시간 아침)에 열립니다.",
    },
  ],
  identity:
    "소시에다지 에스포르치바 파우메이라스는 1914년 창단된 브라질 상파울루의 축구 명문입니다. 녹색과 흰색을 상징색으로 하며, 브라질 전국 리그 최다 우승급 기록과 3회의 리베르타도레스 우승을 자랑하는, 남미를 대표하는 빅클럽입니다.",
};
