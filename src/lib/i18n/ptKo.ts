// =============================================================================
// Brazilian-Portuguese → Korean transliteration. THE IMMUTABLE LANGUAGE LAYER.
//
// Rationale: free-tier LLMs transliterate names inconsistently/incorrectly
// (e.g. "Aranha"→"아란하" instead of "아라냐"). So name orthography is NOT left to
// the runtime model. Instead:
//   1) CURATED maps — authoritative Korean spellings, hand-verified during the
//      build phase (applying 국립국어원 외래어 표기법 포르투갈어 세칙, Brazilian variant).
//   2) A deterministic rule engine (`transliterate`) for anything not curated.
// Both are pure, tested, and stable regardless of which LLM (if any) runs later.
//
// The LLM is used only for news *translation*; its output is then passed through
// `normalizeKoreanTerms` so fixed conventions (team/club spellings) are enforced
// deterministically — model quality can vary without degrading these.
// =============================================================================

/** Normalize a Latin name for map lookup: lowercase, strip accents/punct. */
export function normKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// --- Curated, authoritative Korean names -------------------------------------
// People: current SE Palmeiras squad + coach (verified for this build).
const CURATED_PEOPLE: Record<string, string> = {
  abelferreira: "아벨 페헤이라",
  // GK
  aranha: "아라냐",
  carlosmiguel: "카를루스 미게우",
  klima: "K. 리마",
  luizfelipe: "루이스 펠리피",
  marcelolomba: "마르셀루 롬바",
  // DF
  arthur: "아르투르",
  benedetti: "베네데치",
  brunofuchs: "브루누 푹스",
  agiay: "아구스틴 지아이",
  ggomez: "구스타보 고메스",
  jefte: "제프테",
  khellven: "켈벤",
  mkone: "M. 코네",
  murilo: "무릴루",
  jpiquerez: "조아킨 피케레스",
  // MF
  allan: "알란",
  andreaspereira: "안드레아스 페레이라",
  larson: "라르송",
  lucasevangelista: "루카스 에반젤리스타",
  luisfelipe: "루이스 펠리피",
  marlonfreitas: "마를롱 프레이타스",
  emartinez: "에밀리아노 마르티네스",
  mauricio: "마우리시우",
  rafaelcoutinho: "하파엘 코우치뉴",
  rsosa: "R. 소사",
  abdalqaderghareeb: "압드 알 카데르 가레브",
  // FW
  jarias: "J. 아리아스",
  eduardo: "에두아르두",
  erickmachado: "에리키 마샤두",
  felipeanderson: "펠리피 안데르송",
  ramonriquelme: "하몽 히켈미",
  jlopez: "호세 로페스",
  luighihanri: "루이기 한리",
  paulinho: "파울리뉴",
  vitorroque: "비토르 호키",
};

// Clubs: Série A + common continental opponents (Brazilian-PT readings).
const CURATED_TEAMS: Record<string, string> = {
  palmeiras: "파우메이라스",
  flamengo: "플라멩구",
  fluminense: "플루미넨시",
  athleticoparanaense: "아틀레치쿠 파라나엔시",
  redbullbragantino: "RB 브라간치누",
  bragantino: "RB 브라간치누",
  bahia: "바이아",
  coritiba: "코리치바",
  saopaulo: "상파울루",
  atleticomg: "아틀레치쿠 미네이루",
  atleticomineiro: "아틀레치쿠 미네이루",
  corinthians: "코린치안스",
  cruzeiro: "크루제이루",
  botafogo: "보타포구",
  vitoria: "비토리아",
  internacional: "인테르나시오나우",
  santos: "산투스",
  gremio: "그레미우",
  vascodagama: "바스쿠 다 가마",
  remo: "헤무",
  mirassol: "미라소우",
  chapecoense: "샤페코엔시",
  riverplate: "리베르 플라테",
  bocajuniors: "보카 주니어스",
  bolivar: "볼리바르",
};

// --- Hangul composition ------------------------------------------------------
const VOWELS = "aeiou";
// Lead-consonant → Hangul jamo index (Lead order).
const L = {
  g: 0,
  kk: 1,
  n: 2,
  d: 3,
  r: 5,
  m: 6,
  b: 7,
  s: 9,
  "": 11, // null onset (ㅇ)
  j: 12,
  ch: 14,
  k: 15,
  t: 16,
  p: 17,
  h: 18,
};
// Plain medial vowel index; palatal (after ʃ/ɲ/ʎ) uses y-glide variants.
const Vp: Record<string, number> = { a: 0, e: 5, i: 20, o: 8, u: 13 };
const Vy: Record<string, number> = { a: 2, e: 7, i: 20, o: 12, u: 17 };
// Final-consonant (batchim) index.
const T = { n: 4, l: 8, m: 16, ng: 21 };

