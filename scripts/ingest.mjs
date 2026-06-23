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
const LIBERTADORES = {
  id: "libertadores",
  name: "CONMEBOL Libertadores",
  nameKo: "코파 리베르타도레스 (남미 챔피언스리그)",
  shortName: "Libertadores",
  kind: "continental",
};
const COPA_DO_BRASIL = {
  id: "copa-do-brasil",
  name: "Copa do Brasil",
  nameKo: "코파 두 브라질 (국내컵)",
  shortName: "Copa do Brasil",
  kind: "cup",
};

// Competitions to pull for Palmeiras (ESPN slug → domain CompetitionRef).
const MATCH_COMPETITIONS = [
  { slug: "bra.1", comp: BRASILEIRAO, window: true },
  { slug: "conmebol.libertadores", comp: LIBERTADORES, window: false },
  { slug: "bra.copa_do_brazil", comp: COPA_DO_BRASIL, window: false },
];

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

  const llm = await llmEnrichNews(
    fresh.map((p) => ({
      title: p.title,
      excerpt: p.description,
      source: p.source,
    })),
  );

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

  // Top scorers / assisters: API-Football (free plan allows up to 2024). The
  // names are stored raw; the app derives Korean deterministically. Reuse the
  // previous snapshot's leaders if the API is unavailable (quota/no key).
  const prevStandings = readData("standings.json");
  let topScorers = prevStandings?.topScorers || [];
  let topAssisters = prevStandings?.topAssisters || [];
  let leadersSeason = prevStandings?.leadersSeason;
  const key = process.env.API_FOOTBALL_KEY;
  if (key) {
    const host = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";
    const H = { headers: { "x-apisports-key": key } };
    const SEASON = "2024"; // free-plan ceiling
    const mapLeaders = (resp, metric) =>
      (resp?.response || []).slice(0, 5).map((r) => ({
        playerName: r.player?.name || "",
        playerNameKo: r.player?.name || "", // app overrides via koreanName()
        value:
          (r.statistics || []).reduce(
            (n, s) =>
              n +
              (metric === "assists"
                ? s.goals?.assists || 0
                : s.goals?.total || 0),
            0,
          ) || 0,
      }));
    try {
      const sc = await getJson(
        `https://${host}/players/topscorers?league=71&season=${SEASON}`,
        H,
      );
      const as = await getJson(
        `https://${host}/players/topassists?league=71&season=${SEASON}`,
        H,
      );
      const scMapped = mapLeaders(sc, "goals");
      const asMapped = mapLeaders(as, "assists");
      if (scMapped.length) {
        topScorers = scMapped;
        leadersSeason = SEASON;
      }
      if (asMapped.length) {
        topAssisters = asMapped;
        leadersSeason = SEASON;
      }
    } catch (err) {
      log("top scorers/assists fetch failed (keeping previous):", err.message);
    }
  }

  writeData("standings.json", {
    origin: "api",
    source: "ESPN (현재 시즌)",
    fetchedAt: new Date().toISOString(),
    season: String(data?.season?.year || new Date().getFullYear()),
    competition: BRASILEIRAO,
    table,
    topScorers,
    topAssisters,
    leadersSeason,
  });
  log(
    `wrote data/standings.json (${table.length} teams, ${topScorers.length} scorers)`,
  );
}

// --- ESPN matches (free, current) -------------------------------------------

