// /src/app/api/animekai/anikai/[anilistId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { searchAnime, scrapeAnimeInfo } from "../../lib/scraper";
import type { Episode } from "../../types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANILIST_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    synonyms
  }
}
`;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 8000
) {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

// 🔥 Remove nested sources deeply
function removeSources(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(removeSources);
    }

    if (obj && typeof obj === "object") {
        const newObj: Record<string, any> = {};

        for (const key in obj) {
            if (key !== "sources") {
                newObj[key] = removeSources(obj[key]);
            }
        }

        return newObj;
    }

    return obj;
}

// 🔥 Normalize weird episode nesting
function normalizeEpisodes(obj: any) {
    const values = Object.values(obj || {});

    if (
        values.length === 1 &&
        values[0] !== null &&
        typeof values[0] === "object" &&
        Object.keys(values[0]).every((k) => !isNaN(Number(k)))
    ) {
        return values[0];
    }

    return obj;
}

// 🎯 Better anime matching
function findBestMatch(results: any[], titles: string[]) {
    const normalizedTitles = titles.map((t) =>
        t.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    return (
        results.find((r) => {
            const slug = (r.slug || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

            return normalizedTitles.some(
                (title) =>
                    slug.includes(title) || title.includes(slug)
            );
        }) || results[0]
    );
}

/* -------------------------------------------------------------------------- */
/*                               ANIZIP FETCH                                 */
/* -------------------------------------------------------------------------- */

interface AniZipEpisode {
    episodeNumber?: number;
    absoluteEpisodeNumber?: number;
    image?: string;
    title?: {
        en?: string;
        ja?: string;
    };
}

interface AniZipData {
    episodes?: Record<string, AniZipEpisode>;
}

async function fetchAniZipEpisodes(anilistId: number) {
    try {
        const res = await fetchWithTimeout(
            `https://api.ani.zip/mappings?anilist_id=${anilistId}`,
            {
                next: {
                    revalidate: 86400,
                },
            },
            6000
        );

        if (!res.ok) {
            return {};
        }

        const data: AniZipData = await res.json();

        return data?.episodes || {};
    } catch {
        return {};
    }
}

/* -------------------------------------------------------------------------- */
/*                            PRIMARY ANIKAI FETCH                            */
/* -------------------------------------------------------------------------- */

async function fetchPrimaryAnime(anilistId: number) {
    try {
        // 🔥 Better AniList request headers
        const anilistRes = await fetchWithTimeout(
            "https://graphql.anilist.co",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",

                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",

                    Origin: "https://anilist.co",
                    Referer: "https://anilist.co/",
                },

                body: JSON.stringify({
                    query: ANILIST_QUERY,
                    variables: {
                        id: anilistId,
                    },
                }),

                next: {
                    revalidate: 3600,
                },
            },
            8000
        );

        // ✅ Prevent crashes on 403
        if (!anilistRes.ok) {
            console.error(
                "AniList API Error:",
                anilistRes.status
            );

            return null;
        }

        const { data } = await anilistRes.json();

        const media = data?.Media;

        if (!media) {
            return null;
        }

        // 🔎 Build search terms
        const searchTerms = [
            media.title?.romaji,
            media.title?.english,
            media.title?.native,
            ...(media.synonyms || []),
        ]
            .filter(Boolean)
            .map((t: string) => t.trim());

        const uniqueTerms = [...new Set(searchTerms)];

        // Parallel AniZip fetch
        const zipPromise = fetchAniZipEpisodes(anilistId);

        // 🔎 Search AnimeKai
        for (const term of uniqueTerms) {
            const results = await searchAnime(term);

            if (!results?.length) continue;

            const bestMatch = findBestMatch(
                results,
                uniqueTerms
            );

            if (!bestMatch?.slug) continue;

            const animeInfo = await scrapeAnimeInfo(
                bestMatch.slug
            );

            if (!animeInfo) continue;

            // strict AniList check
            if (
                String(animeInfo.al_id) !==
                String(anilistId)
            ) {
                continue;
            }

            const zipEpisodes = await zipPromise;

            const episodes: Episode[] =
                animeInfo.episodes.map((ep: any) => {
                    const zipEp =
                        zipEpisodes[String(ep.number)] ||
                        zipEpisodes[
                        String(parseInt(ep.number))
                        ];

                    return {
                        ...ep,

                        image:
                            zipEp?.image ||
                            ep.image ||
                            null,

                        title:
                            zipEp?.title?.en ||
                            ep.title ||
                            `Episode ${ep.number}`,

                        japanese_title:
                            zipEp?.title?.ja ||
                            ep.japanese_title ||
                            "",
                    };
                });

            return {
                Author: "Made By Leo Devil",
                success: true,

                ani_id: animeInfo.ani_id,
                al_id: animeInfo.al_id,

                title: animeInfo.title,
                japanese_title:
                    animeInfo.japanese_title,

                poster: animeInfo.poster,
                description:
                    animeInfo.description,

                episodes,
            };
        }

        return null;
    } catch (error) {
        console.error(
            "Primary scraper failed:",
            error
        );

        return null;
    }
}

