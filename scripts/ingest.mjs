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

import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { llmEnrichNews, llmEnabled, llmModelLabel } from "./llm.mjs";
import { fetchEspnRoster, enrichSquadWithEspn } from "./espn-squad.mjs";
import {
  PALMEIRAS_API_ID,
  PALMEIRAS_ESPN_ID,
  ESPN_BASE,
  LEAGUE_SLUG,
  API_FOOTBALL_SEASON,
  BRASILEIRAO,
  MATCH_COMPETITIONS,
  CONTINENTAL_CAMPAIGNS,
  DEFAULT_NEWS_QUERY,
  NEWS_FETCH_MAX,
  NEWS_RETENTION_DAYS,
  NEWS_ARCHIVE_MAX,
  NEWS_EXTRA_FEEDS,
  googleNewsRssUrl,
  topSquadPlayerNames,
  buildPlayerNewsQuery,
  natCode,
  natKo,
} from "./pipeline-config.mjs";

const DATA_DIR = join(process.cwd(), "data");
const NEWS_QUERY = process.env.NEWS_QUERY ?? DEFAULT_NEWS_QUERY;
const ENABLE_MT = process.env.DISABLE_MT !== "1";
const FETCH_TIMEOUT_MS = 12000;
const MAX_BYTES = 2_000_000;

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

// --- Team name normalization ------------------------------------------------
// Korean team NAMES are intentionally NOT mapped here: the app re-derives every
// team's Korean name deterministically from the English name via
// src/lib/i18n/ptKo.ts (koreanTeamName), and overrides whatever the snapshot
// carries. So the pipeline stores the English name as the nameKo placeholder
// (exactly as it already does for player names) instead of maintaining a second,
// drift-prone transliteration map. `normTeam` is still needed to match an
// event's team to home/away by name.

