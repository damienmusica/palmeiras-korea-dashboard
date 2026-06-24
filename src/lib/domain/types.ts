// =============================================================================
// Domain models — framework-agnostic, source-agnostic types.
// Adapters normalize raw data (mock seed or live API) into these shapes so the
// UI only ever depends on this contract. Adding a new team/league means writing
// a new config + adapter that produces these same types.
// =============================================================================

/** ISO 3166-1 alpha-2 country code (uppercase), e.g. "BR", "KR". */
export type CountryCode = string;

/**
 * Where the data ultimately came from, so the UI can label freshness/trust.
 * The fuller set lets badges distinguish a live API call from an RSS pull from
 * hand-written editorial/seed content from a hard failure.
 *  - live/api/rss  : fetched from an external source this request cycle
 *  - cache         : served from the in-memory cache (still externally sourced)
 *  - seed/mock     : realistic built-in data used when no live source is wired
 *  - manual/editorial : hand-authored Korean interpretation / fan context
 *  - unavailable   : source was expected but could not be reached
 */
export type DataOrigin =
  | "live"
  | "api"
  | "rss"
  | "cache"
  | "seed"
  | "mock"
  | "manual"
  | "editorial"
  | "unavailable";

/** Original language of a source label, preserved alongside Korean UI text. */
export type SourceLanguage = "pt" | "en" | "ko" | "es" | "other";

/**
 * Trust/reliability classification for a news item's source. Korean fans who
 * don't know Brazilian media need to know whether something is official, solid
 * reporting, or just a rumor/aggregator repost.
 */
export type SourceReliability =
  | "official" // club / federation / competition official channel
  | "reliable" // established sports media
  | "rumor" // transfer rumor / speculation
  | "aggregator" // repost / aggregator without original reporting
  | "unknown";

/** A value plus provenance metadata. Wrap adapter results in this envelope. */
export interface DataResult<T> {
  data: T;
  origin: DataOrigin;
  /** Human-readable source name, e.g. "API-Football", "Seed (mock)". */
  source: string;
  /** When the underlying data was produced/fetched (ISO 8601). */
  fetchedAt: string;
  /** True when live source was requested but unavailable and we fell back. */
  fellBack: boolean;
  /** Optional note shown in freshness tooltips, e.g. error reason. */
  note?: string;
}

// --- Team configuration ------------------------------------------------------

export type PlayerPositionGroup = "GK" | "DF" | "MF" | "FW";
export type PreferredFoot = "left" | "right" | "both";
export type PlayerAvailability = "available" | "injured" | "suspended" | "loan";

export interface CompetitionRef {
  /** Stable id used across adapters, e.g. "brasileirao". */
  id: string;
  /** Original name, e.g. "Campeonato Brasileiro Série A". */
  name: string;
  /** Korean display name, e.g. "브라질 세리이 A". */
  nameKo: string;
  /** Short label, e.g. "Brasileirão". */
  shortName: string;
  kind: "league" | "cup" | "continental";
}

export interface OfficialLink {
  label: string;
  labelKo: string;
  url: string;
}

export interface GlossaryEntry {
  /** Portuguese/English term. */
  term: string;
  /** Korean reading/transliteration. */
  reading: string;
  /** Korean explanation. */
  meaning: string;
  category: "general" | "club" | "tactics" | "culture" | "chant";
}

export interface RivalEntry {
  name: string;
  nameKo: string;
  /** Name of the derby, e.g. "Derby Paulista". */
  derby?: string;
  derbyKo?: string;
  /** Korean context paragraph. */
  context: string;
}

/**
 * A club legend / notable figure a newcomer should know. Covers both all-time
 * icons and recent impactful players who moved on (kept as history, not deleted).
 * All facts are hand-researched and verified during the build phase.
 */
export interface LegendEntry {
  name: string;
  nameKo: string;
  /** Korean nickname, e.g. "오 디비누 (신성)". */
  nicknameKo?: string;
  /** Years at the club, e.g. "1961–1977". */
  era: string;
  positionKo: string;
  /** "icon" = all-time great; "recent" = recent notable departure. */
  group: "icon" | "recent";
  /** Why this player matters, in Korean (verified facts). */
  whyKo: string;
  /** For recent departures: where they went, e.g. "레알 마드리드 (2024)". */
  movedToKo?: string;
}

export interface StadiumInfo {
  name: string;
  nameKo: string;
  /** Sponsored/common name, e.g. "Allianz Parque". */
  commonName?: string;
  capacity: number;
  city: string;
  opened: number;
  note: string;
}

export interface TrophySummary {
  competition: string;
  competitionKo: string;
  count: number;
  /** Most recent winning year, when notable. */
  lastWon?: number;
}