function syl(lead: number, vowel: number, tail = 0): string {
  return String.fromCharCode(0xac00 + (lead * 21 + vowel) * 28 + tail);
}
function addTail(s: string, tail: number): string {
  return String.fromCharCode(s.charCodeAt(0) + tail);
}

/**
 * Deterministic Brazilian-PT → Korean transliteration (best-effort fallback for
 * names not in the curated maps). Implements the high-impact rules: initial/rr
 * r→ㅎ, nh→ㄴ+glide, lh→ㄹ+glide, ch/x→ㅅ+glide, ção/ão→앙, ti/te→치, di/de→지,
 * final o→우, final e→이, codas n/m/l/ng. Not perfect for every name — exotic
 * cases should be added to CURATED_PEOPLE/CURATED_TEAMS during the build phase.
 */
export function transliterate(input: string): string {
  // Lowercase, then fold accents. Nasal ã/õ become uppercase markers A/O so the
  // walker can emit a nasal coda (ão→앙). Everything else is stripped to a-z.
  const s = input
    .normalize("NFC")
    .toLowerCase()
    .replace(/ç/g, "s")
    .replace(/ã/g, "A")
    .replace(/õ/g, "O")
    .replace(/[áàâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o")
    .replace(/[úùûü]/g, "u")
    .replace(/[^a-zAO ]/g, "");

  const out: string[] = [];
  const len = s.length;
  let i = 0;
  let wordStart = true;

  const isVowel = (c: string) => c.length === 1 && VOWELS.includes(c);
  const pushSyl = (lead: number, v: number, tail = 0) =>
    out.push(syl(lead, v, tail));
  const attachTail = (t: number) => {
    if (out.length && /[가-힣]/.test(out[out.length - 1])) {
      out[out.length - 1] = addTail(out[out.length - 1], t);
    }
  };

  while (i < len) {
    const c = s[i];
    const next = s[i + 1] || "";
    const next2 = s[i + 2] || "";

    if (c === " ") {
      out.push(" ");
      wordStart = true;
      i += 1;
      continue;
    }

    // Nasal markers (from ã/õ): vowel + ng coda (e.g. ão→앙, ã→앙).
    if (c === "A" || c === "O") {
      const base = c === "A" ? "a" : "o";
      // "ão"/"Ao" → 앙 ; we already replaced o after ã? handle ão specifically.
      pushSyl(L[""], Vp[base], T.ng);
      i += 1;
      // swallow a trailing 'o' (ão) since marker already nasalized
      if (s[i] === "o") i += 1;
      wordStart = false;
      continue;
    }

    // Digraphs
    if (c === "n" && next === "h") {
      const v = s[i + 2];
      if (isVowel(v)) {
        pushSyl(L.n, Vy[v]);
        i += 3;
      } else {
        attachTail(T.n);
        i += 2;
      }
      wordStart = false;
      continue;
    }
    if (c === "l" && next === "h") {
      const v = s[i + 2];
      if (isVowel(v)) {
        pushSyl(L.r, Vy[v]);
        i += 3;
      } else {
        pushSyl(L.r, Vp.i);
        i += 2;
      }
      wordStart = false;
      continue;
    }
    if (c === "c" && next === "h") {
      const v = s[i + 2];
      if (isVowel(v)) {
        pushSyl(L.s, Vy[v]);
        i += 3;
      } else {
        pushSyl(L.s, Vp.i);
        i += 2;
      }
      wordStart = false;
      continue;
    }
    if (c === "r" && next === "r") {
      const v = next2;
      if (isVowel(v)) {
        pushSyl(L.h, Vp[v]);
        i += 3;
      } else {
        pushSyl(L.h, Vp.u);
        i += 2;
      }
      wordStart = false;
      continue;
    }
    if (c === "s" && next === "s") {
      i += 1; // collapse ss → s
      continue;
    }
    if (
      (c === "q" || c === "g") &&
      next === "u" &&
      (next2 === "e" || next2 === "i")
    ) {
      // qu/gu + e/i → hard k/g, u silent
      const lead = c === "q" ? L.k : L.g;
      pushSyl(lead, Vp[next2]);
      i += 3;
      wordStart = false;
      continue;
    }

    // Single consonant
    if (!isVowel(c)) {
      let lead: number | null = null;
      const beforeI = next === "i";
      const beforeFinalE =
        next === "e" && !isVowel(next2) && (i + 2 >= len || next2 === " ");
      switch (c) {
        case "b":
        case "v":
        case "w":
          lead = L.b;
          break;
        case "c":
          lead = next === "e" || next === "i" ? L.s : L.k;
          break;
        case "d":
          lead = beforeI || beforeFinalE ? L.j : L.d;
          break;
        case "f":
          lead = L.p;
          break;
        case "g":
          lead = next === "e" || next === "i" ? L.j : L.g;
          break;
        case "h":
          // silent in PT; skip
          i += 1;
          continue;
        case "j":
          lead = L.j;
          break;
        case "k":
          lead = L.k;
          break;
        case "l":
          lead = L.r;
          break;
        case "m":
          lead = L.m;
          break;
        case "n":
          lead = L.n;
          break;
        case "p":
          lead = L.p;
          break;
        case "q":
          lead = L.k;
          break;
        case "r":
          lead = wordStart ? L.h : L.r;
          break;
        case "s":
          lead = L.s;
          break;
        case "t":
          lead = beforeI || beforeFinalE ? L.ch : L.t;
          break;
        case "x":
          lead = L.s;
          break;
        case "z":
          lead = L.j;
          break;
        default:
          lead = null;
      }
      if (lead === null) {
        i += 1;
        continue;
      }
      if (isVowel(next)) {
        // CV syllable; final vowel adjustments
        const isFinal = i + 2 >= len || s[i + 2] === " ";
        let v = Vp[next];
        if (isFinal && next === "o") v = Vp.u; // final o → 우
        if (isFinal && next === "e") v = Vp.i; // final e → 이
        if (next === "u" && c === "q") v = Vp.u;
        pushSyl(lead, v);
        i += 2;
      } else {
        // No following vowel → coda or standalone
        if (c === "n") attachTail(T.n);
        else if (c === "m") attachTail(T.m);
        else if (c === "l") attachTail(T.l);
        else if (c === "r")
          pushSyl(L.r, 18); // 르 (ㄹ+ㅡ)
        else if (c === "s")
          pushSyl(L.s, 18); // 스 (ㅅ+ㅡ)
        else pushSyl(lead, 18); // consonant + ㅡ
        i += 1;
      }
      wordStart = false;
      continue;
    }

    // Vowel with null onset
    {
      const isFinal = i + 1 >= len || next === " ";
      let v = Vp[c];
      if (isFinal && c === "o") v = Vp.u;
      pushSyl(L[""], v);
      i += 1;
      wordStart = false;
    }
  }

  return out.join("").trim();
}

// --- Public name resolvers ---------------------------------------------------

/** Authoritative Korean for a person; curated first, then rule engine. */
export function koreanName(name: string): string {
  if (!name) return name;
  const key = normKey(name);
  if (CURATED_PEOPLE[key]) return CURATED_PEOPLE[key];
  // Preserve a leading single-letter initial ("A. Giay" → "A. 지아이").
  const m = name.match(/^([A-Z])\.\s+(.+)$/);
  if (m) {
    const rest = name.slice(m[0].indexOf(m[2]));
    const restKey = normKey(rest);
    return `${m[1]}. ${CURATED_PEOPLE[restKey] || transliterate(rest)}`;
  }
  return transliterate(name) || name;
}

/** Authoritative Korean for a club; curated first, then rule engine. */
export function koreanTeamName(name: string): string {
  if (!name) return name;
  const key = normKey(name);
  return CURATED_TEAMS[key] || transliterate(name) || name;
}

// --- Korean term normalization (applied to LLM output) -----------------------
// Enforces canonical fixed spellings so a weak/varying free LLM can't drift.
const TERM_CANON: [RegExp, string][] = [
  [/팔메이라스/g, "파우메이라스"],
  [/코린치언스|코린티안스|코린티언스/g, "코린치안스"],
  [/상파울로/g, "상파울루"],
  [/플라멩고/g, "플라멩구"],
  [/그레미오/g, "그레미우"],
  [/보타포고/g, "보타포구"],
  [/크루제이로/g, "크루제이루"],
  [/바스코/g, "바스쿠"],
  [/아벨 페레이라/g, "아벨 페헤이라"],
  [/리베르타도르스/g, "리베르타도레스"],
];

/** Normalize Korean text from the LLM to canonical club/term spellings. */
export function normalizeKoreanTerms(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [re, to] of TERM_CANON) out = out.replace(re, to);
  return out;
}
