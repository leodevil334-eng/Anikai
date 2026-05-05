import { NextResponse } from "next/server";
import { successResponse } from "./lib/response";

export async function GET(): Promise<NextResponse> {
  return successResponse({
    api: "Anime Kai REST API",
    version: "1.1.0",
    endpoints: {
      "/api/animekai/home": "Get banner, latest updates, and trending",
      "/api/animekai/most-searched": "Get most-searched anime keywords",
      "/api/animekai/search?keyword=...": "Search anime",
      "/api/animekai/anime/:slug": "Get anime details and ani_id",
      "/api/animekai/episodes/:ani_id": "Get episode list and ep tokens",
      "/api/animekai/servers/:ep_token": "Get available servers for an episode",
      "/api/animekai/source/:link_id": "Get direct m3u8 stream and skip times",
      "/api/animekai/anikai/:anilist_id": "Get anime info by AniList ID",
      "/api/animekai/browser?keyword={keyword}&page={number}": "Get items by keyword",
      "/api/animekai/category/:category?page={number}": "Get categories",
      "/api/animekai/items_home/:name?page={number}": "Get items by name",
      "/api/animekai/schedule?time={timestamp}": "Get schedule for a specific time",
    },
  });
}
