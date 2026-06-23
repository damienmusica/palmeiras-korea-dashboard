// =============================================================================
// Free, keyless-first data ingest. Runs in CI (GitHub Actions) on a cron.
//
//   npm run ingest   (or: node scripts/ingest.mjs)
//
// Sources (all free; keys optional and only enhance):
//   • News      — Google News RSS (keyless). LLM (LLM_API_KEY) for KO summary +
//                 "why it matters" + fan-take; falls back to free MyMemory MT.
//   • Standings — ESPN public JSON (keyless, CURRENT season).
//   • Matches   — ESPN public JSON (keyless, CURRENT fixtures/results).
//   • Squad photos — API-Football (API_FOOTBALL_KEY) current roster photos.
//
// Everything is written to data/*.json (the repo is the "DB"); the site reads
// snapshots. Never throws on network errors: logs and continues so a flaky
// source never breaks the job (it just keeps the last snapshot). Note: the ESPN
// JSON is unofficial/undocumented — used best-effort with seed fallback in-app.
// =============================================================================

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { llmEnrichNews, llmEnabled } from "./llm.mjs";

const DATA_DIR = join(process.cwd(), "data");
// Bias to the football club (the bare name "Palmeiras" also matches unrelated
// neighbourhoods/social clubs, which surfaced off-topic/sensitive stories).
const NEWS_QUERY =
  process.env.NEWS_QUERY ??
  'Palmeiras (Verdão OR Brasileirão OR Libertadores OR "Abel Ferreira" OR futebol)';
