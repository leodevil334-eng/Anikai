import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { AJAX_HEADERS } from "../lib/config";
import { successResponse, errorResponse } from "../lib/response";

const BASE_URL = "https://anikai.to";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return errorResponse("Missing id", 400);
        }

        const res = await fetch(`${BASE_URL}/ajax/anime/tip?id=${id}`, {
            headers: AJAX_HEADERS,
            cache: "no-store",
        });

        const data = await res.json();

        if (data.status !== "ok") {
            return errorResponse("Invalid response", 400);
        }

        const $ = cheerio.load(data.result);

        // Titles
        const title = $(".title").text().trim();
        const jpTitle = $(".title").attr("data-jp") || null;
        const altTitle = $(".al-title").text().trim();

        // Rating
        const rating = $(".ttrating").text().trim();
        const malScore = $(".fa-star").parent().text().replace(/\s+/g, " ").trim();

        // Description
        const description = $(".desc").text().trim();

        // Details
        const aired = $(".detail div:contains('Aired')").text().replace("Aired:", "").trim();
        const status = $(".detail div:contains('Status')").text().replace("Status:", "").trim();

        // Genres
        const genres = $(".genre a")
            .map((_, el) => $(el).text().trim())
            .get();

        // Watch link
        const watchPath = $(".watch-btn").attr("href");
        const watchUrl = watchPath ? `${BASE_URL}${watchPath}` : null;
        const animeId = watchUrl?.split("/watch/")[1];

        // IDs
        const anilistId = $(".user-bookmark").attr("data-alid") || null;
        const internalId = $(".user-bookmark").attr("data-id") || null;

        return successResponse({
            success: true,
            data: {
                animeId,
                title,
                jpTitle,
                altTitle,
                rating,
                malScore,
                description,
                aired,
                status,
                genres,
                watchUrl,
                anilistId,
                internalId,
            },
        });
    } catch (err: any) {
        return errorResponse(err.message);
    }
}