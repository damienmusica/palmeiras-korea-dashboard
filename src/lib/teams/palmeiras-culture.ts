// =============================================================================
// Palmeiras living-culture + tactical profile — hand-researched, web-verified.
//
// This is the "otaku layer": the anthem, the mascot's origin, the torcida, the
// stadium's century of lore, and the immigrant identity that a 30-year fan
// expects a serious app to know. Each fact below was cross-checked against
// multiple sources during the build phase (club site, Wikipedia, Brazilian
// sports press). No fabrication — where a detail is disputed, it is flagged.
//
// Key verified facts:
//  - "Avanti, Palestra!" is a war cry (grito de guerra), NOT the club anthem;
//    "avanti" is Italian for "forward", "Palestra" recalls the founding name
//    Palestra Itália. Revived club-wide by Abel Ferreira's dressing-room speeches.
//  - Official anthem "Alviverde Imponente" composed 1949 by Antônio Sergi
//    (Italian-born, naturalized), who signed the lyrics "Gennaro Rodrigues".
//  - Mascot "Porco": rival insult embraced; idea by marketing manager João
//    Gobbato (1983), adopted by fans on 29 Oct 1986 (vs Santos, Pacaembu),
//    made the club's official mascot in 2016 (alongside the Periquito).
//  - Mancha Verde: founded 11 Jan 1983 (merger of three groups); the name
//    adapts Disney villain "Mancha Negra" to green; 150k+ members; after the
//    1995 Pacaembu tragedy it became a samba school (SP Carnival champion
//    2019, 2022).
//  - Stadium: Parque Antártica site → Estádio Palestra Itália (a century of
//    home games) → rebuilt for the 2014 centennial by architect Tomás Taveira,
//    opened 19 Nov 2014 as Allianz Parque; renamed Nubank Parque on 4 May 2026.
// =============================================================================

import type { CultureTopic, TacticalProfile } from "@/lib/domain/types";

export const PALMEIRAS_CULTURE: CultureTopic[] = [
  {
    icon: "🇮🇹",
    titleKo: "이탈리아 이민자의 클럽 — 녹·백의 뿌리",
    subtitleKo: "Palestra Itália",
    bodyKo:
      "1914년 상파울루의 이탈리아 이민자들이 ‘Palestra Itália(파레스트라 이탈리아)’라는 이름으로 세운 클럽입니다. 상징색 녹색·흰색은 이탈리아와의 연결을 담은 정체성이었습니다. 2차 세계대전 중인 1942년, 적성국(이탈리아) 관련 명칭 사용이 금지되자 머리글자 ‘P’만은 지켜 ‘Palmeiras’로 개명했습니다. ‘Avanti, Palestra’ 같은 오늘의 문화 코드에 이 이민의 뿌리가 그대로 살아 있습니다.",
    tagsKo: ["1914 창단", "1942 개명", "녹·백"],
  },
  {
    icon: "🎶",
    titleKo: "“Avanti, Palestra!” — 응원가가 아니라 ‘전쟁 구호’",
    subtitleKo: "Avanti, Palestra! · 아반치 파레스트라",
    bodyKo:
      "흔히 응원가로 오해되지만, 이것은 클럽의 ‘그리투 지 게하(grito de guerra·전쟁 구호)’입니다. ‘Avanti’는 이탈리아어로 ‘전진하라’, ‘Palestra’는 창단명 Palestra Itália를 가리켜 이민의 뿌리를 소환합니다. 감독 아벨 페헤이라가 라커룸 동기부여 연설에서 외치던 말이 팬 전체로 번지며 클럽을 상징하는 외침이 됐습니다. 한편 ‘정식 클럽가(hino)’는 따로 있습니다 — ‘Alviverde Imponente(당당한 녹백)’로, 1949년 이탈리아 태생 음악가 안토니우 세르지가 작곡했고 가사에는 ‘제나루 호드리게스’라는 예명을 썼습니다.",
    tagsKo: [
      "grito de guerra",
      "이탈리아어 ‘전진’",
      "정식 클럽가 = Alviverde Imponente (1949)",
    ],
  },
  {
    icon: "🐷",
    titleKo: "‘Porco(돼지)’ — 조롱을 자부심으로 뒤집다",
    subtitleKo: "Porco · 포르쿠",
    bodyKo:
      "원래는 라이벌(특히 코린치안스) 팬들이 파우메이라스를 경멸조로 부르던 말이었습니다. 1983년 마케팅 매니저 João Gobbato(조앙 고바투)가 “차라리 그 별명을 우리 것으로 삼자”고 제안했고, 1986년 10월 29일 파카엠부 산투스전에서 관중이 “Dá-lhe Porco!(가자 돼지!)”를 떼창하며 조롱을 자부심으로 뒤집었습니다. 그해 잡지 Placar 표지에는 조르지뉴 푸치나치가 돼지를 안은 사진이 실렸고, 2016년 ‘Porco’는 앵무새 마스코트 Periquito(페리키투)와 함께 클럽의 공식 마스코트가 됐습니다.",
    tagsKo: ["1986.10.29 수용", "vs 산투스 (파카엠부)", "2016 공식 마스코트"],
  },
  {
    icon: "💚",
    titleKo: "Mancha Verde — 브라질 최대급 토르시다, 그리고 삼바 학교",
    subtitleKo: "Mancha Verde · 만샤 베르지",
    bodyKo:
      "1983년 1월 11일, 세 응원 그룹이 통합해 창단한 파우메이라스의 대표 조직 응원단(torcida organizada)입니다. 이름은 디즈니 만화 악당 ‘Mancha Negra(검은 얼룩)’를 팀 색 녹색으로 바꾼 ‘녹색 얼룩’에서 왔습니다. 회원 15만 명 이상으로 브라질 최대급 규모를 자랑합니다. 1995년 파카엠부 충돌 참사 이후 경기장 출입이 금지되자 같은 해 ‘삼바 학교(escola de samba)’로 변신했고, 상파울루 카니발 스페셜 그룹에서 2019·2022년 우승할 만큼 카니발 무대에서도 강자가 됐습니다.",
    tagsKo: ["1983.01.11 창단", "디즈니 악당서 유래", "삼바 챔피언 2019·2022"],
  },
  {
    icon: "🏟️",
    titleKo: "파레스트라 / 파르키 — 한 세기를 지킨 터전",
    subtitleKo: "Parque Antártica → Palestra Itália → Nubank Parque",
    bodyKo:
      "지금의 아레나는 옛 ‘파르키 안타르치카(Parque Antártica)’ 부지에 있었던 ‘이스타지우 파레스트라 이탈리아(Estádio Palestra Itália)’ 자리에 서 있습니다 — 한 세기 넘게 클럽의 집이었던 땅입니다. 창단 100주년(2014)에 맞춰 포르투갈 건축가 토마스 타베이라 설계로 현대식 다목적 아레나로 재건축됐고, 2014년 11월 19일 첫 공식전(스포르치 헤시피에 0-2 패)을 치렀습니다. 명칭은 개장 당시 ‘Allianz Parque’였다가 2026년 5월 ‘Nubank Parque’로 바뀌었지만, 팬들은 지금도 이곳을 ‘파레스트라’ 또는 그냥 ‘파르키’라 부릅니다.",
    tagsKo: ["수용 43,713석", "2014 재건축 (100주년)", "팬들은 ‘파레스트라’"],
  },
];

