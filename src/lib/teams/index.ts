// =============================================================================
// Team registry. MVP ships Palmeiras only, but the indirection here is what lets
// future teams/leagues/national teams be added without touching UI code:
// register a TeamConfig + a data adapter keyed by team id.
// =============================================================================

import type { TeamConfig } from "@/lib/domain/types";
import { PALMEIRAS } from "@/lib/teams/palmeiras";

const REGISTRY: Record<string, TeamConfig> = {
  [PALMEIRAS.id]: PALMEIRAS,
};

/** The team the dashboard is currently focused on (MVP: Palmeiras). */
export const ACTIVE_TEAM_ID = PALMEIRAS.id;

export function getTeam(id: string = ACTIVE_TEAM_ID): TeamConfig {
  const team = REGISTRY[id];
  if (!team) {
    throw new Error(`Unknown team id: ${id}`);
  }
  return team;
}

export function getActiveTeam(): TeamConfig {
  return getTeam(ACTIVE_TEAM_ID);
}

export function listTeams(): TeamConfig[] {
  return Object.values(REGISTRY);
}
