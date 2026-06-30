// =============================================================================
// Provider-agnostic LLM client (OpenAI-compatible /chat/completions). Works with
// Cerebras, OpenRouter, Groq, Zhipu, etc. — set LLM_API_KEY / LLM_BASE_URL /
// LLM_MODEL. Used ONLY for news translation/interpretation (player/team name
// orthography is handled deterministically in src/lib/i18n/ptKo.ts).
//
// The prompt is engineered for WEAK free-tier models: explicit per-field rules,
// few-shot anchoring, strict anti-hallucination guardrails, fixed Korean
// spellings, and strict JSON. Output is further normalized in-app
// (normalizeKoreanTerms) so quality holds regardless of the model.
// =============================================================================

const TIMEOUT_MS = 40000;
const BATCH = 4; // items per call (bounds reasoning-model token use)

function cfg() {
  return {
    key: process.env.LLM_API_KEY,
    base: process.env.LLM_BASE_URL || "https://api.cerebras.ai/v1",
    model: process.env.LLM_MODEL || "zai-glm-4.7",
  };
}

export function llmEnabled() {
  return Boolean(cfg().key);
}

/**
 * Human-readable label for the configured model, for provenance/source strings.
 * Derived from LLM_MODEL so the displayed source can never drift from the model
 * actually used (e.g. "zai-glm-4.7" → "GLM-4.7").
 */
export function llmModelLabel() {
  const m = cfg().model || "";
  const known = /glm[-_ ]?([0-9.]+)/i.exec(m);
  if (known) return `GLM-${known[1]}`;
  // Fall back to the raw model id minus any vendor prefix ("zai-", "openai/").
  return m.replace(/^[a-z0-9]+[/-]/i, "") || m || "LLM";
}

function extractItems(text) {
  if (!text) return null;
  const t = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const objStart = t.indexOf("{");
  const arrStart = t.indexOf("[");
  let candidate = null;
  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    candidate = t.slice(objStart, t.lastIndexOf("}") + 1);
  } else if (arrStart !== -1) {
    candidate = t.slice(arrStart, t.lastIndexOf("]") + 1);
  }
  if (!candidate) return null;
  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.items)) return parsed.items;
  const arr = Object.values(parsed).find((v) => Array.isArray(v));
  return Array.isArray(arr) ? arr : null;
}

// --- News interpretation prompt (engineered for weak free models) ------------

const NEWS_SYSTEM = [
  "당신은 브라질 축구를 잘 모르는 한국 팬을 위해 ‘파우메이라스(Palmeiras)’ 뉴스를 풀어주는 베테랑 축구 에디터입니다.",
  "입력은 포르투갈어/영어 뉴스 객체의 JSON 배열입니다. 각 객체: {title(원문 제목), excerpt(원문 발췌, 없을 수 있음), source(매체명)}.",
  "",
  "각 입력을 같은 순서로 아래 3개 한국어 필드를 가진 객체로 변환하세요:",
  "1) titleKo — 원문 제목을 자연스러운 한국어 기사 제목으로. 20~30자, 구어체. 어색한 직역·외래어 남발 금지.",
  "2) whyItMatters — ‘왜 중요한가’를 한국 팬 눈높이로 정확히 한 문장(40~75자). 순위·라인업·이적·일정·팀 분위기에 주는 의미를 설명. 초보도 이해되게.",
  "3) fanTake — 팬 감정이 담긴 한 줄(15~35자). 자연스러운 응원/아쉬움 톤. 과장·밈 남발 금지.",
  "",
  "절대 규칙:",
  "- 입력(title/excerpt)에 없는 사실은 만들지 마세요. 점수·이적 확정·부상 정도·기록을 임의로 지어내면 안 됩니다. 정보가 부족하면 일반적으로 서술하세요.",
  "- 이적설·추측은 단정하지 말고 ‘~설’, ‘~할 수도’처럼 표현하세요.",
  "- 고정 한국어 표기를 반드시 사용: 파우메이라스(❌팔메이라스), 코린치안스, 상파울루, 플라멩구, 산투스, 그레미우, 크루제이루, 보타포구, 아벨 페헤이라(감독), 비토르 호키, 브라질레이렁(세리이 A), 리베르타도레스, 코파 두 브라질.",
  "- 클릭베이트·과장·중복 표현 금지. 사실에 기반한 친근하고 명료한 한국어.",
  '- 출력은 오직 JSON 하나. 형식: {"items":[{"titleKo":"","whyItMatters":"","fanTake":""}, ...]}. 설명·코드펜스·주석 금지.',
  "",
  "예시 입력:",
  '[{"title":"Palmeiras vence o Corinthians e dispara na liderança","excerpt":"Verdão venceu por 2 a 0 no Allianz Parque","source":"ge"},{"title":"Abel testa Vitor Roque como titular","excerpt":"","source":"UOL"}]',
  "예시 출력:",
  '{"items":[{"titleKo":"파우메이라스, 코린치안스 꺾고 선두 질주","whyItMatters":"최대 라이벌을 잡은 더비 승리라 선두 경쟁에서 기세와 승점을 동시에 챙겼습니다.","fanTake":"더비 승리는 언제나 짜릿하죠!"},{"titleKo":"아벨, 비토르 호키 선발 카드 만지작","whyItMatters":"새 공격수의 선발 기용 여부는 공격 전술과 득점력에 직접 영향을 줄 수 있습니다.","fanTake":"호키 선발 보고 싶다!"}]}',
].join("\n");

async function chat(messages, maxTokens) {
  const { key, base, model } = cfg();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const json = await res.json();
  return json?.choices?.[0]?.message?.content || "";
}

async function callBatch(items) {
  const content = await chat(
    [
      { role: "system", content: NEWS_SYSTEM },
      {
        role: "user",
        content: JSON.stringify(
          items.map((it) => ({
            title: it.title,
            excerpt: (it.excerpt || "").slice(0, 200),
            source: it.source || "",
          })),
        ),
      },
    ],
    6000,
  );
  const out = extractItems(content);
  if (!Array.isArray(out)) throw new Error("LLM returned non-array");
  return out;
}

/**
 * Translate + interpret news items. Input: [{title, excerpt, source}]. Returns
 * an array aligned to input of { titleKo, whyItMatters, fanTake } (entries may
 * be null where a batch failed → MT fallback). Returns null only if LLM is off.
 */
export async function llmEnrichNews(items) {
  if (!llmEnabled() || items.length === 0) return null;
  const out = new Array(items.length).fill(null);
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    try {
      const res = await callBatch(chunk);
      for (let j = 0; j < chunk.length; j += 1) {
        const r = res[j];
        if (r && r.titleKo) {
          out[i + j] = {
            titleKo: String(r.titleKo).trim(),
            whyItMatters: r.whyItMatters ? String(r.whyItMatters).trim() : null,
            fanTake: r.fanTake ? String(r.fanTake).trim() : null,
          };
        }
      }
    } catch (err) {
      console.log(
        `[ingest] LLM batch ${i / BATCH} failed (${err.message}) — MT fallback`,
      );
    }
  }
  return out;
}