function mapEvent(e, competition) {
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
    competition,
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

// Parse goal events from an ESPN match summary into domain MatchEvent[].
function parseGoals(summary, homeName, awayName) {
  const out = [];
  for (const e of summary?.keyEvents || []) {
    if (e.scoringPlay !== true) continue; // goals + scored penalties only
    const t = e.type?.text || "";
    const minute =
      parseInt(String(e.clock?.displayValue || "").replace(/\D/g, ""), 10) || 0;
    const teamName = e.team?.displayName || e.team?.abbreviation || "";
    const team = normTeam(teamName) === normTeam(awayName) ? "away" : "home";
    const people = (e.participants || e.athletesInvolved || [])
      .map((a) => (a.athlete?.displayName || a.displayName || "").trim())
      .filter(Boolean);
    if (people.length === 0) continue;
    out.push({
      minute,
      type: /penalty/i.test(t) ? "penalty" : "goal",
      team,
      player: people[0],
      detail: people[1] || undefined,
    });
  }
  return out.sort((a, b) => a.minute - b.minute);
}

async function ingestMatches() {
  log("fetching fixtures/results from ESPN (league + continental)…");
  const raw = []; // { e, comp, slug }
  for (const { slug, comp, window } of MATCH_COMPETITIONS) {
    try {
      const sch = await getJson(
        `${ESPN_BASE}/site/v2/sports/soccer/${slug}/teams/${PALMEIRAS_ESPN_ID}/schedule`,
      );
      for (const e of sch?.events || []) raw.push({ e, comp, slug });
    } catch (err) {
      log(`${slug} schedule failed:`, err.message);
    }
    // Forward scoreboard window (league only — the schedule omits unscheduled rounds).
    if (window) {
      try {
        const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
        const from = fmt(new Date(Date.now() - 7 * 86400000));
        const to = fmt(new Date(Date.now() + 75 * 86400000));
        const sb = await getJson(
          `${ESPN_BASE}/site/v2/sports/soccer/${slug}/scoreboard?dates=${from}-${to}`,
        );
        for (const e of sb?.events || []) {
          const has = (e.competitions?.[0]?.competitors || []).some(
            (c) => String(c.team?.id) === PALMEIRAS_ESPN_ID,
          );
          if (has) raw.push({ e, comp, slug });
        }
      } catch (err) {
        log(`${slug} scoreboard failed:`, err.message);
      }
    }
  }

  const seen = new Set();
  const items = [];
  const slugById = {};
  for (const { e, comp, slug } of raw) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    const item = mapEvent(e, comp);
    if (item) {
      items.push(item);
      slugById[item.id] = slug;
    }
  }
  if (items.length === 0) {
    log("ESPN matches empty — keeping existing/seed");
    return;
  }
  items.sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  // Goal scorers for finished matches (ESPN summary). Cache-aware (reuse prior
  // events) + bounded so we never hammer ESPN; steady-state runs fetch ~0-2.
  const prevMatches = readData("matches.json");
  const prevEvents = new Map(
    (prevMatches?.items || []).map((m) => [m.id, m.events]),
  );
  let summaryCalls = 0;
  for (const it of items) {
    if (it.status !== "finished") continue;
    const cached = prevEvents.get(it.id);
    if (cached && cached.length) {
      it.events = cached;
      continue;
    }
    if (summaryCalls >= 16) continue; // cap ESPN calls per run
    try {
      const eid = it.id.replace("espn-", "");
      const slug = slugById[it.id] || "bra.1";
      const sum = await getJson(
        `${ESPN_BASE}/site/v2/sports/soccer/${slug}/summary?event=${eid}`,
      );
      it.events = parseGoals(sum, it.home.name, it.away.name);
      summaryCalls += 1;
    } catch {
      /* leave events undefined — UI shows a placeholder */
    }
  }

  const upcoming = items.filter((m) => m.status !== "finished").length;
  const withGoals = items.filter((m) => m.events && m.events.length).length;
  writeData("matches.json", {
    origin: "api",
    source: "ESPN (현재 시즌)",
    fetchedAt: new Date().toISOString(),
    items,
  });
  log(
    `wrote data/matches.json (${items.length} matches, ${upcoming} upcoming, ${withGoals} with goals)`,
  );
}

// --- API-Football full real squad (current roster + 2024 stats) -------------

const POS_GROUP = {
  Goalkeeper: "GK",
  Defender: "DF",
  Midfielder: "MF",
  Attacker: "FW",
};
const POS_KO = { GK: "골키퍼", DF: "수비수", MF: "미드필더", FW: "공격수" };

const NAT = {
  Brazil: ["BR", "브라질"],
  Argentina: ["AR", "아르헨티나"],
  Uruguay: ["UY", "우루과이"],
  Paraguay: ["PY", "파라과이"],
  Colombia: ["CO", "콜롬비아"],
  Chile: ["CL", "칠레"],
  Venezuela: ["VE", "베네수엘라"],
  Ecuador: ["EC", "에콰도르"],
  Peru: ["PE", "페루"],
  Portugal: ["PT", "포르투갈"],
  Spain: ["ES", "스페인"],
  France: ["FR", "프랑스"],
  Mexico: ["MX", "멕시코"],
};
function natCode(n) {
  return NAT[n]?.[0] || "";
}
function natKo(n) {
  return NAT[n]?.[1] || n || "정보 없음";
}

function aggStats(detail) {
  const blocks = detail?.statistics || [];
  if (blocks.length === 0) return null;
  let apps = 0,
    goals = 0,
    assists = 0,
    yellow = 0,
    red = 0,
    minutes = 0;
  for (const b of blocks) {
    apps += b.games?.appearences || 0;
    goals += b.goals?.total || 0;
    assists += b.goals?.assists || 0;
    yellow += b.cards?.yellow || 0;
    red += b.cards?.red || 0;
    minutes += b.games?.minutes || 0;
  }
  return {
    season: "2024",
    competition: "전체",
    appearances: apps,
    goals,
    assists,
    yellowCards: yellow,
    redCards: red,
    minutes,
  };
}