/** One milestone era in the club's history (hand-researched, verified). */
export interface HistoryEra {
  /** Year or span, e.g. "1914", "1959–1974". */
  period: string;
  titleKo: string;
  bodyKo: string;
}

/**
 * A living-culture topic a real fan cares about — anthem, mascot, torcida,
 * stadium lore, identity. Told as a short story, not a dictionary line. All
 * facts hand-researched and web-verified during the build phase.
 */
export interface CultureTopic {
  /** Emoji marker for quick scanning. */
  icon: string;
  titleKo: string;
  /** Optional original term / reading, e.g. "Avanti, Palestra! · 아반치 파레스트라". */
  subtitleKo?: string;
  bodyKo: string;
  /** Optional quick-fact chips. */
  tagsKo?: string[];
}

/** A single tactical principle. */
export interface TacticalPrinciple {
  titleKo: string;
  bodyKo: string;
}

/** How the team actually plays — the manager's system, in plain Korean. */
export interface TacticalProfile {
  /** One-line summary of the manager's footballing identity. */
  summaryKo: string;
  /** Typical shapes, e.g. "4-2-3-1 / 4-4-2 (상대 따라 가변 3백)". */
  baseFormationKo: string;
  /** Core principles a fan should watch for. */
  principlesKo: TacticalPrinciple[];
  /** Optional caveat (e.g. formations rotate by squad/opponent). */
  noteKo?: string;
}

/** A detailed honour line with the exact winning years. */
export interface HonourLine {
  competitionKo: string;
  competition: string;
  count: number;
  /** Winning years, formatted, e.g. "1999, 2020, 2021". */
  yearsKo: string;
  /** Scope label: 대륙 / 전국 / 국내컵 / 주(州) / 국제. */
  tierKo: string;
  /** Optional caveat (e.g. disputed / nuance). */
  noteKo?: string;
}

/** The single source of truth that makes the app multi-team-ready. */
export interface TeamConfig {
  id: string;
  /** Full official name. */
  name: string;
  nameKo: string;
  shortName: string;
  nickname: string;
  nicknameKo: string;
  founded: number;
  country: CountryCode;
  /** IANA timezone of the club's home, e.g. "America/Sao_Paulo". */
  homeTimezone: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Path to a local crest asset (SVG) bundled in /public. */
  crest: string;
  stadium: StadiumInfo;
  competitions: CompetitionRef[];
  officialLinks: OfficialLink[];
  trophies: TrophySummary[];
  rivals: RivalEntry[];
  /** Club legends & notable recent departures (history a newcomer should know). */
  legends?: LegendEntry[];
  /** Milestone history timeline. */
  history?: HistoryEra[];
  /** Detailed honours with exact winning years. */
  honours?: HonourLine[];
  /** Living fan-culture topics (anthem, mascot, torcida, stadium lore). */
  culture?: CultureTopic[];
  /** How the team plays under the current manager. */
  tactics?: TacticalProfile;
  /** Korean pronunciation / naming notes for the club. */
  nameNotes: string[];
  glossary: GlossaryEntry[];
  /** Korean new-fan starter guide, ordered steps. */
  starterGuide: { title: string; body: string }[];
  /** Short Korean "who are they" identity paragraph. */
  identity: string;
}

// --- Squad / players ---------------------------------------------------------

export interface PlayerSeasonStats {
  season: string;
  competition?: string;
  appearances: number;
  goals: number;
  assists: number;
  yellowCards?: number;
  redCards?: number;
  minutes?: number;
  cleanSheets?: number; // GK
  saves?: number; // GK
  goalsConceded?: number; // GK
}

export interface Player {
  id: string;
  name: string;
  /** Full registered name when different from common name. */
  fullName?: string;
  /** Korean transliteration of the name. */
  nameKo: string;
  number?: number;
  positionGroup: PlayerPositionGroup;
  /** Specific position, e.g. "Volante", "Lateral-direito". */
  position: string;
  positionKo: string;
  nationality: CountryCode;
  nationalityKo: string;
  birthDate?: string; // ISO date
  heightCm?: number;
  foot?: PreferredFoot;
  availability: PlayerAvailability;
  /** Free-text status note, e.g. injury detail (Korean). */
  statusNote?: string;
  /** On loan from / to, when applicable. */
  loanNote?: string;
  photo?: string;
  stats?: PlayerSeasonStats[];
  /** Short Korean bio/role description. */
  bio?: string;
}

export interface Coach {
  id: string;
  name: string;
  nameKo: string;
  nationality: CountryCode;
  nationalityKo: string;
  birthDate?: string;
  role: string;
  roleKo: string;
  since?: string;
  bio?: string;
}

