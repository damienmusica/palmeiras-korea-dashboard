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
  // --- Structured career facts (web-verified, multi-source, baked at build
  // time per the deterministic-over-LLM principle). Each is OPTIONAL and is
  // OMITTED entirely when it can't be verified — never a fabricated value
  // (esp. market value, which has no free trustworthy source → never stored).
  /** Pre-Palmeiras path: youth academy + previous senior clubs. */
  careerKo?: string;
  /** How they joined Palmeiras — year, origin club, and a VERIFIED fee only. */
  transfersKo?: string;
  /** National-team experience (senior/youth, major tournaments). */
  nationalTeamKo?: string;
  /** Contract status — expiry year when verifiable; else omitted. */
  contractKo?: string;
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
    careerKo:
      "크루제이루 유스 → 아틀레치쿠 파라나엔시 → 바르셀로나(2024) → 레알 베티스(임대)",
    transfersKo:
      "2025년 2월 바르셀로나에서 완전 이적. 이적료 약 €2,550만(+옵션 €500만)으로, 바르셀로나가 재판매 지분을 일부 보유합니다.",
    nationalTeamKo:
      "브라질 연령별 대표를 거쳐 A대표팀에도 발탁된 차세대 공격수입니다.",
    contractKo: "2029년까지 계약.",
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
    careerKo: "산투스 유스 → 라치오 → 웨스트햄 → 라치오",
    transfersKo:
      "2024년 7월 라치오와 계약이 만료된 뒤 자유계약(이적료 없음)으로 합류했습니다.",
    nationalTeamKo:
      "브라질 A대표팀 경력 보유 — 2018 러시아 월드컵 대표팀에도 포함됐습니다.",
    contractKo: "2027년까지 계약.",
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
    careerKo:
      "맨체스터 유나이티드 유스 → (그라나다·발렌시아·라치오 임대) → 풀럼",
    transfersKo:
      "2025년 8월 풀럼에서 영입. 이적료 약 €1,000만(3년 분할)으로 등번호 8번을 받았습니다.",
    nationalTeamKo: "브라질 A대표팀 경력을 보유한 미드필더입니다.",
    contractKo: "2028년까지 계약.",
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
    careerKo:
      "리베르타(파라과이) → 라누스(2014) → AC 밀란 → 보카 주니어스(임대)",
    transfersKo: "2018년 AC 밀란에서 합류해 주전·주장으로 자리잡았습니다.",
    nationalTeamKo:
      "파라과이 A대표팀 주장. 코파 아메리카 4회(2016·2019·2021·2024) 참가, 2026 월드컵 본선 진출(2010년 이후 첫 진출)을 이끈 수비의 핵입니다.",
    contractKo: "2027년까지 계약(연장).",
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
    careerKo: "리베르 플라테(우루과이) → 페냐롤(2020)",
    transfersKo:
      "2021년 7월 페냐롤에서 영입돼 좌측 풀백 주전으로 정착했습니다.",
    nationalTeamKo:
      "우루과이 A대표팀 — 2021년 9월 데뷔 이후 좌측 풀백 주전으로 꾸준히 선발됩니다.",
    contractKo: "2030년까지 계약.",
  },
  jlopez: {
    nationality: "AR",
    nationalityKo: "아르헨티나",
    birthDate: "2000-12-06",
    heightCm: 190,
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
    careerKo: "라누스(아르헨티나) 유스·1군",
    transfersKo: "2022년 7월 라누스에서 영입. 이적료 약 €950만.",
    nationalTeamKo:
      "아르헨티나 A대표팀에 발탁된 경력이 있는 장신(190cm) 스트라이커입니다.",
    contractKo: "2029년까지 계약.",
  },
  paulinho: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2000-07-15",
    roleKo: "측면·2선을 오가는 공격 자원",
    styleKo:
      "스피드와 드리블 돌파, 그리고 골 결정력을 겸비한 폭발적인 공격수입니다.",
    whyCareKo:
      "바이엘 레버쿠젠과 아틀레치쿠 미네이루를 거쳐 클럽 최고액(당시)에 영입된 매치 위너. 컨디션이 오르면 경기를 바꿉니다.",
    narrativeKo:
      "부상 관리가 관건이지만, 살아나면 가장 위협적인 공격 옵션 중 하나.",
    bioKo:
      "바스쿠 유스 출신으로 2018년 바이엘 레버쿠젠(독일)으로 이적했고, 아틀레치쿠 미네이루를 거쳐 2024년 말 파우메이라스에 합류했습니다. 폭발적인 돌파와 득점으로 측면·전방 공격에 다양성을 더합니다.",
    careerKo: "바스쿠 유스 → 바이엘 레버쿠젠(2018) → 아틀레치쿠 미네이루",
    transfersKo:
      "2024년 12월 아틀레치쿠 미네이루에서 영입. 약 €1,800만(+선수 포함, 총 €2,500만 규모)으로 당시 클럽 최고액 영입.",
    nationalTeamKo:
      "브라질 U-23 — 2020 도쿄 올림픽 금메달(결승 결승골)의 주인공입니다.",
    contractKo: "2029년까지 계약.",
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
    careerKo: "상파울루 유스 → CSKA 모스크바(2020) → 아틀레치쿠 미네이루",
    transfersKo:
      "2025년 아틀레치쿠 미네이루에서 임대로 합류했습니다(완전 영입 옵션 포함).",
    nationalTeamKo:
      "브라질 U-23 — 2020 도쿄 올림픽 금메달 멤버로 활약했습니다.",
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
    careerKo: "코린치안스 → 노팅엄 포레스트(2024)",
    transfersKo:
      "2025년 8월 노팅엄 포레스트에서 영입. 이적료 약 €400만(+옵션).",
    contractKo: "2030년까지 계약.",
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
      "파라과이 국가대표 윙어로, 잉글랜드 무대를 거쳐 합류한 측면 공격 자원입니다.",
    careerKo: "파라과이 무대 → 타예레스(아르헨티나) → 노팅엄 포레스트(2024)",
    transfersKo:
      "2025년 7월 노팅엄 포레스트에서 영입. 이적료 약 $1,400만(5년 계약).",
    nationalTeamKo:
      "파라과이 A대표팀 — 2026 월드컵 본선 명단에 포함된 측면 자원입니다.",
    contractKo: "2030년까지 계약.",
  },
  agiay: {
    nationality: "AR",
    nationalityKo: "아르헨티나",
    roleKo: "젊은 오른쪽 풀백",
    styleKo: "공격 가담과 활동량이 좋은 유망한 풀백입니다.",
    whyCareKo:
      "산로렌소(아르헨티나)의 어린 주장 출신으로, 측면 수비를 책임지는 미래형 풀백입니다.",
    careerKo: "산로렌소(아르헨티나) 유스·1군 (최연소 주장)",
    transfersKo:
      "2024년 7월 산로렌소에서 영입(지분 75%, 약 $750만). 2025년 9월 재계약하며 바이아웃 $1억이 책정됐습니다.",
    nationalTeamKo: "아르헨티나 연령별 대표(U-20·U-23)를 거친 유망주입니다.",
    contractKo: "2030년까지 계약.",
  },
  khellven: {
    nationality: "BR",
    nationalityKo: "브라질",
    roleKo: "오른쪽 풀백/윙백",
    styleKo: "활동량과 공격 가담이 좋은 측면 수비수입니다.",
    whyCareKo:
      "아틀레치쿠 파라나엔시에서 성장하고 러시아(CSKA 모스크바)를 거쳐 합류한 즉시전력으로, 떠난 마이키의 자리를 메웁니다.",
    careerKo:
      "아틀레치쿠 파라나엔시(2019~, 코파 두 브라질·코파 수다메리카나 우승) → CSKA 모스크바(2023)",
    transfersKo:
      "2025년 8월 CSKA 모스크바에서 영입. 이적료 약 €500만(R$3,200만).",
    contractKo: "2030년까지 계약.",
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
    whyCareKo:
      "보타포구 주장으로 2024년 리베르타도레스·전국 리그 우승을 이끈 베테랑. 아니발 모레나(→리베르 플라테) 이탈 후 중원을 보강하기 위해 영입했습니다.",
    careerKo:
      "아틀레치쿠 고이아니엔시 → 보타포구(2023, 주장·2024 리베르타도레스+전국 리그 우승)",
    transfersKo: "2026년 1월 보타포구에서 영입. 이적료 약 €550만(3년 계약).",
    bioKo:
      "아틀레치쿠 고이아니엔시에서 성장해 2023년 보타포구에 합류, 주장으로 2024년 코파 리베르타도레스와 전국 리그 우승을 모두 들어올렸습니다. 2026년 1월 파우메이라스로 이적해 중원의 균형을 책임집니다.",
    contractKo: "2028년까지 계약.",
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
    careerKo:
      "플루미넨시(2021~2025, 2023 리베르타도레스 우승) → 울버햄프턴(2025)",
    transfersKo:
      "2026년 2월 울버햄프턴에서 완전 이적. 이적료 약 €2,500만으로 구단 최고액급 영입입니다.",
    nationalTeamKo: "콜롬비아 A대표팀의 주축 공격 자원입니다.",
    contractKo: "2029년까지 계약.",
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
    careerKo: "인테르나시오나우 유스·1군",
    transfersKo:
      "2024년 7월 인테르나시오나우에서 영입. 이적료 약 €1,050만(브라질 기록급).",
    nationalTeamKo: "브라질 U-23 대표를 거친 2선 자원입니다.",
    contractKo: "2028년까지 계약.",
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
    careerKo:
      "플루미넨시 U-20 → APOEL(키프로스) → 레인저스(스코틀랜드, 2024, 리그 베스트 왼쪽 풀백)",
    transfersKo:
      "2025년 8월 레인저스에서 영입. 이적료 약 R$3,000만(£600만, 5년 계약).",
    contractKo: "2030년까지 계약.",
  },
  allan: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2004-04-19",
    roleKo: "다재다능한 2선·측면 공격수 (아카데미 산실)",
    styleKo:
      "왼발잡이로 측면 윙어·공격형 미드필더·전방을 두루 소화하는 다재다능함과 탈압박 능력이 돋보입니다.",
    whyCareKo:
      "산타카타리나 출신으로 2019년부터 성장한 ‘크리아 다 아카데미아(아카데미 산실)’. 2025년 1군에 데뷔해 빠르게 아벨 페헤이라의 옵션으로 자리잡았습니다.",
    narrativeKo:
      "유럽이 주목하는 차세대 보석 — 재계약 시 바이아웃이 약 €1억(R$6.3억)으로 책정될 만큼 기대받습니다.",
    bioKo:
      "플로리아노폴리스에서 태어나 2019년 파우메이라스 유스에 합류했습니다. U-20에서 전국 선수권·코파 상파울루(2023) 우승을 거치며 두 자릿수 득점을 올렸고, 2025년 1월 1군에 데뷔해 측면과 2선을 두루 소화하는 자원으로 성장하고 있습니다.",
    careerKo:
      "파우메이라스 유스(2019~) — U-20 전국 선수권·코파 상파울루(2023) 우승",
    transfersKo: "유스에서 직속 승격한 홈그로운 자원(이적 없음).",
    nationalTeamKo: "브라질 연령별(U-20) 대표를 거친 유망주입니다.",
    contractKo: "2027년까지 계약(바이아웃 약 €1억).",
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
    careerKo:
      "상파울루 유스 → 우디네세·낭트·기마랑이스·파나티나이코스(유럽) → RB 브라간치누(2020, 214경기)",
    transfersKo: "2025년 3월 RB 브라간치누에서 영입. 이적료 약 €400만.",
    contractKo: "2027년까지 계약(2026년 1월 옵션 발동 연장).",
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
    careerKo:
      "크루제이루 유스 → 로코모치바 모스크바(2019, 러시아 슈퍼컵·러시아컵 우승)",
    transfersKo: "2022년 1월 로코모치바 모스크바에서 영입(2024년 재계약).",
    nationalTeamKo:
      "브라질 연령별 대표(U-20·U-23, 2019 툴롱 토너먼트 우승)를 거쳤습니다.",
    contractKo: "2027년까지 계약.",
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
  // Allowlisted Sub-20 (see palmeiras-roster-overrides.ts) — real player, no
  // senior stats. Honest youth dossier (no fabricated senior record).
  rafaelcoutinho: {
    nationality: "BR",
    nationalityKo: "브라질",
    birthDate: "2006-03-24",
    roleKo: "유스(Sub-20) 주장 · 중앙 미드필더",
    styleKo:
      "경기를 조립하고 중원을 지휘하는 리더형 미드필더로, 또래에서 한 발 앞선 시야와 패스가 강점입니다.",
    whyCareKo:
      "바이아주 이타부나 출신의 ‘크리아 다 아카데미아’. 2006년생으로 Sub-20 주장을 맡아 유스 팀을 이끌며, 1군 등번호(55번)로 등록된 미래 자원입니다.",
    narrativeKo:
      "아직 1군 공식 출전 기록은 없지만, 유스를 이끄는 주장으로 다음 세대를 대표하는 이름입니다.",
    careerKo: "파우메이라스 유스(Sub-20 주장)",
    bioKo:
      "바이아주 이타부나에서 태어난 중앙 미드필더로, 파우메이라스 Sub-20의 주장을 맡고 있습니다. 1군 등번호(55번)로 등록돼 있으나 아직 시니어 공식 경기 출전 기록은 없는, 교차검증된 유스 자원입니다.",
  },
  // Real Sub-20 defender carried on the senior list with a first-team number.
  // The feed row lacks his nationality — fact gap-fill + honest youth framing
  // (no fabricated senior record). Verified 2026-07-02: Sofascore (2479177,
  // Côte d'Ivoire, b. 2007-10-20, 193cm, #44, contract to 2028-10-19, U-20
  // Brasileirão 13 apps + U-20 Libertadores 3) + playmakerstats 3494250.
  ziemohamedkone: {
    nationality: "CI",
    nationalityKo: "코트디부아르",
    birthDate: "2007-10-20",
    heightCm: 193,
    roleKo: "유스(Sub-20) 센터백",
    styleKo:
      "193cm의 큰 체격을 앞세운 왼발 센터백으로, U-20 무대에서 경험을 쌓고 있는 유형입니다.",
    whyCareKo:
      "코트디부아르 출신 2007년생 수비 유망주로, 1군 등번호 44번을 달고 있는 미래 자원입니다.",
    narrativeKo:
      "아직 1군 공식 출전 기록은 없지만, U-20 브라질레이렁과 U-20 리베르타도레스에서 뛰며 성장 중입니다.",
    careerKo: "파우메이라스 유스(Sub-20)",
    contractKo: "2028년 10월까지 계약.",
  },
  // Signing announced 2026-05-22 by the club; can only be fielded from the
  // post-World Cup window (2026-07-20), so the free feeds may list him late —
  // pre-baked so the dossier is ready the moment the roster picks him up.
  // Verified 2026-07-02 (multi-source): metropoles/CNN Brasil/Terra/band
  // (announcement, ~R$20M in 4 installments, contract to Dec 2028 + 1-yr
  // option, plays from Jul 20), Wikipedia/Transfermarkt (b. 1995-03-16,
  // Villa Celina/Buenos Aires, 193cm, River Plate youth → Defensa y Justicia
  // → Independiente → Libertad → Botafogo 2024).
  alexanderbarboza: {
    nationality: "AR",
    nationalityKo: "아르헨티나",
    birthDate: "1995-03-16",
    heightCm: 193,
    roleKo: "센터백 (2026년 여름 영입)",
    styleKo:
      "공중볼 장악과 강한 대인 방어가 특징인 193cm 센터백으로, 거친 경합을 마다하지 않는 파이터형입니다.",
    whyCareKo:
      "보타포구의 2024년 리베르타도레스·브라질레이렁 동시 우승 멤버였던 아르헨티나 센터백. 2026년 5월 파우메이라스가 영입을 공식 발표했습니다.",
    narrativeKo:
      "월드컵 휴식기가 끝나는 7월 20일부터 출전 가능한 뒷선 보강 카드 — 우승 경험을 수비진에 더합니다.",
    careerKo:
      "리베르 플라테 유스 → 데펜사 이 후스티시아 → 인데펜디엔테 → 리베르타드(파라과이) → 보타포구(2024) → 파우메이라스(2026)",
    transfersKo:
      "2026년 5월 22일 보타포구에서 이적 공식 발표 — 이적료 약 R$ 2,000만(4회 분할). 등록 규정상 2026년 7월 20일부터 출전 가능합니다.",
    contractKo: "2028년 12월까지 계약 (1년 연장 옵션).",
  },
};

// The live API roster sometimes uses an abbreviated first initial (e.g.
// "G. Gómez") while a dossier may be keyed by the full name. Alias the
// abbreviated normalized forms so the lookup still hits.
DOSSIERS.ggomez = DOSSIERS.gustavogomez;
DOSSIERS.mkone = DOSSIERS.ziemohamedkone; // feed lists him as "M. Kone"
DOSSIERS.abarboza = DOSSIERS.alexanderbarboza;
DOSSIERS.barboza = DOSSIERS.alexanderbarboza; // Botafogo-era feeds used "Barboza"

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

/** True when this dossier carries any web-verified structured career fact. */
export function hasCareerFacts(d: PlayerDossier): boolean {
  return Boolean(
    d.careerKo || d.transfersKo || d.nationalTeamKo || d.contractKo,
  );
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
