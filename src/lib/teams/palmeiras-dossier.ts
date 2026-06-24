// =============================================================================
// Curated player dossiers — authoritative Korean context researched and baked in
// during the build phase (per the "deterministic over free-LLM" principle).
// Keyed by normalized name. Provides:
//   • fact gap-fills (nationality/birthdate) used only when the live API lacks them
//   • rich Korean editorial: role, style, why fans care, narrative, history bio
// Facts are conservative (only confident ones); editorial is framed as context,
// not precise unverified claims. Players not here fall back to position templates.
// =============================================================================

import type { CountryCode, PlayerInsight } from "@/lib/domain/types";
import { normKey } from "@/lib/i18n/ptKo";

export interface PlayerDossier {
  // Optional fact gap-fills (merged only where live data is missing).
  nationality?: CountryCode;
  nationalityKo?: string;
  birthDate?: string;
  heightCm?: number;
  // Editorial Korean context (optional — fact-only entries omit these and the
  // UI falls back to the position template for the narrative).
  roleKo?: string;
  styleKo?: string;
  whyCareKo?: string;
  narrativeKo?: string;
  archetypeKo?: string;
  nameNoteKo?: string;
  /** Longer history/context paragraph for the detail page. */
  bioKo?: string;
}

const DOSSIERS: Record<string, PlayerDossier> = {
  vitorroque: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2005-02-28",
    roleKo: "최전방 공격수 (영건 스트라이커)",
    styleKo:
      "빠른 스피드와 저돌적인 침투, 양발 마무리가 강점인 직선적인 9번 유형입니다.",
    whyCareKo:
      "‘티그리뉴(작은 호랑이)’라 불리는 브라질의 차세대 스트라이커. 유럽(바르셀로나)을 거쳐 브라질로 돌아와 커리어 부활을 노립니다.",
    narrativeKo:
      "유럽에서의 아쉬움을 딛고 다시 떠오르는 스토리 — 지금 파우메이라스에서 가장 주목받는 공격 옵션입니다.",
    archetypeKo: "스피드형 정통 9번 — 뒷공간 침투와 골 결정에 특화된 유형.",
    nameNoteKo:
      "‘비토르 호키’ — Roque의 R은 브라질식으로 ‘ㅎ’에 가깝게 발음합니다.",
    bioKo:
      "어린 나이에 아틀레치쿠 파라나엔시에서 폭발적인 활약으로 유럽 빅클럽들의 주목을 받았고, 바르셀로나로 이적했습니다. 출전 기회를 충분히 얻지 못한 뒤 브라질로 복귀해 다시 주전 스트라이커로 자리를 잡아가는 과정에 있습니다.",
  },
  felipeanderson: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "1993-04-15",
    roleKo: "경험 많은 윙어 / 2선 공격수",
    styleKo:
      "측면 돌파와 영리한 연계, 그리고 유럽 무대에서 다져진 경기 읽는 능력이 특징입니다.",
    whyCareKo:
      "라치오·웨스트햄 등 유럽 무대를 오래 누빈 베테랑. 큰 경기 경험을 팀에 더해주는 자원입니다.",
    narrativeKo:
      "유럽 커리어를 마치고 브라질로 돌아와 리더십과 클래스를 보여줍니다.",
    bioKo:
      "산투스에서 성장해 라치오로 이적, 이후 웨스트햄 등을 거치며 오랜 기간 유럽에서 활약했습니다. 자유계약으로 파우메이라스에 합류해 풍부한 경험을 더하고 있습니다.",
  },
  andreaspereira: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "1996-01-01",
    roleKo: "창조형 중앙 미드필더 (플레이메이커)",
    styleKo:
      "넓은 시야의 패스와 중거리 슛, 세트피스 처리 능력을 갖춘 공격형 미드필더입니다.",
    whyCareKo:
      "맨체스터 유나이티드 유스 출신으로 풀럼 등 프리미어리그를 경험한 테크니션. 중원의 창의성을 책임집니다.",
    narrativeKo: "유럽에서 돌아와 팀의 공격 전개를 한 단계 끌어올린 영입.",
    bioKo:
      "벨기에에서 태어난 브라질 국적의 미드필더로, 맨유 아카데미에서 성장해 프리미어리그(풀럼) 등에서 뛰었습니다. 정확한 킥과 경기 조립 능력이 강점입니다.",
  },
  gustavogomez: {
    nationality: "PY",
    nationalityKo: "파라과이",
    birthDate: "1993-05-06",
    roleKo: "수비의 핵심 센터백 · 주장",
    styleKo:
      "강한 대인 방어와 제공권, 세트피스 상황의 헤더 득점력까지 겸비한 리더형 수비수입니다.",
    whyCareKo:
      "파라과이 국가대표 주장 출신의 수비 기둥. 위기 상황에서 더 강해지는 ‘몬스터’ 같은 존재입니다.",
    narrativeKo:
      "수비진을 지휘하는 정신적 지주이자 가끔 결정적 골까지 넣는 캡틴.",
    archetypeKo: "투지·리더십을 겸비한 정통 중앙 수비수.",
    bioKo:
      "라누스, AC 밀란, 보카 주니어스를 거쳐 파우메이라스에 정착해 주장을 맡고 있는 파라과이 국가대표 센터백입니다. 클럽 역사에 남을 수비 리더로 평가받습니다.",
  },
  jpiquerez: {
    nationality: "UY",
    nationalityKo: "우루과이",
    birthDate: "1998-08-24",
    roleKo: "공격적인 왼쪽 풀백",
    styleKo:
      "폭발적인 오버래핑과 정확한 크로스, 왕성한 활동량으로 측면을 지배합니다.",
    whyCareKo:
      "우루과이 국가대표 풀백으로, 수비뿐 아니라 공격 작업에서도 큰 비중을 차지합니다.",
    archetypeKo: "공수 양면을 책임지는 현대형 윙백.",
    bioKo:
      "우루과이 페냐롤에서 성장해 파우메이라스로 이적, 좌측 풀백을 굳건히 지키며 우루과이 대표팀에도 꾸준히 선발됩니다.",
  },
  jlopez: {
    nationality: "AR",
    nationalityKo: "아르헨티나",
    birthDate: "2000-08-01",
    roleKo: "최전방 중앙 공격수 (타깃맨)",
    styleKo:
      "큰 키를 활용한 제공권과 박스 안 위치 선정으로 득점을 만들어냅니다.",
    whyCareKo:
      "별명 ‘플라코(마른)’의 아르헨티나 스트라이커. 비토르 호키와 함께 최전방을 다투는 해결사입니다.",
    archetypeKo: "박스 안 마무리에 집중하는 정통 9번.",
    nameNoteKo:
      "‘호세 로페스’ — 별명 Flaco는 스페인어로 ‘마른’이라는 뜻입니다.",
    bioKo:
      "아르헨티나 라누스에서 성장한 스트라이커로, 파우메이라스 이적 후 꾸준히 득점을 쌓으며 주전 공격수로 자리잡았습니다.",
  },
  paulinho: {
    nationality: "BR",
    nationalityKo: "브라질",
    roleKo: "측면·2선을 오가는 공격 자원",
    styleKo:
      "스피드와 드리블 돌파, 그리고 골 결정력을 겸비한 폭발적인 공격수입니다.",
    whyCareKo:
      "아틀레치쿠 미네이루에서 좋은 활약을 보인 뒤 합류한 매치 위너 유형. 컨디션이 오르면 경기를 바꿉니다.",
    narrativeKo:
      "부상 관리가 관건이지만, 살아나면 가장 위협적인 공격 옵션 중 하나.",
    bioKo:
      "브라질 무대에서 폭발적인 돌파와 득점으로 이름을 알린 공격수로, 파우메이라스의 측면·전방 공격에 다양성을 더합니다.",
  },
  brunofuchs: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "1999-04-01",
    roleKo: "빌드업형 센터백",
    styleKo:
      "안정적인 패스와 위치 선정으로 후방 빌드업을 돕는 현대형 수비수입니다.",
    whyCareKo:
      "아틀레치쿠 미네이루·유럽 무대를 경험한 센터백으로, 수비 로테이션의 핵심입니다.",
    bioKo:
      "상파울루 유스 출신으로 아틀레치쿠 미네이루, 러시아(CSKA 모스크바) 등을 거쳐 파우메이라스 수비진에 합류했습니다.",
  },
  carlosmiguel: {
    nationality: "BR",
    nationalityKo: "브라질",
    roleKo: "장신 골키퍼",
    styleKo: "큰 키를 활용한 제공권 처리와 안정적인 선방이 강점입니다.",
    whyCareKo:
      "코린치안스·노팅엄 포레스트를 거친 골키퍼로, 골문 경쟁에 깊이를 더합니다.",
    bioKo:
      "코린치안스에서 주목받은 뒤 잉글랜드(노팅엄 포레스트)를 거쳐 파우메이라스 골문 경쟁에 합류한 장신 골키퍼입니다.",
  },
  aranha: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2005-02-07",
    roleKo: "유망한 영건 골키퍼",
    styleKo:
      "어린 나이에도 침착한 선방과 발밑 기술을 보여주는 차세대 자원입니다.",
    whyCareKo: "유스 시스템에서 올라온 미래의 골문 후보로 성장세가 기대됩니다.",
  },
  emartinez: {
    nationality: "UY",
    nationalityKo: "우루과이",
    birthDate: "1999-08-17",
    heightCm: 184,
    roleKo: "중원의 균형추 (수비형/중앙 미드필더)",
    styleKo: "안정적인 볼 배급과 압박, 공수 밸런스 유지가 강점입니다.",
    whyCareKo:
      "우루과이 출신 미드필더로 중원의 균형을 잡아주는 살림꾼입니다. (골키퍼 마르티네스와 동명이인)",
  },
  rsosa: {
    nationality: "PY",
    nationalityKo: "파라과이",
    birthDate: "1999-08-31",
    heightCm: 179,
    roleKo: "측면 윙어",
    styleKo: "빠른 스피드와 측면 돌파로 공격에 활력을 더합니다.",
    whyCareKo:
      "파라과이 국가대표급 윙어로, 잉글랜드 무대를 거쳐 합류한 측면 공격 자원입니다.",
  },
  agiay: {
    nationality: "AR",
    nationalityKo: "아르헨티나",
    roleKo: "젊은 오른쪽 풀백",
    styleKo: "공격 가담과 활동량이 좋은 유망한 풀백입니다.",
    whyCareKo: "아르헨티나 출신의 어린 풀백으로 측면 수비의 미래 자원입니다.",
  },
  khellven: {
    nationality: "BR",
    nationalityKo: "브라질",
    roleKo: "오른쪽 풀백/윙백",
    styleKo: "활동량과 공격 가담이 좋은 측면 수비수입니다.",
    whyCareKo:
      "아틀레치쿠 파라나엔시에서 성장해 합류한 측면 자원으로 오른쪽 경쟁을 더합니다.",
  },
  marcelolomba: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "1986-12-18",
    roleKo: "베테랑 백업 골키퍼",
    styleKo: "풍부한 경험을 바탕으로 골문을 안정적으로 지킵니다.",
    whyCareKo: "경험 많은 골키퍼로 라커룸과 골문에 안정감을 더합니다.",
  },
  // --- Facts researched/verified this build (API-Football profiles) ----------
  marlonfreitas: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "1995-03-27",
    heightCm: 185,
    roleKo: "수비형/중앙 미드필더",
    styleKo: "중원에서 볼을 회수하고 공수를 연결하는 활동량형 미드필더입니다.",
    whyCareKo: "중원의 균형과 안정을 더해주는 자원입니다.",
  },
  abdalqaderghareeb: {
    nationality: "SY",
    nationalityKo: "시리아",
    birthDate: "1995-05-01",
    roleKo: "공격형 미드필더 / 윙어",
    styleKo: "창의적인 패스와 측면·중앙을 오가는 움직임이 특징입니다.",
    whyCareKo:
      "시리아 국가대표급 공격 자원으로, 스쿼드에 색다른 옵션을 더합니다.",
  },
  jarias: {
    nationality: "CO",
    nationalityKo: "콜롬비아",
    birthDate: "1997-09-21",
    heightCm: 170,
    roleKo: "창의적인 윙어 / 공격형 미드필더",
    styleKo:
      "빠른 스피드와 탄탄한 체격, 영리한 의사결정으로 측면과 중앙을 오가며 찬스를 만듭니다.",
    whyCareKo:
      "플루미넨시의 2023 리베르타도레스 우승 주역이자 콜롬비아 국가대표. 2026년 울버햄프턴에서 약 €2,500만(구단 최고액급)에 영입된 즉시전력입니다.",
    narrativeKo: "남미를 평정하고 유럽을 거쳐 합류한 검증된 공격 옵션.",
    nameNoteKo:
      "‘존 아리아스’ — Jhon은 영어 John의 콜롬비아식 표기로 ‘존’에 가깝습니다.",
    bioKo:
      "2021~2025년 플루미넨시에서 230경기 47골 55도움을 기록하며 2023년 코파 리베르타도레스 우승을 이끌었고, 울버햄프턴(잉글랜드)을 거쳐 2026년 파우메이라스에 합류했습니다. 콜롬비아 대표팀의 주축 공격수입니다.",
  },
  mauricio: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2001-06-22",
    roleKo: "2선 침투형 공격형 미드필더",
    styleKo:
      "박스 안으로 적극 침투해 득점에 가담하고, 왼발 슈팅과 부지런한 오프더볼 움직임이 강점입니다.",
    whyCareKo:
      "2024년 인테르나시오나우에서 약 R$5천만(브라질 기록급 이적료)에 영입된 브라질 영건. 득점·도움을 고루 올리는 2선 자원입니다.",
    narrativeKo:
      "큰 이적료에 걸맞은 활약을 증명해가는 과정 — 연령별 대표팀에서 엔드릭과 호흡을 맞춘 또래입니다.",
    bioKo:
      "인테르나시오나우에서 176경기 25골 25도움을 기록하며 성장한 뒤 2024년 파우메이라스로 이적했습니다. 측면과 중앙 2선을 오가며 공격 포인트를 만들어내는 멀티 공격 자원입니다.",
  },
  jefte: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2003-12-21",
    roleKo: "공격적인 왼쪽 풀백",
    styleKo:
      "스스로 ‘공격형 풀백’을 자처할 만큼 적극적인 오버래핑과 일대일 돌파, 측면 공간 침투가 강점입니다.",
    whyCareKo:
      "플루미넨시 유스 출신으로 키프로스(APOEL)·스코틀랜드(레인저스)를 거쳐 2025년 합류한 측면 자원. 주전 피케레스와 왼쪽을 두고 경쟁합니다.",
    narrativeKo: "유럽을 거쳐 돌아온 젊은 풀백 — 피케레스의 대안이자 미래.",
    bioKo:
      "플루미넨시 U-20에서 두각을 나타냈으나 1군 데뷔 전 키프로스 APOEL로 이적해 리그 최우수 왼쪽 풀백에 선정됐고, 이후 스코틀랜드 레인저스에서 56경기를 뛰었습니다. 2025년 파우메이라스에 합류했습니다.",
  },
  allan: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2004-04-19",
    roleKo: "다재다능한 2선·측면 공격수 (아카데미 산실)",
    styleKo:
      "왼발잡이로 측면 윙어·공격형 미드필더·전방을 두루 소화하는 다재다능함과 탈압박 능력이 돋보입니다.",
    whyCareKo:
      "산타카타리나 출신으로 15세부터 성장한 ‘크리아 다 아카데미아(아카데미 산실)’. 2025년 브라질 신인왕(보라 지 프라타)에 선정됐습니다.",
    narrativeKo:
      "차세대 거액 이적 후보로 꼽히는 파우메이라스 유스의 또 다른 보석.",
    bioKo:
      "플로리아노폴리스에서 태어나 15세에 파우메이라스 유스에 합류했습니다. 2025년 프로 첫 시즌부터 빠르게 자리잡으며 아벨 페헤이라의 핵심 옵션이 됐고, 엔드릭(2023)·에스테벙(2024)에 이어 3년 연속 아카데미 출신 신인왕 수상자가 됐습니다.",
  },
  lucasevangelista: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "1995-05-06",
    roleKo: "박스 투 박스 중앙 미드필더",
    styleKo:
      "준수한 활동량과 패스 전개, 공수 연결 능력을 갖춘 중원의 살림꾼입니다.",
    whyCareKo:
      "상파울루 유스 출신으로 우디네세 등 유럽을 거쳐, 2025년 RB 브라간치누에서 영입된 경험 많은 미드필더입니다.",
    bioKo:
      "리메이라 출신으로 상파울루에서 프로에 데뷔한 뒤 우디네세(이탈리아)·낭트·기마랑이스·파나티나이코스 등 유럽을 두루 경험했습니다. RB 브라간치누에서 214경기를 뛴 뒤 2025년 파우메이라스에 합류했습니다.",
  },
  murilo: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "1997-03-27",
    heightCm: 188,
    roleKo: "왼발잡이 주전 센터백",
    styleKo:
      "왼발 빌드업과 제공권, 세트피스 득점력까지 갖춘 공격적인 수비수입니다.",
    whyCareKo:
      "크루제이루 유스 출신으로 러시아 로코모치바 모스크바를 거쳐 2022년 합류, 구스타보 고메스와 함께 수비의 핵을 이룹니다.",
    narrativeKo:
      "이적 당시 큰 주목을 받진 못했지만 주전으로 자리잡아 ‘아벨의 영입 성공작’으로 평가받습니다.",
    bioKo:
      "크루제이루에서 성장해 2019년 로코모치바 모스크바로 이적, 71경기를 뛰며 러시아컵 우승을 경험했습니다. 2022년 파우메이라스 합류 첫 시즌 구스타보 고메스와 함께 한 시즌 11골을 넣으며 클럽 센터백 최다 득점 기록에 이름을 올렸습니다.",
  },
  arthur: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2005-09-04",
    heightCm: 177,
    roleKo: "공격적인 왼쪽 풀백 (아카데미 산실)",
    styleKo:
      "좁은 공간에서의 탈압박과 정확한 패스·크로스가 강점인 기술적인 왼쪽 풀백입니다.",
    whyCareKo:
      "2017년 입단한 ‘크리아 다 아카데미아’. U-20 전국 2연패 등 유스를 휩쓸고 2026년 1군에 데뷔해 피케레스·제프테와 왼쪽을 두고 경쟁하는 미래 자원입니다.",
    narrativeKo:
      "보루시아 도르트문트·브렌트포드 등 유럽이 주시하는 차세대 풀백.",
  },
  luighihanri: {
    nationality: "BR",
    nationalityKo: "브라질",
    roleKo: "유망한 영건 공격수 (아카데미 산실)",
    styleKo:
      "골문 앞 위치 선정과 침착한 마무리가 돋보이는 정통 골잡이 유형입니다.",
    whyCareKo:
      "2016년부터 유스를 거친 ‘크리아 다 아카데미아’로, 모든 연령별 카테고리에서 우승과 득점왕을 휩쓴 골잡이입니다. 2023년 U-17에서 22경기 21골을 몰아치며 아벨 페헤이라의 부름을 받아 1군에 합류했습니다.",
    narrativeKo:
      "바이아웃 8,000만 유로가 걸린 차세대 스트라이커 — 1군 정착이 다음 과제입니다.",
  },
  larson: {
    nationality: "BR",
    nationalityKo: "브라질",
    roleKo: "활동량형 중앙 미드필더 (볼란치)",
    styleKo:
      "중원에서 볼을 회수하고 공수를 연결하는 부지런한 박스 투 박스 유형입니다.",
    whyCareKo:
      "펠로타스 출신으로 고이아스 U-20에서 두각을 나타내 2025년 합류한 ‘가성비 영입’. 2025년 U-20 전국 우승 멤버로, 아벨 페헤이라가 1군으로 끌어올려 2030년까지 계약했습니다.",
    narrativeKo: "이름은 스웨덴의 전설 헨리크 라르손에서 따왔습니다.",
  },
  ramonriquelme: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2006-01-31",
    heightCm: 182,
    roleKo: "장신 영건 공격수 (아카데미 산실)",
    styleKo: "큰 키와 오른발 마무리를 앞세운 정통 골잡이 유형입니다.",
    whyCareKo:
      "2017년 입단한 ‘크리아 다 아카데미아’로, U-20 전국 우승과 코피냐·U-20 리베르타도레스 득점왕을 휩쓴 골잡이입니다. 2025년 1군에 데뷔했고 바이아웃이 1억 유로로 책정될 만큼 기대받습니다.",
    narrativeKo: "제니트 등 유럽이 주시하는 차세대 스트라이커.",
  },
};