export interface Squad {
  players: Player[];
  coach: Coach;
}

// --- Matches -----------------------------------------------------------------

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";
export type Venue = "home" | "away" | "neutral";

export interface MatchTeamRef {
  id: string;
  name: string;
  nameKo: string;
  crest?: string;
}

export interface Match {
  id: string;
  competition: CompetitionRef;
  /** ISO 8601 UTC kickoff timestamp. */
  kickoff: string;
  status: MatchStatus;
  venue: Venue;
  stadium?: string;
  round?: string;
  home: MatchTeamRef;
  away: MatchTeamRef;
  score?: {
    home: number;
    away: number;
  };
  /** Optional per-match notable events (goals etc.), may be empty. */
  events?: MatchEvent[];
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "sub" | "penalty";
  team: "home" | "away";
  player: string;
  detail?: string;
}

export type FormResult = "W" | "D" | "L";

// --- Standings ---------------------------------------------------------------

export interface StandingRow {
  rank: number;
  teamId: string;
  teamName: string;
  teamNameKo: string;
  /** Club crest URL (real logo), with monogram fallback in the UI. */
  crest?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: FormResult[];
  /** True when this is the team the dashboard is about. */
  isTracked?: boolean;
}

export interface StatLeader {
  playerId?: string;
  playerName: string;
  playerNameKo: string;
  value: number;
}

export interface Standings {
  competition: CompetitionRef;
  season: string;
  table: StandingRow[];
  topScorers: StatLeader[];
  topAssisters: StatLeader[];
  /** Season the scorer/assist leaders reflect (may differ from table season). */
  leadersSeason?: string;
}

// --- News --------------------------------------------------------------------

export interface NewsItem {
  id: string;
  title: string;
  /** Korean-friendly summary (translated/adapted). */
  summaryKo: string;
  /** Original-language excerpt, preserved. */
  excerpt?: string;
  url: string;
  source: string;
  language: SourceLanguage;
  /** ISO 8601 publish timestamp. */
  publishedAt: string;
  imageUrl?: string;
  tags?: string[];
  /** Source trust classification (defaults to "unknown" if not set). */
  reliability?: SourceReliability;
  /** Editorial: why this matters to a Korean fan. */
  whyItMattersKo?: string;
  /** Editorial: one-line fan-perspective takeaway. */
  fanTakeKo?: string;
}

// --- Dashboard aggregate -----------------------------------------------------

export interface SeasonSummary {
  season: string;
  competitionsActive: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface ChangeLogEntry {
  /** ISO date of the change. */
  date: string;
  category: "match" | "news" | "squad" | "standings";
  /** Korean summary of what changed. */
  text: string;
}

// =============================================================================
// Interpretation layer — the heart of the "fan intelligence" pivot. These types
// carry hand-authored Korean context that turns raw data into understanding.
// All interpretive content is editorial/seed and labeled as such in the UI.
// =============================================================================

/** Provenance tag for a block of interpretive content. */
export type InterpretationSource = "editorial" | "rule" | "seed";

/** Korean fan context for a single match (upcoming or finished). */
export interface MatchInsight {
  /** Why this match matters — stakes, rivalry, table implications. */
  whyItMattersKo: string;
  /** What a Korean fan should watch for (players, tactical points). */
  watchPointsKo: string[];
  /** For finished matches: how to read the result emotionally/contextually. */
  resultReadingKo?: string;
  /** Rivalry tag if this is a derby. */
  rivalryKo?: string;
  source: InterpretationSource;
}

/** Korean fan context for a player. */
export interface PlayerInsight {
  /** Role within the team, in plain Korean. */
  roleKo: string;
  /** Playing style described simply. */
  styleKo: string;
  /** Why fans care about this player. */
  whyCareKo: string;
  /** Current narrative/reputation, when known. */
  narrativeKo?: string;
  /** Familiar archetype/comparison (clearly framed as a loose analogy). */
  archetypeKo?: string;
  /** Name pronunciation / nickname notes. */
  nameNoteKo?: string;
  source: InterpretationSource;
}

/** Beginner-friendly explainer for a competition. */
export interface CompetitionContext {
  id: string;
  nameKo: string;
  /** One-line "what is this". */
  taglineKo: string;
  /** Fuller beginner explanation. */
  explainerKo: string;
  /** Relative prestige/importance note. */
  stakesKo: string;
}

/** A single block in the home "5-minute briefing". */
export interface BriefingItem {
  icon: string;
  label: string;
  headlineKo: string;
  bodyKo: string;
  /** Optional deep-link within the app. */
  href?: string;
}

export interface Briefing {
  /** ISO timestamp the briefing reflects. */
  asOf: string;
  items: BriefingItem[];
  source: InterpretationSource;
}
