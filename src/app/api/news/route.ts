import { NextResponse } from "next/server";
import { getNews, CACHE_KEYS } from "@/lib/adapters";
import { cacheDelete } from "@/lib/adapters/cache";

/**
 * News API route. Returns the DataResult envelope (data + origin + freshness),
 * so the client can render reliability/freshness labels. `?refresh=1` clears
 * only the news cache entry (scoped — never the whole cache) before fetching,
 * supporting the UI refresh button without amplifying upstream load.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("refresh") === "1") {
    cacheDelete(CACHE_KEYS.news);
  }
  const result = await getNews();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