const GOOGLE_NEWS_RSS = `https://news.google.com/rss/search?q=${encodeURIComponent(
  NEWS_QUERY,
)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
const MAX_ITEMS = 24;
const ENABLE_MT = process.env.DISABLE_MT !== "1";
const FETCH_TIMEOUT_MS = 12000;
const MAX_BYTES = 2_000_000;
const PALMEIRAS_API_ID = 121; // API-Football
const PALMEIRAS_ESPN_ID = "2029"; // ESPN
const ESPN_BASE = "https://site.api.espn.com/apis";

// --- helpers ----------------------------------------------------------------

function log(...args) {
  console.log("[ingest]", ...args);
}

/** Load .env.local for local runs (CI provides real env / secrets). */
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      if (!line.includes("=") || line.trim().startsWith("#")) continue;
      const i = line.indexOf("=");
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim();
      if (k && process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    /* no .env.local — fine */
  }
}

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function pick(block, tags) {
  for (const tag of tags) {
    const m = block.match(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
    );
    if (m) return decodeEntities(m[1]);
  }
  return undefined;
}

function safeUrl(raw) {
  if (!raw) return "#";
  const v = String(raw).trim();
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? v : "#";
  } catch {
    return "#";
  }
}

async function getJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "PalmeirasKoreaDashboard/1.0",
      ...(opts.headers || {}),
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PalmeirasKoreaDashboard/1.0" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const t = await res.text();
  return t.length > MAX_BYTES ? t.slice(0, MAX_BYTES) : t;
}

function writeData(file, obj) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(obj, null, 2) + "\n");
}

function readData(file) {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
  } catch {
    return null;
  }
}

// --- Korean team names (Série A 2026 + common continental opponents) --------

const TEAM_KO = {
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
  "atletico-mg": "아틀레치쿠 미네이루",
  corinthians: "코린치안스",
  cruzeiro: "크루제이루",
  botafogo: "보타포구",
  vitoria: "비토리아",
  internacional: "인테르나시오나우",
  santos: "산투스",
  gremio: "그레미우",
  vascodagama: "바스쿠 다 가마",
  remo: "헤모",
  mirassol: "미라솔",
  chapecoense: "샤페코엔시",
  riverplate: "리베르 플라테",
  boca: "보카 주니어스",
  bolivar: "볼리바르",
};

function normTeam(name) {
  return (name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function teamKo(name) {
  return TEAM_KO[normTeam(name)] || name;
}

const BRASILEIRAO = {
  id: "brasileirao",
  name: "Campeonato Brasileiro Série A",
  nameKo: "브라질 세리이 A (전국 리그)",
  shortName: "Brasileirão",
  kind: "league",
};

function teamRef(espnTeam) {
  const name = espnTeam.displayName || espnTeam.name || espnTeam.abbreviation;
  const isPalmeiras =
    String(espnTeam.id) === PALMEIRAS_ESPN_ID || /palmeiras/i.test(name);
  if (isPalmeiras) {
    return {
      id: "palmeiras",
      name: "Palmeiras",
      nameKo: "파우메이라스",
      crest: "/teams/palmeiras/crest.svg",
    };
  }
  return { id: String(espnTeam.id), name, nameKo: teamKo(name) };
}

function mapStatus(state) {
  if (state === "pre") return "scheduled";
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "scheduled";
}

// --- news ingest ------------------------------------------------------------

async function ingestNews() {
  log("fetching Google News RSS…");
  const xml = await getText(GOOGLE_NEWS_RSS);
  const blocks = [...xml.matchAll(/<item>[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  log(`found ${blocks.length} raw items`);

  // Cache: reuse Korean fields for URLs we've already processed.
  const prev = readData("news.json");
  const prevByUrl = new Map((prev?.items || []).map((it) => [it.url, it]));

  const parsed = [];
  for (let i = 0; i < blocks.length && parsed.length < MAX_ITEMS; i += 1) {
    const block = blocks[i];
    const title = pick(block, ["title"]);
    if (!title) continue;
    const url = safeUrl(pick(block, ["link", "guid"]));
    const pub = pick(block, ["pubDate", "published", "updated"]);
    const parsedDate = pub ? new Date(pub) : null;
    const publishedAt =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : new Date().toISOString();
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const source = sourceMatch
      ? decodeEntities(sourceMatch[1])
      : "news.google.com";
    const description = pick(block, ["description"]) ?? "";
    parsed.push({ title, url, publishedAt, source, description });
  }

  // Which items are new (need enrichment)?
  const fresh = parsed.filter((p) => !prevByUrl.has(p.url));
  log(
    `${fresh.length} new items to enrich (LLM ${llmEnabled() ? "on" : "off"})`,
  );

  const llm = await llmEnrichNews(fresh.map((p) => p.title));

  const items = [];
  for (let idx = 0; idx < parsed.length; idx += 1) {
    const p = parsed[idx];
    const cached = prevByUrl.get(p.url);
    if (
      cached &&
      cached.summaryKo &&
      !/자동 번역이 적용되지/.test(cached.summaryKo)
    ) {
      items.push({ ...cached, publishedAt: p.publishedAt, source: p.source });
      continue;
    }
    const freshIdx = fresh.indexOf(p);
    const ai = llm && freshIdx >= 0 ? llm[freshIdx] : null;
    const tags = ["뉴스"];
    let summaryKo;
    let whyItMattersKo;
    let fanTakeKo;
    if (ai && ai.titleKo) {
      summaryKo = ai.titleKo;
      whyItMattersKo = ai.whyItMatters || undefined;
      fanTakeKo = ai.fanTake || undefined;
      tags.push("AI요약");
    } else {
      const ko = await translateToKo(p.title);
      summaryKo =
        ko ??
        "자동 번역이 적용되지 않았습니다. 원문 제목과 아래 ‘왜 중요한가’ 해설, 원문 링크를 참고하세요.";
      if (ko) tags.push("자동번역");
    }
    items.push({
      id: `gnews-${idx}-${p.url}`.slice(0, 120),
      title: p.title,
      summaryKo,
      excerpt: p.description.slice(0, 240) || undefined,
      url: p.url,
      source: p.source,
      language: "pt",
      publishedAt: p.publishedAt,
      whyItMattersKo,
      fanTakeKo,
      tags,
    });
  }

  if (items.length === 0) {
    log("no news items parsed; keeping existing snapshot");
    return;
  }
  writeData("news.json", {
    origin: "rss",
    source: llmEnabled()
      ? "Google News RSS + LLM(GLM-4.7) 요약"
      : "news.google.com (Google News RSS)",
    fetchedAt: new Date().toISOString(),
    items,
  });
  log(`wrote data/news.json (${items.length} items)`);
}

// --- free MyMemory translation fallback (keyless) ---------------------------

async function translateToKo(text) {
  if (!ENABLE_MT || !text) return null;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.slice(0, 480),
    )}&langpair=pt|ko`;
    const r = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const out = j?.responseData?.translatedText;
    if (!out || /MYMEMORY WARNING|INVALID/i.test(out)) return null;
    return decodeEntities(String(out));
  } catch {
    return null;
  }
}

// --- ESPN standings (free, current) -----------------------------------------

function stat(entry, names) {
  for (const s of entry.stats || []) {
    if (names.includes(s.type) || names.includes(s.name)) {
      return Number(s.value);
    }
  }
  return 0;
}

async function ingestStandings() {
  log("fetching current standings from ESPN…");
  const data = await getJson(`${ESPN_BASE}/v2/sports/soccer/bra.1/standings`);
  const entries =
    data?.children?.[0]?.standings?.entries || data?.standings?.entries || [];
  if (entries.length === 0) {
    log("ESPN standings empty — keeping existing/seed");
    return;
  }
  const table = entries.map((e, i) => {
    const ref = teamRef(e.team);
    const won = stat(e, ["wins"]);
    const drawn = stat(e, ["ties"]);
    const lost = stat(e, ["losses"]);
    const gf = stat(e, ["pointsFor"]);
    const ga = stat(e, ["pointsAgainst"]);
    return {
      rank: stat(e, ["rank"]) || i + 1,
      teamId: ref.id,
      teamName: ref.name,
      teamNameKo: ref.nameKo,
      played: stat(e, ["gamesPlayed"]),
      won,
      drawn,
      lost,
      goalsFor: gf,
      goalsAgainst: ga,
      goalDifference: stat(e, ["pointDifferential"]) || gf - ga,
      points: stat(e, ["points"]),
      form: [],
      isTracked: ref.id === "palmeiras",
    };
  });
  table.sort((a, b) => a.rank - b.rank);
  writeData("standings.json", {
    origin: "api",
    source: "ESPN (현재 시즌)",
    fetchedAt: new Date().toISOString(),
    season: String(data?.season?.year || new Date().getFullYear()),
    competition: BRASILEIRAO,
    table,
    topScorers: [],
    topAssisters: [],
  });
  log(`wrote data/standings.json (${table.length} teams)`);
}

