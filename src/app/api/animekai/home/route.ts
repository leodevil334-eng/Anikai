import { NextRequest, NextResponse } from "next/server";
import { scrapeHome } from "../lib/scraper";
import { successResponse, errorResponse } from "../lib/response";



export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const data = await scrapeHome();

        return successResponse({
            banner: data.banner,
            top_trending: data.top_trending,
            sections: data.sections,
            latest: data.latest,
        });
    } catch (err) {
        return errorResponse(err instanceof Error ? err.message : "Unknown error");
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
