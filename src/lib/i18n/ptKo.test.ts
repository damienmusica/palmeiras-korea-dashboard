import { describe, it, expect } from "vitest";
import {
  koreanName,
  koreanTeamName,
  transliterate,
  normalizeKoreanTerms,
  normKey,
} from "./ptKo";

describe("koreanName — curated, authoritative", () => {
  it("uses verified Korean for current squad", () => {
    expect(koreanName("Aranha")).toBe("아라냐"); // nh → 냐 (not 아란하)
    expect(koreanName("Vitor Roque")).toBe("비토르 호키"); // initial R → ㅎ
    expect(koreanName("Paulinho")).toBe("파울리뉴");
    expect(koreanName("Felipe Anderson")).toBe("펠리피 안데르송");
    expect(koreanName("Murilo")).toBe("무릴루"); // final o → 우
  });
  it("expands known abbreviated names", () => {
    expect(koreanName("G. Gómez")).toBe("구스타보 고메스");
    expect(koreanName("J. López")).toBe("호세 로페스");
    expect(koreanName("J. Piquerez")).toBe("조아킨 피케레스");
  });
  it("transliterates the coach", () => {
    expect(koreanName("Abel Ferreira")).toBe("아벨 페헤이라"); // rr → ㅎ
  });
  it("keeps a Latin initial for unknown abbreviated names", () => {
    const out = koreanName("Z. Unknownsson");
    expect(out.startsWith("Z. ")).toBe(true);
  });
});

describe("koreanTeamName — Brazilian-PT readings", () => {
  it("maps Série A clubs", () => {
    expect(koreanTeamName("Palmeiras")).toBe("파우메이라스");
    expect(koreanTeamName("Santos")).toBe("산투스"); // -os → 투스
    expect(koreanTeamName("São Paulo")).toBe("상파울루");
    expect(koreanTeamName("Grêmio")).toBe("그레미우");
    expect(koreanTeamName("Chapecoense")).toBe("샤페코엔시");
    expect(koreanTeamName("Atlético-MG")).toBe("아틀레치쿠 미네이루");
  });
});

describe("transliterate — deterministic rule engine (fallback)", () => {
  it("applies the initial-R → ㅎ and final-o → 우 rules", () => {
    expect(transliterate("Ronaldo")).toBe("호날두");
  });
  it("always returns Hangul (no Latin leakage) for plain names", () => {
    for (const n of ["Cassio", "Bremer", "Gabriel", "Lucas"]) {
      expect(transliterate(n)).toMatch(/^[가-힣\s]+$/);
    }
  });
});

describe("normalizeKoreanTerms — enforce canonical spellings", () => {
  it("fixes common LLM drift", () => {
    expect(normalizeKoreanTerms("팔메이라스")).toBe("파우메이라스");
    expect(normalizeKoreanTerms("코린치언스")).toBe("코린치안스");
    expect(normalizeKoreanTerms("상파울로 그레미오 보타포고")).toBe(
      "상파울루 그레미우 보타포구",
    );
    expect(normalizeKoreanTerms("아벨 페레이라 감독")).toBe(
      "아벨 페헤이라 감독",
    );
  });
});

describe("normKey", () => {
  it("normalizes for lookup", () => {
    expect(normKey("G. Gómez")).toBe("ggomez");
    expect(normKey("São Paulo")).toBe("saopaulo");
  });
});
