// =============================================================================
// Provider-agnostic LLM client (OpenAI-compatible /chat/completions). Works with
// Cerebras, OpenRouter, Groq, Zhipu, etc. — set LLM_API_KEY / LLM_BASE_URL /
// LLM_MODEL. Used by the ingest to translate Portuguese headlines into natural
// Korean and generate "왜 중요한가" / fan-take. Returns null on any failure so
// the ingest gracefully falls back to free MyMemory translation.
// =============================================================================

const TIMEOUT_MS = 40000;
const BATCH = 4; // headlines per call (bounds reasoning-model token use)

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

function extractItems(text) {
  if (!text) return null;
  let t = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  // Prefer the outermost {...}; fall back to a bare [...] array.
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
  // object whose first array value is the list
  const arr = Object.values(parsed).find((v) => Array.isArray(v));
  return Array.isArray(arr) ? arr : null;
}

const SYSTEM = [
  "당신은 한국 파우메이라스(Palmeiras) 팬을 위한 축구 에디터입니다.",
  "입력은 포르투갈어/영어 뉴스 헤드라인 JSON 배열입니다.",
  "각 항목을 같은 순서로 {titleKo, whyItMatters, fanTake} 객체로 변환하세요.",
  "- titleKo: 자연스러운 한국어 제목(번역/요약).",
  "- whyItMatters: 왜 중요한지 한국어 한 문장.",
  "- fanTake: 팬 감정이 담긴 한국어 한 줄.",
  "표기: 팀은 '파우메이라스', '코린치안스', '상파울루', '플라멩구' 등 한국 통용 표기를 쓰세요.",
  '출력은 {"items":[...]} 형태의 JSON만. 설명 금지.',
].join("\n");

async function callBatch(titles) {
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
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify(titles) },
      ],
      temperature: 0.4,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || "";
  const items = extractItems(content);
  if (!Array.isArray(items)) throw new Error("LLM returned non-array");
  return items;
}

/**
 * Translate + interpret a list of headlines. Returns an array aligned to the
 * input (same length/order) of { titleKo, whyItMatters, fanTake }; entries may
 * be null where a batch failed. Returns null only if the LLM is disabled.
 * Per-batch errors degrade gracefully (those items get null → MT fallback).
 */
export async function llmEnrichNews(titles) {
  if (!llmEnabled() || titles.length === 0) return null;
  const out = new Array(titles.length).fill(null);
  for (let i = 0; i < titles.length; i += BATCH) {
    const chunk = titles.slice(i, i + BATCH);
    try {
      const res = await callBatch(chunk);
      for (let j = 0; j < chunk.length; j += 1) {
        const r = res[j];
        if (r && r.titleKo) {
          out[i + j] = {
            titleKo: r.titleKo,
            whyItMatters: r.whyItMatters || null,
            fanTake: r.fanTake || null,
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
