// =============================================================================
// Data adapters. Each adapter returns a DataResult<T> envelope so the UI always
// knows the origin (live / seed / cache) and can render freshness + fallback
// labels. Live sources are attempted only when the relevant env var is set; any
// failure falls back to clearly-labeled seed data. No secrets are ever hardcoded
// and no disallowed scraping is performed — live paths use documented APIs/feeds
// that the operator explicitly opts into via env.
// =============================================================================

import type {
  DataResult,
  Match,
  NewsItem,
  Squad,
  Standings,
  TeamLineup,
  CompetitionsSnapshot,
  CompetitionCampaign,
} from "@/lib/domain/types";
import {
  SEED_MATCHES,
  SEED_NEWS,
  SEED_SQUAD,
  SEED_STANDINGS,
} from "@/lib/data/palmeiras-seed";
import { cached } from "@/lib/adapters/cache";
import { parseFeed } from "@/lib/adapters/rss";
import { enrichNewsList } from "@/lib/interpret/news";
import { isSafeHttpUrl } from "@/lib/security/url";
import {
  readNewsSnapshot,
  readSquadPhotos,
  readSquadSnapshot,
  readMatchesSnapshot,
  readStandingsSnapshot,
  readCompetitionsSnapshot,
} from "@/lib/data/snapshot";
import { attachPhotos } from "@/lib/data/photos";
import { gateSquad } from "@/lib/data/squad-integrity";
import { koreanName, koreanTeamName } from "@/lib/i18n/ptKo";
import { getDossier, getCoachDossier } from "@/lib/teams/palmeiras-dossier";
import { displayStadiumName } from "@/lib/teams/stadium-naming";

const SEED_SOURCE = "Seed 데이터 (mock)";

/** Hard limits for external feed fetches (availability + memory safety). */
const FEED_FETCH_TIMEOUT_MS = 8000;
const MAX_FEED_BYTES = 2_000_000; // ~2MB of XML is more than any sane feed

