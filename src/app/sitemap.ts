import type { MetadataRoute } from "next";
import { getSquad, getMatches } from "@/lib/adapters";
import { SITE_URL } from "@/lib/site";

/**
 * Dynamic sitemap: the static routes plus every real squad-player page
 * (/squad/[id]) and match-detail page (/fixtures/[id]) derived from the live
 * snapshots. Player ids come from the integrity-gated squad, so a blocklisted
 * phantom (e.g. Ghareeb) is never listed. Regenerated on each deploy (the data
 * cron commits → redeploy), so new fixtures/players appear automatically.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [squad, matches] = await Promise.all([getSquad(), getMatches()]);
  const toDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  };

  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/standings", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/fixtures", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/squad", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/news", priority: 0.8, changeFrequency: "hourly" as const },
    { path: "/guide", priority: 0.7, changeFrequency: "monthly" as const },
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const playerPages: MetadataRoute.Sitemap = squad.data.players.map((p) => ({
    url: `${SITE_URL}/squad/${p.id}`,
    lastModified: toDate(squad.fetchedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const fixturePages: MetadataRoute.Sitemap = matches.data.map((m) => ({
    url: `${SITE_URL}/fixtures/${m.id}`,
    lastModified: toDate(matches.fetchedAt),
    changeFrequency: m.status === "finished" ? "monthly" : "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...playerPages, ...fixturePages];
}
