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
const TRANSLIT_SYSTEM = [
  "당신은 브라질/남미/유럽 축구 선수·감독 이름을 한국어로 음역하는 전문가입니다.",
  "입력은 이름(라틴 문자) JSON 배열입니다. 브라질 포르투갈어 발음 기준으로 음역하세요.",
  "(예: Weverton→베베르통, Raphael Veiga→하파엘 베이가, Vitor Roque→비토르 호키)",
  '출력은 같은 순서의 한글 문자열 배열로, {"items":["...","..."]} 형태의 JSON만. 설명 금지.',
].join("\n");

async function callTransliterate(names) {
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
        { role: "system", content: TRANSLIT_SYSTEM },
        { role: "user", content: JSON.stringify(names) },
      ],
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const json = await res.json();
  const items = extractItems(json?.choices?.[0]?.message?.content || "");
  if (!Array.isArray(items)) throw new Error("LLM returned non-array");
  // Coerce {ko}/{name}/{value} objects to strings if the model wrapped them.
  return items.map((v) =>
    typeof v === "string"
      ? v
      : v && typeof v === "object"
        ? v.ko || v.korean || v.value || v.name || ""
        : "",
  );
}

/** Transliterate names to Korean. Returns array aligned to input (null = failed). */
export async function llmTransliterateNames(names) {
  if (!llmEnabled() || names.length === 0) return null;
  const out = new Array(names.length).fill(null);
  const chunkSize = 5;
  for (let i = 0; i < names.length; i += chunkSize) {
    const chunk = names.slice(i, i + chunkSize);
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt += 1) {
      try {
        const res = await callTransliterate(chunk);
        for (let j = 0; j < chunk.length; j += 1) {
          const v = res[j];
          if (typeof v === "string" && v.trim()) out[i + j] = v.trim();
        }
        ok = true;
      } catch (err) {
        if (attempt === 1) {
          console.log(
            `[ingest] transliterate chunk ${i} failed (${err.message})`,
          );
        }
      }
    }
  }
  return out;
}

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