/** Cache keys, exported so routes can do scoped invalidation. */
export const CACHE_KEYS = {
  squad: "squad:palmeiras",
  matches: "matches:palmeiras",
  standings: "standings:palmeiras",
  competitions: "competitions:palmeiras",
  news: "news:palmeiras",
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

function seedResult<T>(data: T, note?: string): DataResult<T> {
  return {
    data,
    origin: "seed",
    source: SEED_SOURCE,
    fetchedAt: nowIso(),
    fellBack: false,
    note,
  };
}

function fallbackResult<T>(data: T, note: string): DataResult<T> {
  return {
    data,
    origin: "seed",
    source: SEED_SOURCE,
    fetchedAt: nowIso(),
    fellBack: true,
    note,
  };
}

// --- Squad -------------------------------------------------------------------
// The curated Korean squad (names + editorial insights) is the display source.
// When the free pipeline has fetched the real API-Football roster, we merge in
// real player photos by name (see src/lib/data/photos.ts) — current & real,
// while keeping the Korean names/insights. Players who left the club simply keep
// their monogram fallback.

export async function getSquad(): Promise<DataResult<Squad>> {
  return cached(CACHE_KEYS.squad, async () => {
    // Real current roster (API-Football). Korean names are (re)derived
    // deterministically here — never trusted from the pipeline/LLM — so the
    // orthography is stable and correct regardless of how data was produced.
    const snapshot = readSquadSnapshot();
    if (snapshot && snapshot.data.players.length > 0) {
      // Data-integrity gate: cross-verify each entry (ESPN ⟷ API-Football),
      // apply sanity rules + the manual override layer, and drop phantoms before
      // anything reaches the UI. See src/lib/data/squad-integrity.ts.
      const gated = gateSquad(snapshot.data.players);
      if (gated.hidden.length > 0) {
        console.warn(
          "[squad-integrity] hid",
          gated.hidden.length,
          "low-confidence entr(y/ies):",
          gated.hidden.map((h) => h.name).join(", "),
        );
      }
      const players = gated.players.map((p) => {
        // (4) Never auto-generate editorial for an unverified row — the curated
        // dossier is only consulted for cross-verified players.
        const verified = p.confidence !== "unverified";
        const d = verified ? getDossier(p.name) : null;
        // Live API facts win; the curated dossier only fills gaps.
        return {
          ...p,
          nameKo: koreanName(p.name),
          nationality: p.nationality || d?.nationality || "",
          nationalityKo:
            p.nationalityKo && p.nationalityKo !== "정보 없음"
              ? p.nationalityKo
              : d?.nationalityKo || "정보 없음",
          birthDate: p.birthDate || d?.birthDate,
          heightCm: p.heightCm || d?.heightCm,
          bio: verified ? p.bio || d?.bioKo : undefined,
        };
      });
      const cd = getCoachDossier(snapshot.data.coach.name);
      const coach = {
        ...snapshot.data.coach,
        nameKo: koreanName(snapshot.data.coach.name),
        since: snapshot.data.coach.since || cd?.since,
        bio: snapshot.data.coach.bio || cd?.bioKo,
      };
      return { ...snapshot, data: { players, coach } };
    }
    // Fallback: seed roster with real photos merged by name, if available.
    const photos = readSquadPhotos();
    if (photos && photos.roster.length > 0) {
      const players = attachPhotos(SEED_SQUAD.players, photos.roster);
      const withPhotos = players.filter((p) => p.photo).length;
      return {
        data: { players, coach: SEED_SQUAD.coach },
        origin: "seed",
        source: `${SEED_SOURCE} + API-Football 사진`,
        fetchedAt: nowIso(),
        fellBack: false,
        note: `명단·해설은 시드, 선수 사진 ${withPhotos}명은 API-Football(실시간).`,
      };
    }
    return seedResult<Squad>(SEED_SQUAD);
  });
}

// --- Matches -----------------------------------------------------------------

/** Re-derive Korean player names on a team lineup (deterministic, never trusted
 *  from the pipeline). */
function koLineup(l: TeamLineup): TeamLineup {
  const ko = (arr: TeamLineup["starters"]) =>
    arr.map((p) => ({ ...p, nameKo: koreanName(p.name) }));
  return { ...l, starters: ko(l.starters), bench: ko(l.bench) };
}

export async function getMatches(): Promise<DataResult<Match[]>> {
  return cached(CACHE_KEYS.matches, async () => {
    // Precedence: current-season ESPN snapshot (free pipeline) → seed.
    const snapshot = readMatchesSnapshot();
    if (snapshot && snapshot.data.length > 0) {
      const data = snapshot.data.map((m) => ({
        ...m,
        // The ESPN feed still emits "Allianz Parque"; the arena is officially
        // Nubank Parque since 2026-05-04. Deterministic, kickoff-aware rename.
        stadium: displayStadiumName(m.stadium, m.kickoff),
        home: { ...m.home, nameKo: koreanTeamName(m.home.name) },
        away: { ...m.away, nameKo: koreanTeamName(m.away.name) },
        events: m.events?.map((e) => ({
          ...e,
          player: koreanName(e.player),
          detail: e.detail ? koreanName(e.detail) : e.detail,
        })),
        // Korean names are (re)derived deterministically here too — never
        // trusted from the pipeline — so lineup orthography stays correct.
        lineups: m.lineups
          ? { home: koLineup(m.lineups.home), away: koLineup(m.lineups.away) }
          : undefined,
      }));
      return { ...snapshot, data };
    }
    return seedResult<Match[]>(
      SEED_MATCHES.map((m) => ({
        ...m,
        stadium: displayStadiumName(m.stadium, m.kickoff),
      })),
    );
  });
}

// --- Standings ---------------------------------------------------------------

export async function getStandings(): Promise<DataResult<Standings>> {
  return cached(CACHE_KEYS.standings, async () => {
    const snapshot = readStandingsSnapshot();
    if (snapshot && snapshot.data.table.length > 0) {
      const table = snapshot.data.table.map((r) => ({
        ...r,
        teamNameKo: koreanTeamName(r.teamName),
      }));
      return {
        ...snapshot,
        data: { ...snapshot.data, table },
      };
    }
    return seedResult<Standings>(SEED_STANDINGS);
  });
}

// --- Continental / cup campaigns ---------------------------------------------
// Libertadores group table + the knockout tie Palmeiras is in, and the Copa do
// Brasil knockout run. Korean team names are (re)derived deterministically here
// (never trusted from the pipeline) so orthography stays correct. There is no
// seed fallback: when the snapshot is absent the section is simply omitted
// (honest — we never fabricate a bracket).

function koCampaign(c: CompetitionCampaign): CompetitionCampaign {
  return {
    ...c,
    group: c.group
      ? {
          ...c.group,
          table: c.group.table.map((r) => ({
            ...r,
            teamNameKo: koreanTeamName(r.teamName),
          })),
        }
      : undefined,
    currentRound: c.currentRound
      ? {
          ...c.currentRound,
          opponentNameKo: koreanTeamName(c.currentRound.opponentName),
        }
      : undefined,
    path: c.path?.map((t) => ({
      ...t,
      opponentNameKo: koreanTeamName(t.opponentName),
    })),
  };
}

export async function getCompetitions(): Promise<DataResult<CompetitionsSnapshot> | null> {
  return cached(CACHE_KEYS.competitions, async () => {
    const snapshot = readCompetitionsSnapshot();
    if (snapshot && snapshot.data.campaigns.length > 0) {
      return {
        ...snapshot,
        data: {
          ...snapshot.data,
          campaigns: snapshot.data.campaigns.map(koCampaign),
        },
      };
    }
    return null;
  });
}

// --- News --------------------------------------------------------------------

function dedupeAndSort(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    const k = `${it.title}|${it.url}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  // Every item is enriched with reliability + Korean interpretation so the news
  // UI contract (왜 중요한가 / 팬 관점 / 신뢰도) always holds, live or seed.
  return enrichNewsList(out).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export async function getNews(): Promise<DataResult<NewsItem[]>> {
  return cached(CACHE_KEYS.news, async () => {
    // Precedence: committed pipeline snapshot → request-time RSS → seed.
    // The snapshot is produced by scripts/ingest.mjs (free GitHub Actions cron),
    // so the common live path costs zero per-request network calls.
    const snapshot = readNewsSnapshot();
    if (snapshot && snapshot.origin !== "seed") {
      return { ...snapshot, data: dedupeAndSort(snapshot.data) };
    }

    const feedsRaw = process.env.NEWS_RSS_FEEDS?.trim();
    if (!feedsRaw) {
      return seedResult<NewsItem[]>(dedupeAndSort(SEED_NEWS));
    }
    // Only fetch http(s) feed URLs (guards against file:// or odd schemes in
    // the env value), with a per-request timeout and a response-size cap so a
    // slow or huge/malformed feed can't hang the request or exhaust memory.
    const feeds = feedsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter(isSafeHttpUrl);
    try {
      const results = await Promise.allSettled(
        feeds.map(async (url) => {
          const res = await fetch(url, {
            headers: { "User-Agent": "PalmeirasKoreaDashboard/1.0" },
            signal: AbortSignal.timeout(FEED_FETCH_TIMEOUT_MS),
            // Revalidate at most every few minutes at the fetch layer too.
            next: { revalidate: 300 },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
          const raw = await res.text();
          const xml =
            raw.length > MAX_FEED_BYTES ? raw.slice(0, MAX_FEED_BYTES) : raw;
          const host = (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return url;
            }
          })();
          return parseFeed(xml, host);
        }),
      );
      const items = results
        .filter(
          (r): r is PromiseFulfilledResult<NewsItem[]> =>
            r.status === "fulfilled",
        )
        .flatMap((r) => r.value);

      if (items.length === 0) {
        return fallbackResult<NewsItem[]>(
          dedupeAndSort(SEED_NEWS),
          "설정된 RSS 피드에서 기사를 가져오지 못해 시드 뉴스를 표시합니다.",
        );
      }
      return {
        data: dedupeAndSort(items),
        origin: "live" as const,
        source: feeds.map((f) => new URL(f).hostname).join(", "),
        fetchedAt: nowIso(),
        fellBack: false,
      };
    } catch (err) {
      return fallbackResult<NewsItem[]>(
        dedupeAndSort(SEED_NEWS),
        `라이브 뉴스를 불러오지 못했습니다: ${(err as Error).message}`,
      );
    }
  });
}

// --- Single-player lookup ----------------------------------------------------

export async function getPlayer(id: string) {
  const squad = await getSquad();
  const player = squad.data.players.find((p) => p.id === id) ?? null;
  return { ...squad, data: player };
}