async function ingestSquad() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    log("no API_FOOTBALL_KEY — skipping squad (app uses seed)");
    return;
  }
  const host = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";
  const H = { headers: { "x-apisports-key": key } };

  log("fetching real current squad from API-Football…");
  const sq = await getJson(
    `https://${host}/players/squads?team=${PALMEIRAS_API_ID}`,
    H,
  );
  const roster = sq?.response?.[0]?.players ?? [];
  if (roster.length === 0) {
    log("squad empty:", JSON.stringify(sq?.errors));
    return;
  }

  // Detailed records (nationality, birthdate, height, 2024 stats) — paginated.
  const detail = {};
  try {
    for (let page = 1; page <= 3; page += 1) {
      const pj = await getJson(
        `https://${host}/players?team=${PALMEIRAS_API_ID}&season=2024&page=${page}`,
        H,
      );
      for (const r of pj?.response || []) detail[r.player.id] = r;
      if (page >= (pj?.paging?.total || 1)) break;
    }
  } catch (err) {
    log("player detail fetch partial:", err.message);
  }

  // Cache from the previous run: reuse bio + Korean names to bound API/LLM use.
  const prevSquad = readData("squad.json");
  const cachedById = new Map(
    (prevSquad?.players || []).map((p) => [String(p.id), p]),
  );

  // For players whose nationality is still unknown, fetch their profile
  // (1 call each). Bounded so the free quota is never blown; the cache means
  // steady-state runs fetch ~0 profiles (squad rarely changes).
  const profile = {};
  let profileCalls = 0;
  for (const p of roster) {
    const known =
      detail[p.id]?.player?.nationality ||
      cachedById.get(String(p.id))?.nationality;
    if (known || profileCalls >= 30) continue;
    try {
      const pj = await getJson(
        `https://${host}/players/profiles?player=${p.id}`,
        H,
      );
      const pl = pj?.response?.[0]?.player;
      if (pl) {
        profile[p.id] = pl;
        profileCalls += 1;
      }
    } catch {
      /* skip — stays unknown */
    }
  }
  log(`fetched ${profileCalls} player profiles`);

  // NOTE: Korean names are NOT generated here. The app derives them
  // deterministically from `name` via src/lib/i18n/ptKo.ts (curated map + rule
  // engine) — stable & correct regardless of any LLM. We store the raw name as
  // a placeholder; the squad adapter overrides nameKo via koreanName().
  const players = roster.map((p) => {
    const d = detail[p.id];
    const prof = profile[p.id];
    const cached = cachedById.get(String(p.id));
    const grp = POS_GROUP[p.position] || "MF";
    const nat = d?.player?.nationality || prof?.nationality || "";
    const heightStr = d?.player?.height || prof?.height || "";
    const height = parseInt(String(heightStr).replace(/\D/g, ""), 10);
    const birthDate =
      d?.player?.birth?.date || prof?.birth?.date || cached?.birthDate;
    const stats = aggStats(d);
    return {
      id: String(p.id),
      name: p.name,
      nameKo: p.name,
      number: p.number ?? undefined,
      positionGroup: grp,
      position: p.position || POS_KO[grp],
      positionKo: POS_KO[grp],
      nationality: natCode(nat) || cached?.nationality || "",
      nationalityKo: nat ? natKo(nat) : cached?.nationalityKo || "정보 없음",
      birthDate: birthDate || undefined,
      heightCm:
        Number.isFinite(height) && height > 0 ? height : cached?.heightCm,
      photo: safeUrl(p.photo) !== "#" ? safeUrl(p.photo) : undefined,
      availability: "available",
      stats: stats ? [stats] : cached?.stats,
    };
  });

  // Real current head coach. Fall back to cache, then to the known current
  // coach (Abel Ferreira), so the UI never shows an empty placeholder.
  let coach =
    prevSquad?.coach && prevSquad.coach.name !== "정보 없음"
      ? prevSquad.coach
      : {
          id: "coach",
          name: "Abel Ferreira",
          nameKo: "아벨 페레이라",
          nationality: "PT",
          nationalityKo: "포르투갈",
          birthDate: "1978-12-22",
          role: "Head Coach",
          roleKo: "감독",
        };
  try {
    const cj = await getJson(
      `https://${host}/coachs?team=${PALMEIRAS_API_ID}`,
      H,
    );
    const current =
      (cj?.response || []).find((c) =>
        (c.career || []).some((k) => k.team?.id === PALMEIRAS_API_ID && !k.end),
      ) || cj?.response?.[0];
    if (current) {
      coach = {
        id: "coach",
        name: current.name,
        nameKo: current.name, // app overrides via koreanName()
        nationality: natCode(current.nationality),
        nationalityKo: natKo(current.nationality),
        birthDate: current.birth?.date || undefined,
        role: "Head Coach",
        roleKo: "감독",
      };
    }
  } catch (err) {
    log("coach fetch failed:", err.message);
  }

  const withPhoto = players.filter((p) => p.photo).length;
  const withStats = players.filter((p) => p.stats).length;
  writeData("squad.json", {
    origin: "api",
    source: "API-Football 현재 스쿼드",
    fetchedAt: new Date().toISOString(),
    statsSeason: "2024",
    players,
    coach,
  });
  log(
    `wrote data/squad.json (${players.length} players, ${withPhoto} photos, ${withStats} w/ 2024 stats, coach: ${coach.nameKo})`,
  );
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
  await step("squad", ingestSquad);
  log("done");
}

await main();