// --- ESPN matches (free, current) -------------------------------------------

function mapEvent(e) {
  const comp = e.competitions?.[0];
  if (!comp) return null;
  const competitors = comp.competitors || [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;
  const homeRef = teamRef(home.team);
  const awayRef = teamRef(away.team);
  if (homeRef.id !== "palmeiras" && awayRef.id !== "palmeiras") return null;
  const status = mapStatus(comp.status?.type?.state);
  const item = {
    id: `espn-${e.id}`,
    competition: BRASILEIRAO,
    kickoff: e.date,
    status,
    venue: homeRef.id === "palmeiras" ? "home" : "away",
    stadium: comp.venue?.fullName || undefined,
    round: e.week?.text || comp.notes?.[0]?.headline || undefined,
    home: homeRef,
    away: awayRef,
  };
  const hs = Number(home.score?.value ?? home.score);
  const as = Number(away.score?.value ?? away.score);
  if (status === "finished" && Number.isFinite(hs) && Number.isFinite(as)) {
    item.score = { home: hs, away: as };
  }
  return item;
}

async function ingestMatches() {
  log("fetching current fixtures/results from ESPN…");
  const events = [];
  // Played + listed matches from the team schedule.
  const sched = await getJson(
    `${ESPN_BASE}/site/v2/sports/soccer/bra.1/teams/${PALMEIRAS_ESPN_ID}/schedule`,
  );
  events.push(...(sched?.events || []));
  // Upcoming fixtures from the league scoreboard over a forward window
  // (the schedule endpoint tends to omit not-yet-scheduled rounds).
  try {
    const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
    const from = fmt(new Date(Date.now() - 7 * 86400000));
    const to = fmt(new Date(Date.now() + 75 * 86400000));
    const sb = await getJson(
      `${ESPN_BASE}/site/v2/sports/soccer/bra.1/scoreboard?dates=${from}-${to}`,
    );
    for (const e of sb?.events || []) {
      const has = (e.competitions?.[0]?.competitors || []).some(
        (c) => String(c.team?.id) === PALMEIRAS_ESPN_ID,
      );
      if (has) events.push(e);
    }
  } catch (err) {
    log("scoreboard window fetch failed:", err.message);
  }

  const seen = new Set();
  const items = [];
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    const item = mapEvent(e);
    if (item) items.push(item);
  }
  if (items.length === 0) {
    log("ESPN matches empty — keeping existing/seed");
    return;
  }
  items.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const upcoming = items.filter((m) => m.status !== "finished").length;
  writeData("matches.json", {
    origin: "api",
    source: "ESPN (현재 시즌)",
    fetchedAt: new Date().toISOString(),
    items,
  });
  log(
    `wrote data/matches.json (${items.length} matches, ${upcoming} upcoming)`,
  );
}

// --- API-Football squad photos (current roster) -----------------------------

async function ingestSquadPhotos() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    log("no API_FOOTBALL_KEY — skipping squad photos");
    return;
  }
  const host = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";
  log("fetching real squad photos from API-Football…");
  const json = await getJson(
    `https://${host}/players/squads?team=${PALMEIRAS_API_ID}`,
    { headers: { "x-apisports-key": key } },
  );
  const players = json?.response?.[0]?.players ?? [];
  if (players.length === 0) {
    log("squad fetch empty:", JSON.stringify(json?.errors));
    return;
  }
  const roster = players
    .map((p) => ({
      name: p.name,
      number: p.number ?? null,
      photo: safeUrl(p.photo),
    }))
    .filter((p) => p.name && p.photo !== "#");
  writeData("squad-photos.json", {
    origin: "api",
    source: "API-Football (현재 스쿼드 사진)",
    fetchedAt: new Date().toISOString(),
    roster,
  });
  log(`wrote data/squad-photos.json (${roster.length} players)`);
}

// --- main -------------------------------------------------------------------

async function step(name, fn) {
  try {
    await fn();
  } catch (err) {
    log(`${name} failed (keeping existing snapshot):`, err.message);
  }
}

async function main() {
  loadEnvLocal();
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  await step("news", ingestNews);
  await step("standings", ingestStandings);
  await step("matches", ingestMatches);
  await step("squad-photos", ingestSquadPhotos);
  log("done");
}

await main();
