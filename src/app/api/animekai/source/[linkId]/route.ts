import { NextResponse } from "next/server";
import { resolveSource } from "../../lib/scraper";
import { successResponse, errorResponse } from "../../lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ linkId: string }> }
): Promise<NextResponse> {
  try {
    const { linkId } = await params;
    const data = await resolveSource(linkId);
    return successResponse({ ...data });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error");
  }
}