/* -------------------------------------------------------------------------- */
/*                              FALLBACK FETCH                                */
/* -------------------------------------------------------------------------- */

async function fetchFallbackAnime(
    anilistId: string
) {
    const kaiRes = await fetchWithTimeout(
        `https://enc-dec.app/db/kai/find?anilist_id=${anilistId}`,
        {
            next: {
                revalidate: 300,
            },
        },
        8000
    );

    if (!kaiRes.ok) {
        throw new Error(
            "Fallback API request failed"
        );
    }

    const kaiData = await kaiRes.json();

    const kai = Array.isArray(kaiData)
        ? kaiData[0]
        : kaiData;

    if (!kai) {
        throw new Error(
            "Anime not found in fallback API"
        );
    }

    const rawEpisodes = normalizeEpisodes(
        kai?.episodes || {}
    );

    const zipEpisodes =
        await fetchAniZipEpisodes(
            Number(anilistId)
        );

    const episodes = Object.entries(
        rawEpisodes
    ).map(([epNum, epData]) => {
        const { sources, ...rest } =
            epData as Record<string, any>;

        const clean = removeSources(rest);

        const zipEp = zipEpisodes[epNum];

        return {
            number: epNum,
            slug: epNum,

            title:
                zipEp?.title?.en ||
                clean?.title ||
                `Episode ${epNum}`,

            japanese_title:
                zipEp?.title?.ja || "",

            token:
                clean?.token || null,

            has_sub: !!(
                sources?.sub ||
                sources?.softsub
            ),

            has_dub: !!sources?.dub,

            image:
                zipEp?.image || null,
        };
    });

    return {
        Author: "Made By Leo Devil",
        success: true,

        title:
            kai?.info?.title_en ||
            "Unknown",

        japanese_title:
            kai?.info?.title_jp || "",

        episodes,
    };
}

/* -------------------------------------------------------------------------- */
/*                                   ROUTE                                    */
/* -------------------------------------------------------------------------- */

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            anilistId: string;
        }>;
    }
) {
    try {
        const { anilistId } =
            await params;

        const parsedId = parseInt(
            anilistId,
            10
        );

        if (isNaN(parsedId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid AniList ID",
                },
                {
                    status: 400,
                }
            );
        }

        // ✅ PRIMARY SCRAPER
        const primaryData =
            await fetchPrimaryAnime(
                parsedId
            );

        if (primaryData) {
            return NextResponse.json(
                primaryData
            );
        }

        console.log(
            "Using fallback API..."
        );

        // ✅ FALLBACK
        const fallbackData =
            await fetchFallbackAnime(
                anilistId
            );

        return NextResponse.json(
            fallbackData
        );

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                Author: "Made By Leo Devil",
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch anime",
            },
            {
                status: 500,
            }
        );
    }
}