// The live API roster sometimes uses an abbreviated first initial (e.g.
// "G. Gómez") while a dossier may be keyed by the full name. Alias the
// abbreviated normalized forms so the lookup still hits.
DOSSIERS.ggomez = DOSSIERS.gustavogomez;

/** Look up a curated dossier by player name (normalized). */
export function getDossier(name: string): PlayerDossier | null {
  return DOSSIERS[normKey(name)] ?? null;
}

// --- Coach dossiers ----------------------------------------------------------

export interface CoachDossier {
  /** ISO date the coach took charge. */
  since?: string;
  /** Longer Korean context paragraph. */
  bioKo: string;
}

const COACH_DOSSIERS: Record<string, CoachDossier> = {
  abelferreira: {
    since: "2020-11-03",
    bioKo:
      "포르투갈 출신 감독으로, 선수 시절 수비수로 뛴 뒤 스포르팅 유스·브라가·PAOK(그리스)를 거쳐 2020년 11월 파우메이라스에 부임했습니다. 부임 직후 코파 두 브라질(2020)과 리베르타도레스 2연패(2020·2021), 전국 리그 2연패(2022·2023)를 이끌며 클럽 역사상 한 번의 부임 기간 기준 최장수 감독이자, 주(州)·전국·대륙 타이틀을 모두 따낸 첫 감독이 됐습니다. 견고한 수비 조직과 빠른 전환, 강한 압박을 바탕으로 한 실리적 운영, 그리고 뜨거운 터치라인 매너로 유명합니다.",
  },
};

/** Curated context for a coach (by normalized name). */
export function getCoachDossier(name: string): CoachDossier | null {
  return COACH_DOSSIERS[normKey(name)] ?? null;
}

/** True when this dossier carries editorial narrative (not just facts). */
export function hasEditorial(d: PlayerDossier): boolean {
  return Boolean(d.roleKo && d.styleKo && d.whyCareKo);
}

/** Convert a dossier into a PlayerInsight (editorial source). */
export function dossierInsight(d: PlayerDossier): PlayerInsight {
  return {
    roleKo: d.roleKo ?? "",
    styleKo: d.styleKo ?? "",
    whyCareKo: d.whyCareKo ?? "",
    narrativeKo: d.narrativeKo,
    archetypeKo: d.archetypeKo,
    nameNoteKo: d.nameNoteKo,
    source: "editorial",
  };
}