function normTeam(name) {
  return (name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Real club crest from ESPN's CDN (free, used for identification; the UI falls
// back to a monogram if it ever fails to load).
function teamLogo(espnTeam) {
  const href =
    espnTeam.logos?.find((l) => !/dark/i.test(l.href || ""))?.href ||
    espnTeam.logos?.[0]?.href ||
    espnTeam.logo;
  const safe = safeUrl(href);
  return safe !== "#" ? safe : undefined;
}

function teamRef(espnTeam) {
  const name = espnTeam.displayName || espnTeam.name || espnTeam.abbreviation;
  const crest = teamLogo(espnTeam);
  const isPalmeiras =
    String(espnTeam.id) === PALMEIRAS_ESPN_ID || /palmeiras/i.test(name);
  if (isPalmeiras) {
    return {
      id: "palmeiras",
      name: "Palmeiras",
      nameKo: "파우메이라스",
      crest: crest || "/teams/palmeiras/crest.svg",
    };
  }
  // nameKo is a placeholder; the app re-derives it via koreanTeamName(name).
  return { id: String(espnTeam.id), name, nameKo: name, crest };
}

function mapStatus(state) {
  if (state === "pre") return "scheduled";
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "scheduled";
}

// --- news ingest ------------------------------------------------------------

/** Parse RSS <item> blocks (Google News OR a generic feed) into news rows. The
 *  per-item <source> (Google News) wins; otherwise the feed's name is used. */
export function parseFeedItems(xml, fallbackSource) {
  const blocks = [...String(xml).matchAll(/<item>[\s\S]*?<\/item>/gi)].map(
    (m) => m[0],
  );
  const out = [];
  for (const block of blocks) {
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
      : fallbackSource;
    const description = pick(block, ["description"]) ?? "";
    out.push({ title, url, publishedAt, source, description });
  }
  return out;
}

/** Normalize a headline for cross-source dedup (same story, different outlet). */
function normTitle(t) {
  return String(t || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

/** Dedup merged feed rows by URL then by normalized title, newest first. */
export function dedupeParsed(items) {
  const seenUrl = new Set();
  const seenTitle = new Set();
  const out = [];
  const sorted = [...items].sort((a, b) =>
    String(b.publishedAt).localeCompare(String(a.publishedAt)),
  );
  for (const it of sorted) {
    const u = it.url && it.url !== "#" ? it.url : "";
    const t = normTitle(it.title);
    if ((u && seenUrl.has(u)) || (t && seenTitle.has(t))) continue;
    if (u) seenUrl.add(u);
    if (t) seenTitle.add(t);
    out.push(it);
  }
  return out;
}

/** Build the ordered list of news sources: club Google News query + a
 *  squad-derived player-anchored query + any operator-configured extra feeds. */
function newsSources(squad) {
  const sources = [
    { name: "news.google.com", url: googleNewsRssUrl(NEWS_QUERY) },
  ];
  const playerQuery = buildPlayerNewsQuery(topSquadPlayerNames(squad));
  if (playerQuery) {
    sources.push({
      name: "news.google.com",
      url: googleNewsRssUrl(playerQuery),
    });
  }
  for (const url of NEWS_EXTRA_FEEDS) {
    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      /* keep raw */
    }
    sources.push({ name: host, url });
  }
  return sources;
}

async function ingestNews() {
  // Cache: reuse Korean fields for URLs we've already processed.
  const prev = readData("news.json");
  const prevByUrl = new Map((prev?.items || []).map((it) => [it.url, it]));

  // Multi-source: club query + squad-derived player query (+ any extra feeds).
  // Each source fails independently (never throws) so one bad feed can't break
  // the run. Results are merged + de-duplicated across sources.
  const squad = readData("squad.json");
  const sources = newsSources(squad);
  const collected = [];
  for (const src of sources) {
    try {
      const xml = await getText(src.url);
      const items = parseFeedItems(xml, src.name);
      collected.push(...items);
      log(`news source ok (${src.name}): ${items.length} items`);
    } catch (err) {
      log(`news source failed (${src.name}): ${err.message}`);
    }
  }
  // Dedup across sources, then cap how many we ENRICH this run (bounds LLM/MT).
  const parsed = dedupeParsed(collected).slice(0, NEWS_FETCH_MAX);
  log(
    `found ${collected.length} raw across ${sources.length} source(s) → ${parsed.length} unique`,
  );

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

  // Rolling archive: union this run's parse with the previously-stored items so
  // articles that have aged out of the RSS window don't simply vanish, then
  // expire anything past the retention window and cap the total (newest-first).
  const archived = mergeNewsArchive(items, prev?.items || []);

  writeData("news.json", {
    origin: "rss",
    source: llmEnabled()
      ? `Google News RSS + LLM(${llmModelLabel()}) 요약`
      : "news.google.com (Google News RSS)",
    fetchedAt: new Date().toISOString(),
    items: archived,
  });
  log(
    `wrote data/news.json (${archived.length} items archived; ${items.length} from this fetch)`,
  );
}

/**
 * Merge a fresh RSS parse with the previously-stored archive into a bounded,
 * de-duplicated, retention-windowed list (newest first). Pure + `now`-injectable
 * for tests. Fresh entries win on URL collision (re-enriched/refreshed); previous
 * entries still inside the retention window are kept so an article doesn't
 * disappear the moment it falls out of Google News' recent window.
 */
export function mergeNewsArchive(fresh, previous, now = Date.now()) {
  const byUrl = new Map();
  for (const it of fresh) byUrl.set(it.url, it);
  for (const old of previous) if (!byUrl.has(old.url)) byUrl.set(old.url, old);
  const cutoff = now - NEWS_RETENTION_DAYS * 86400000;
  return [...byUrl.values()]
    .filter((it) => {
      const t = new Date(it.publishedAt).getTime();
      // Keep when within the window; also keep if the date is unparseable (don't
      // silently drop an item just because its timestamp is malformed).
      return Number.isFinite(t) ? t >= cutoff : true;
    })
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, NEWS_ARCHIVE_MAX);
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
  const data = await getJson(
    `${ESPN_BASE}/v2/sports/soccer/${LEAGUE_SLUG}/standings`,
  );
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
      crest: ref.crest,
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

  // Individual scorer/assist records are shown on the standings page from the
  // CURRENT-season squad snapshot (ESPN), so we don't fetch a stale league-wide
  // 2024 list from API-Football here (keeps the data honest + drops an API
  // call). The standings snapshot therefore carries only the table.
  writeData("standings.json", {
    origin: "api",
    source: "ESPN (현재 시즌)",
    fetchedAt: new Date().toISOString(),
    season: String(data?.season?.year || new Date().getFullYear()),
    competition: BRASILEIRAO,
    table,
  });
  log(`wrote data/standings.json (${table.length} teams)`);
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
  // Attach the score for LIVE matches too, not just finished ones — otherwise an
  // in-progress game shows no scoreline on the home "지금 진행 중" card.
  if (
    (status === "finished" || status === "live") &&
    Number.isFinite(hs) &&
    Number.isFinite(as)
  ) {
    item.score = { home: hs, away: as };
  }
  return item;
}

// Parse an ESPN clock ("45'", "90'+2'") into a sortable minute + display string.
export function parseClock(e) {
  const dv = String(e.clock?.displayValue || "").trim();
  const m = dv.match(/(\d+)(?:'?\s*\+\s*(\d+))?/);
  const base = m ? parseInt(m[1], 10) : 0;
  const added = m && m[2] ? parseInt(m[2], 10) : 0;
  return { minute: base + added, clock: dv || undefined };
}

// Parse ALL notable key events (goals, penalties, cards, subs) from an ESPN
// match summary into domain MatchEvent[], minute-ordered. For subs, ESPN lists
// the incoming player first and the outgoing player second.
export function parseKeyEvents(summary, homeName, awayName) {
  const out = [];
  for (const e of summary?.keyEvents || []) {
    const t = e.type?.text || "";
    let type;
    if (e.scoringPlay === true) {
      type = /penalty/i.test(t) ? "penalty" : "goal";
    } else if (/yellow/i.test(t)) {
      type = "yellow";
    } else if (/red/i.test(t)) {
      type = "red";
    } else if (/substitution/i.test(t)) {
      type = "sub";
    } else {
      continue; // skip kickoff/halftime/full-time markers
    }
    const { minute, clock } = parseClock(e);
    const teamName = e.team?.displayName || e.team?.abbreviation || "";
    const team = normTeam(teamName) === normTeam(awayName) ? "away" : "home";
    const people = (e.participants || e.athletesInvolved || [])
      .map((a) => (a.athlete?.displayName || a.displayName || "").trim())
      .filter(Boolean);
    if (people.length === 0) continue; // need at least the primary player
    out.push({
      minute,
      clock,
      type,
      team,
      // goal: detail = assister · sub: player = ON, detail = OFF · card: no detail
      player: people[0],
      detail: type === "red" || type === "yellow" ? undefined : people[1],
    });
  }
  return out.sort((a, b) => a.minute - b.minute);
}

// Bucket an ESPN position abbreviation into a pitch line for the formation view.
export function lineForPos(pos) {
  const p = (pos || "").toUpperCase();
  if (!p || p === "SUB") return "MID"; // bench (line unused for layout)
  if (/^G/.test(p)) return "GK";
  if (/^(F|CF|ST|SS|LF|RF|LW|RW)/.test(p)) return "FWD";
  if (/^(CB|CD|LB|RB|LWB|RWB|SW)/.test(p) || p === "D") return "DEF";
  return "MID";
}

// Parse starting lineups + bench + formation from an ESPN summary `rosters`.
// Returns undefined when not provided (so the UI shows an honest placeholder).
//
// ESPN quirk: a team's roster can carry a STRAY duplicate-name athlete row
// (different id, `starter:true`, but NO formationPlace) alongside the real XI.
// So the reliable "on the pitch from kickoff" signal is a formationPlace of
// 1..11 — NOT the `starter` flag. ESPN marks the actual matchday bench with
// position "SUB", which also cleanly excludes the stray row.
export function parseLineups(summary) {
  const rosters = summary?.rosters;
  if (!Array.isArray(rosters) || rosters.length < 2) return undefined;
  const slotOf = (p) => {
    const n = Number(p.formationPlace);
    return Number.isFinite(n) && n >= 1 && n <= 11 ? n : undefined;
  };
  const isSub = (p) =>
    /sub/i.test(p.position?.abbreviation || p.position?.name || "");
  const mk = (p, starter) => {
    const name = (p.athlete?.displayName || "").trim();
    const posAbbr = p.position?.abbreviation || p.position?.name || undefined;
    return {
      name,
      nameKo: name, // adapter overrides via koreanName()
      number: p.jersey != null ? Number(p.jersey) : undefined,
      pos: posAbbr,
      line: lineForPos(posAbbr),
      starter,
      formationPlace: slotOf(p),
      subbedOut: (p.subbedOut?.didSub ?? p.subbedOut) === true,
      subbedIn: (p.subbedIn?.didSub ?? p.subbedIn) === true,
    };
  };
  const teamLineup = (r) => {
    const named = (r.roster || []).filter((p) =>
      (p.athlete?.displayName || "").trim(),
    );
    const hasSlots = named.some((p) => slotOf(p) !== undefined);
    let starters;
    if (hasSlots) {
      // One player per formation slot (drops the slotless stray row).
      const bySlot = new Map();
      for (const p of named) {
        const slot = slotOf(p);
        if (slot === undefined) continue;
        if (!bySlot.has(slot)) bySlot.set(slot, mk(p, true));
      }
      starters = [...bySlot.values()];
    } else {
      // Fallback (no slots provided): trust the starter flag, dedupe by id.
      const seen = new Set();
      starters = [];
      for (const p of named) {
        if (p.starter !== true) continue;
        const id = String(p.athlete?.id ?? p.athlete?.displayName);
        if (seen.has(id)) continue;
        seen.add(id);
        starters.push(mk(p, true));
      }
    }
    // Bench = explicit substitutes only (excludes any stray duplicate row).
    const bench = named
      .filter((p) => slotOf(p) === undefined && isSub(p))
      .map((p) => mk(p, false));
    if (starters.length === 0) return null;
    return {
      side: r.homeAway === "away" ? "away" : "home",
      formation: r.formation || undefined,
      starters,
      bench,
    };
  };
  const home = rosters.find((r) => r.homeAway === "home");
  const away = rosters.find((r) => r.homeAway === "away");
  if (!home || !away) return undefined;
  const hl = teamLineup(home);
  const al = teamLineup(away);
  if (!hl || !al) return undefined;
  return { home: hl, away: al };
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

  // Events + lineups for finished/live matches (one ESPN summary call each).
  // Cache-aware (reuse prior events AND lineups) + bounded so we never hammer
  // ESPN; steady-state runs fetch ~0-2. The per-run cap is configurable
  // (MATCH_SUMMARY_CAP) so a one-time local backfill can enrich the whole
  // season in a single run while CI stays bounded.
  const prevMatches = readData("matches.json");
  const prevEvents = new Map(
    (prevMatches?.items || []).map((m) => [m.id, m.events]),
  );
  const prevLineups = new Map(
    (prevMatches?.items || []).map((m) => [m.id, m.lineups]),
  );
  const SUMMARY_CAP = Number(process.env.MATCH_SUMMARY_CAP) || 16;
  let summaryCalls = 0;
  for (const it of items) {
    const isLive = it.status === "live";
    if (it.status !== "finished" && !isLive) continue;
    const cachedEv = prevEvents.get(it.id);
    const cachedLu = prevLineups.get(it.id);
    // Finished matches never change → reuse cache ONCE both events AND lineups
    // are present (so already-enriched matches stay cached, but matches still
    // missing lineups get re-fetched a single time). LIVE matches change every
    // few minutes → always re-fetch (skip the cache).
    if (!isLive && cachedEv && cachedEv.length && cachedLu) {
      it.events = cachedEv;
      it.lineups = cachedLu;
      continue;
    }
    if (summaryCalls >= SUMMARY_CAP) continue; // cap ESPN calls per run
    try {
      const eid = it.id.replace("espn-", "");
      const slug = slugById[it.id] || LEAGUE_SLUG;
      const sum = await getJson(
        `${ESPN_BASE}/site/v2/sports/soccer/${slug}/summary?event=${eid}`,
      );
      it.events = parseKeyEvents(sum, it.home.name, it.away.name);
      const lu = parseLineups(sum);
      if (lu) it.lineups = lu;
      else if (cachedLu) it.lineups = cachedLu;
      summaryCalls += 1;
    } catch {
      // Keep whatever we had cached; UI shows a placeholder otherwise.
      if (cachedEv) it.events = cachedEv;
      if (cachedLu) it.lineups = cachedLu;
    }
  }

  const upcoming = items.filter((m) => m.status !== "finished").length;
  const withGoals = items.filter((m) => m.events && m.events.length).length;
  const withLineups = items.filter((m) => m.lineups).length;
  writeData("matches.json", {
    origin: "api",
    source: "ESPN (현재 시즌)",
    fetchedAt: new Date().toISOString(),
    items,
  });
  log(
    `wrote data/matches.json (${items.length} matches, ${upcoming} upcoming, ${withGoals} with events, ${withLineups} with lineups)`,
  );
}

// --- ESPN continental / cup campaigns (free, current) -----------------------
// The league has a full table (ingestStandings). The continental Libertadores
// and the domestic Copa do Brasil are group+knockout / pure-knockout, so they
// get their own snapshot: the tracked team's group mini-table (when applicable)
// plus the knockout tie(s) it is in. Sourced keylessly from ESPN:
//   • /standings           → group tables (Libertadores)
//   • /scoreboard?dates=…  → current round name + the team's tie legs
// Bounded to a handful of calls per run; the snapshot is cached otherwise.
// (CONTINENTAL_CAMPAIGNS is defined in pipeline-config.mjs.)

// Map an ESPN round name OR per-event slug to a Korean knockout-round label.
// Returns null for anything not cleanly known (caller shows an honest generic
// label rather than guessing a wrong round number).
export function roundKo(nameOrSlug) {
  const k = String(nameOrSlug || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const MAP = {
    final: "결승",
    finalstage: "결승",
    thirdplace: "3·4위전",
    semifinals: "4강",
    semifinal: "4강",
    quarterfinals: "8강",
    quarterfinal: "8강",
    roundof16: "16강",
    roundof32: "32강",
    groupstage: "조별리그",
    group: "조별리그",
    knockoutroundplayoffs: "플레이오프",
    playoffs: "플레이오프",
    playoff: "플레이오프",
  };
  return MAP[k] || null;
}

// "Group F" → "F조".
export function groupNameKo(name) {
  const m = String(name || "").match(/group\s+([A-Z0-9]+)/i);
  return m ? `${m[1].toUpperCase()}조` : name || "조별리그";
}

// Find the tracked team's group in an ESPN standings payload and build its
// mini-table. Returns null when Palmeiras isn't in any group (off-season etc.).
export function parsePalmeirasGroup(standings) {
  const groups = standings?.children || [];
  for (const g of groups) {
    const entries = g.standings?.entries || [];
    const inHere = entries.some(
      (e) =>
        String(e.team?.id) === PALMEIRAS_ESPN_ID ||
        /palmeiras/i.test(e.team?.displayName || ""),
    );
    if (!inHere) continue;
    const table = entries
      .map((e, i) => {
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
          crest: ref.crest,
          played: stat(e, ["gamesPlayed"]),
          won,
          drawn,
          lost,
          goalsFor: gf,
          goalsAgainst: ga,
          goalDifference: stat(e, ["pointDifferential"]) || gf - ga,
          points: stat(e, ["points"]),
          isTracked: ref.id === "palmeiras",
        };
      })
      .sort((a, b) => a.rank - b.rank);
    if (table.length === 0) return null;
    return { nameKo: groupNameKo(g.name), table };
  }
  return null;
}

// Korean leg label from an ESPN tie note ("1st Leg" / "2nd Leg - …").
function legLabelKo(note, idx, total) {
  if (/1st leg/i.test(note)) return "1차전";
  if (/2nd leg/i.test(note)) return "2차전";
  if (total <= 1) return "단판";
  return `${idx + 1}차전`;
}

// Parse an ESPN aggregate/decider note into who advanced + a Korean outcome.
// Handles "X advance N-M on aggregate", penalties, and away-goals phrasing.
// Returns null while a tie is undecided (e.g. "Tied on aggregate").
export function parseAggregateNote(note) {
  const s = String(note || "");
  const agg = s.match(
    /([A-Za-zÀ-ÿ0-9 .'-]+?)\s+(?:advance|advances|win|wins)\b[^0-9]*?(\d+)\D+(\d+)\s+on aggregate/i,
  );
  if (agg) {
    const trackedAdvanced = /palmeiras/i.test(agg[1]);
    return {
      trackedAdvanced,
      outcomeKo: `합산 ${agg[2]}-${agg[3]} ${trackedAdvanced ? "승 · 진출" : "패 · 탈락"}`,
    };
  }
  const pen = s.match(
    /([A-Za-zÀ-ÿ0-9 .'-]+?)\s+(?:advance|advances|win|wins)\b[^.]*penalt/i,
  );
  if (pen) {
    const trackedAdvanced = /palmeiras/i.test(pen[1]);
    return {
      trackedAdvanced,
      outcomeKo: `승부차기 ${trackedAdvanced ? "승 · 진출" : "패 · 탈락"}`,
    };
  }
  return null;
}

// Build a CampaignTie from the 1-2 ESPN scoreboard events that make up one tie
// (same round, same opponent). `roundLabelKo` is the resolved Korean round name.
export function buildCampaignTie(events, roundLabelKo) {
  const sorted = [...events].sort((a, b) =>
    String(a.date || "").localeCompare(String(b.date || "")),
  );
  let opponent = null;
  let result = "ongoing";
  let outcomeKo;
  const legs = [];
  sorted.forEach((e, idx) => {
    const c = e.competitions?.[0];
    const comps = c?.competitors || [];
    const tracked = comps.find((x) => String(x.team?.id) === PALMEIRAS_ESPN_ID);
    const opp = comps.find((x) => String(x.team?.id) !== PALMEIRAS_ESPN_ID);
    if (!tracked || !opp) return;
    if (!opponent) opponent = teamRef(opp.team);
    const home = comps.find((x) => x.homeAway === "home");
    const away = comps.find((x) => x.homeAway === "away");
    const hs = Number(home?.score?.value ?? home?.score);
    const as = Number(away?.score?.value ?? away?.score);
    const status = mapStatus(c.status?.type?.state);
    const note = (c.notes || []).map((n) => n.headline).join("; ");
    const leg = {
      kickoff: e.date,
      venue: tracked.homeAway === "home" ? "home" : "away",
      legKo: legLabelKo(note, idx, sorted.length),
      status,
      trackedHome: tracked.homeAway === "home",
      matchId: `espn-${e.id}`,
    };
    if (
      (status === "finished" || status === "live") &&
      Number.isFinite(hs) &&
      Number.isFinite(as)
    ) {
      leg.score = { home: hs, away: as };
    }
    legs.push(leg);
    const decided = parseAggregateNote(note);
    if (decided) {
      result = decided.trackedAdvanced ? "advanced" : "eliminated";
      outcomeKo = decided.outcomeKo;
    }
  });
  if (!opponent || legs.length === 0) return null;
  return {
    roundKo: roundLabelKo,
    opponentId: opponent.id,
    opponentName: opponent.name,
    opponentNameKo: opponent.nameKo,
    opponentCrest: opponent.crest,
    legs,
    result,
    outcomeKo,
  };
}

// Group a competition's Palmeiras scoreboard events into knockout ties keyed by
// (round, opponent), then split into the current round vs concluded past ties.
function buildCampaignKnockout(sb) {
  const cur = sb?.leagues?.[0]?.season?.type;
  const currentType = cur ? String(cur.type ?? cur.id) : null;
  const currentRoundKo =
    roundKo(cur?.name) || roundKo(cur?.slug) || cur?.name || "토너먼트";

  // Bucket Palmeiras events by per-event round, then by opponent within it.
  // Group-stage games are excluded — they're shown as the group table, not as
  // knockout ties (and a forward scoreboard window only catches some of them).
  const byRound = new Map();
  for (const e of sb?.events || []) {
    const slug = e.season?.slug || "";
    if (/group/i.test(slug) || roundKo(slug) === "조별리그") continue;
    const c = e.competitions?.[0];
    const comps = c?.competitors || [];
    const tracked = comps.find((x) => String(x.team?.id) === PALMEIRAS_ESPN_ID);
    const opp = comps.find((x) => String(x.team?.id) !== PALMEIRAS_ESPN_ID);
    if (!tracked || !opp) continue;
    const rtype = String(e.season?.type ?? "");
    const key = `${rtype}|${opp.team?.id}`;
    if (!byRound.has(key)) byRound.set(key, { rtype, slug, events: [] });
    byRound.get(key).events.push(e);
  }

  let currentRound;
  const path = [];
  for (const { rtype, slug, events } of byRound.values()) {
    const isCurrent = currentType && rtype === currentType;
    const label = isCurrent ? currentRoundKo : roundKo(slug) || "이전 라운드";
    const tie = buildCampaignTie(events, label);
    if (!tie) continue;
    if (isCurrent) currentRound = tie;
    else path.push(tie);
  }
  // Past ties chronological by their first leg.
  path.sort((a, b) =>
    String(a.legs[0]?.kickoff || "").localeCompare(
      String(b.legs[0]?.kickoff || ""),
    ),
  );
  return { currentRound, path };
}

// Forward-looking scoreboard window (covers a tie's two legs around "now").
function campaignWindow(now = Date.now()) {
  const fmt = (ms) => new Date(ms).toISOString().slice(0, 10).replace(/-/g, "");
  return `${fmt(now - 60 * 86400000)}-${fmt(now + 150 * 86400000)}`;
}

async function ingestCompetitions() {
  log("fetching continental/cup campaigns from ESPN…");
  const campaigns = [];
  let season = String(new Date().getFullYear());
  for (const { slug, comp, hasGroups, advanceCount } of CONTINENTAL_CAMPAIGNS) {
    const campaign = {
      competition: comp,
      format: hasGroups ? "group+knockout" : "knockout",
    };
    // 1) Group mini-table (continental group stage).
    if (hasGroups) {
      try {
        const st = await getJson(
          `${ESPN_BASE}/v2/sports/soccer/${slug}/standings`,
        );
        if (st?.season?.year) season = String(st.season.year);
        const group = parsePalmeirasGroup(st);
        if (group) {
          group.advanceCount = advanceCount;
          const me = group.table.find((r) => r.isTracked);
          if (me) {
            const advanced = me.rank <= advanceCount;
            group.qualifiedKo = advanced
              ? `조 ${me.rank}위로 토너먼트 진출`
              : `조 ${me.rank}위 · 토너먼트 진출 실패 (상위 ${advanceCount}팀)`;
          }
          campaign.group = group;
        }
      } catch (err) {
        log(`${slug} standings failed:`, err.message);
      }
    }
    // 2) Knockout: current round + concluded ties, from the scoreboard window.
    try {
      const sb = await getJson(
        `${ESPN_BASE}/site/v2/sports/soccer/${slug}/scoreboard?dates=${campaignWindow()}`,
      );
      if (sb?.leagues?.[0]?.season?.year) {
        season = String(sb.leagues[0].season.year);
      }
      const { currentRound, path } = buildCampaignKnockout(sb);
      if (currentRound) campaign.currentRound = currentRound;
      if (path.length) campaign.path = path;
    } catch (err) {
      log(`${slug} scoreboard failed:`, err.message);
    }
    // Only include a competition we actually have real data for.
    if (campaign.group || campaign.currentRound || campaign.path?.length) {
      campaigns.push(campaign);
    }
  }

  if (campaigns.length === 0) {
    log("no competition data — keeping existing/seed");
    return;
  }
  writeData("competitions.json", {
    origin: "api",
    source: "ESPN (현재 시즌)",
    fetchedAt: new Date().toISOString(),
    season,
    campaigns,
  });
  const summary = campaigns
    .map(
      (c) =>
        `${c.competition.shortName}[${c.group ? "group" : ""}${c.currentRound ? "+R" : ""}${c.path?.length ? "+" + c.path.length + "past" : ""}]`,
    )
    .join(", ");
  log(`wrote data/competitions.json (${campaigns.length}: ${summary})`);
}

// --- Real squad (API-Football roster + ESPN current-season stats) -----------

const POS_GROUP = {
  Goalkeeper: "GK",
  Defender: "DF",
  Midfielder: "MF",
  Attacker: "FW",
};
const POS_KO = { GK: "골키퍼", DF: "수비수", MF: "미드필더", FW: "공격수" };

// natCode/natKo + the NATIONALITY map live in pipeline-config.mjs (shared with
// espn-squad.mjs so the two never drift, e.g. a missing "Bolivia").

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
    season: API_FOOTBALL_SEASON,
    competition: "전체",
    appearances: apps,
    goals,
    assists,
    yellowCards: yellow,
    redCards: red,
    minutes,
  };
}

/** Strip a previously-appended " + ESPN …" suffix to recover the base source. */
function baseSourceOf(snap) {
  return (snap?.source || "스쿼드 스냅샷").split(" + ESPN")[0];
}

/**
 * Refresh current-season stats from the keyless ESPN roster, then write
 * squad.json. Runs for both the API-Football path (key present) and the
 * cached-roster path (no key), so the squad always shows the CURRENT season's
 * appearances/goals/assists instead of API-Football's free-plan 2024 ceiling.
 */
async function enrichAndWriteSquad(players, coach, baseSource) {
  // Default only used if ESPN enrichment below fails; the live path overwrites
  // it with ESPN's actual current season.
  let statsSeason = API_FOOTBALL_SEASON;
  let source = baseSource;
  let outPlayers = players;
  try {
    const { athletes, season } = await fetchEspnRoster();
    const r = enrichSquadWithEspn(players, athletes, season);
    outPlayers = r.players;
    statsSeason = season;
    source = `${baseSource} + ESPN ${season} 시즌 스탯`;
    log(
      `ESPN stats: matched ${r.matched}/${outPlayers.length}, nat+${r.natFilled}, dob+${r.dobFilled}`,
    );
    // Cross-check warning: players on API-Football but NOT corroborated by ESPN.
    // The app-side integrity gate (src/lib/data/squad-integrity.ts) flags/hides
    // these — surfacing them here makes a feed phantom visible in CI logs.
    if (r.unmatched?.length) {
      log(
        `⚠ ESPN cross-check: ${r.unmatched.length} single-feed player(s) (review for phantoms):`,
        r.unmatched
          .map((u) => `${u.name}${u.number ? ` #${u.number}` : ""}`)
          .join(", "),
      );
    }
  } catch (err) {
    log("ESPN stats enrichment failed (keeping existing stats):", err.message);
  }
  const withPhoto = outPlayers.filter((p) => p.photo).length;
  const withStats = outPlayers.filter((p) => p.stats && p.stats.length).length;
  writeData("squad.json", {
    origin: "api",
    source,
    fetchedAt: new Date().toISOString(),
    statsSeason,
    players: outPlayers,
    coach,
  });
  log(
    `wrote data/squad.json (${outPlayers.length} players, ${withPhoto} photos, ${withStats} w/ ${statsSeason} stats, coach: ${coach.nameKo})`,
  );
}

/**
 * Keep squad.json fresh from the cached roster + keyless ESPN current-season
 * stats. Used whenever API-Football is absent OR unavailable/empty, so the squad
 * snapshot never silently goes stale (which is what froze it for 31 h: the keyed
 * path returned early on an empty API-Football response and skipped this refresh).
 * Returns true when it wrote a snapshot.
 */
async function refreshSquadFromCache(reason) {
  const prevSquad = readData("squad.json");
  if (!prevSquad?.players?.length || !prevSquad.coach) {
    log(`${reason} and no cached squad — skipping (app uses seed)`);
    return false;
  }
  log(`${reason} — refreshing ESPN current-season stats on cached squad`);
  await enrichAndWriteSquad(
    prevSquad.players,
    prevSquad.coach,
    baseSourceOf(prevSquad),
  );
  return true;
}

async function ingestSquad() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    await refreshSquadFromCache("no API_FOOTBALL_KEY");
    return;
  }
  const host = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";
  const H = { headers: { "x-apisports-key": key } };

  log("fetching real current squad from API-Football…");
  let roster = [];
  try {
    const sq = await getJson(
      `https://${host}/players/squads?team=${PALMEIRAS_API_ID}`,
      H,
    );
    roster = sq?.response?.[0]?.players ?? [];
    if (roster.length === 0) {
      log("API-Football squad empty:", JSON.stringify(sq?.errors));
    }
  } catch (err) {
    log("API-Football squad fetch failed:", err.message);
  }
  if (roster.length === 0) {
    // API-Football down / empty / out of quota → DON'T leave squad.json stale.
    // Refresh current-season stats from the keyless ESPN source on the cached
    // roster instead, so the snapshot's fetchedAt + stats stay current.
    await refreshSquadFromCache("API-Football squad unavailable");
    return;
  }

  // Detailed records (nationality, birthdate, height, season stats) — paginated.
  const detail = {};
  try {
    for (let page = 1; page <= 3; page += 1) {
      const pj = await getJson(
        `https://${host}/players?team=${PALMEIRAS_API_ID}&season=${API_FOOTBALL_SEASON}&page=${page}`,
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

  await enrichAndWriteSquad(players, coach, "API-Football 스쿼드");
}

// --- main -------------------------------------------------------------------

async function step(name, fn) {
  try {
    await fn();
  } catch (err) {
    log(`${name} failed (keeping existing snapshot):`, err.message);
  }
}

// Live (match-window) mode — invoked as `node scripts/ingest.mjs --live`. Meant
// to run on a tighter cron (~5 min) ONLY during games, refreshing just matches +
// standings (news/squad don't change mid-match and squad needs the API key). It
// self-limits to the match window below so a frequent cron spends ESPN quota
// only while a Palmeiras game is actually on.
const LIVE_MODE =
  process.argv.includes("--live") || process.env.INGEST_MODE === "live";

// Window around a kickoff during which live refreshes are worthwhile.
const LIVE_PRE_MS = 20 * 60 * 1000; //  start 20 min before kickoff
const LIVE_POST_MS = 160 * 60 * 1000; // through ~2.5 h after (full match + stoppage)

/**
 * The Palmeiras match whose window currently contains `now`, or null. Read from
 * the last matches snapshot so the live cron needs no extra call to decide
 * whether to do anything.
 */
function liveWindowMatch(now = Date.now()) {
  const snap = readData("matches.json");
  for (const m of snap?.items || []) {
    const k = new Date(m.kickoff).getTime();
    if (Number.isNaN(k)) continue;
    if (now >= k - LIVE_PRE_MS && now <= k + LIVE_POST_MS) return m;
  }
  return null;
}

async function main() {
  loadEnvLocal();
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  if (LIVE_MODE) {
    const m = liveWindowMatch();
    if (!m) {
      log(
        "live mode: no Palmeiras match window right now — skipping (quota saved)",
      );
      return;
    }
    const label = `${m.home?.nameKo || m.home?.name} vs ${m.away?.nameKo || m.away?.name}`;
    log(
      `live mode: match window active (${label}) — refreshing standings + competitions + matches`,
    );
    await step("standings", ingestStandings);
    await step("competitions", ingestCompetitions);
    await step("matches", ingestMatches);
    log("done (live)");
    return;
  }

  // Optional targeted refresh: INGEST_ONLY="matches" (comma-separated) runs just
  // those steps — handy for a thrifty one-off (e.g. backfilling match lineups)
  // without spending quota on news/squad. Empty ⇒ run everything.
  const only = (process.env.INGEST_ONLY || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const should = (name) => only.length === 0 || only.includes(name);

  if (should("news")) await step("news", ingestNews);
  if (should("standings")) await step("standings", ingestStandings);
  if (should("competitions")) await step("competitions", ingestCompetitions);
  if (should("matches")) await step("matches", ingestMatches);
  if (should("squad")) await step("squad", ingestSquad);
  log("done");
}

// Run the pipeline only when executed directly (`node scripts/ingest.mjs`), so
// the pure parser exports above can be imported by unit tests without kicking
// off any network fetches.
const invokedDirectly = (() => {
  try {
    return (
      Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
    );
  } catch {
    return false;
  }
})();

if (invokedDirectly) await main();
