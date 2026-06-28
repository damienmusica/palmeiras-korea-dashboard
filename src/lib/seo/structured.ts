// Schema.org JSON-LD builders. Every field is derived from verified domain
// models (team config, the live snapshots) — no fabrication. Used to help
// search engines understand the club, its matches, and its players.

import type { Match, Player, TeamConfig } from "@/lib/domain/types";
import { SITE_URL } from "@/lib/site";

/** SportsTeam node for the club (rendered once, on the home page). */
export function sportsTeamJsonLd(team: TeamConfig): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    alternateName: [team.nameKo, team.nickname].filter(Boolean),
    sport: "Soccer",
    foundingDate: String(team.founded),
    url: SITE_URL,
    logo: `${SITE_URL}${team.crest}`,
    location: {
      "@type": "StadiumOrArena",
      name: team.stadium.name,
      maximumAttendeeCapacity: team.stadium.capacity,
      address: {
        "@type": "PostalAddress",
        addressLocality: team.stadium.city,
        addressCountry: team.country,
      },
    },
  };
}

/** SportsEvent node for a single match (rendered on /fixtures/[id]). */
export function sportsEventJsonLd(match: Match): Record<string, unknown> {
  const eventStatus =
    match.status === "postponed"
      ? "https://schema.org/EventPostponed"
      : "https://schema.org/EventScheduled";
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.home.name} vs ${match.away.name}`,
    sport: "Soccer",
    startDate: match.kickoff,
    eventStatus,
    url: `${SITE_URL}/fixtures/${match.id}`,
    homeTeam: { "@type": "SportsTeam", name: match.home.name },
    awayTeam: { "@type": "SportsTeam", name: match.away.name },
    competitor: [
      { "@type": "SportsTeam", name: match.home.name },
      { "@type": "SportsTeam", name: match.away.name },
    ],
    superEvent: {
      "@type": "SportsOrganization",
      name: match.competition.name,
    },
  };
  if (match.stadium) {
    node.location = { "@type": "Place", name: match.stadium };
  }
  return node;
}

/** Person/Athlete node for a player (rendered on /squad/[id]). */
export function athleteJsonLd(player: Player): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.name,
    alternateName: player.nameKo,
    url: `${SITE_URL}/squad/${player.id}`,
    jobTitle: player.positionKo,
    memberOf: { "@type": "SportsTeam", name: "Sociedade Esportiva Palmeiras" },
  };
  if (player.birthDate) node.birthDate = player.birthDate;
  if (player.heightCm) node.height = `${player.heightCm} cm`;
  if (player.nationalityKo && player.nationalityKo !== "정보 없음") {
    node.nationality = player.nationalityKo;
  }
  return node;
}
