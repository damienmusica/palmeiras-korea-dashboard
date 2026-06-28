import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** robots.txt — allow crawling of all pages, keep crawlers off the JSON API,
 *  and advertise the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