export const PALMEIRAS_TACTICS: TacticalProfile = {
  summaryKo:
    "아벨 페헤이라의 파우메이라스는 ‘실리(實利)와 유연함’으로 요약됩니다. 화려한 점유율 축구보다, 견고한 수비 블록을 깔고 볼을 따낸 뒤 한 번에 수직으로 찌르는 전환을 즐깁니다. 상대와 가용 자원에 따라 포메이션을 과감히 바꾸는 적응력이 가장 큰 무기입니다.",
  baseFormationKo: "기본 4-2-3-1 / 4-4-2 · 상대 따라 가변 3백(3-4-3·3-1-4-2)",
  principlesKo: [
    {
      titleKo: "더블 볼란치 (두 명의 수비형 미드필더)",
      bodyKo:
        "중원에 볼란치 둘을 세워 수비를 가리고 빌드업의 첫 단추를 끼웁니다. 한 명은 뒤를 지키고, 한 명은 전진해 공격을 잇는 역할 분담이 팀의 균형추입니다.",
    },
    {
      titleKo: "수직성과 빠른 전환",
      bodyKo:
        "볼을 따내면 옆으로 돌리기보다 곧장 앞으로 — 측면 풀백과 윙어가 폭을 넓히고, 최전방으로 한 번에 연결하는 직선적인 공격을 선호합니다.",
    },
    {
      titleKo: "강한 압박과 탈취",
      bodyKo:
        "공을 잃으면 즉시 되찾으러 달려듭니다. 전방·중원에서의 조직적 압박으로 상대 실수를 유도하고, 그 지점에서 곧바로 역습을 시작합니다.",
    },
    {
      titleKo: "세트피스와 제공권",
      bodyKo:
        "코너킥·프리킥 등 세트피스는 아벨 팀의 확실한 득점 루트입니다. 장신 센터백과 타깃형 공격수의 제공권이 큰 경기에서 승부를 가르는 경우가 많습니다.",
    },
  ],
  noteKo:
    "포메이션은 시즌·상대·부상 상황에 따라 자주 바뀝니다. 숫자보다 ‘견고함 + 빠른 전환 + 적응력’이라는 원칙으로 이해하는 편이 정확합니다.",
};
