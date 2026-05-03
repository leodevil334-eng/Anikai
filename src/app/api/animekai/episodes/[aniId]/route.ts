import { NextResponse } from "next/server";
import { fetchEpisodes } from "../../lib/scraper";
import { successResponse, errorResponse } from "../../lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ aniId: string }> }
): Promise<NextResponse> {
  try {
    const { aniId } = await params;
    const episodes = await fetchEpisodes(aniId);
    return successResponse({
      ani_id: aniId,
      count: episodes.length,
      episodes,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error");
  }
}
