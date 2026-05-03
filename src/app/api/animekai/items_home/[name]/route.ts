import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

/* ------------------ Headers ------------------ */
const AJAX_HEADERS = {
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: "https://anikai.to/",
    Origin: "https://anikai.to",
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    Cookie:
        "usertype=guest; session=DknYhJmUGLiXlXDnPF1XssEk08G8cNkwXeIGzKe5; fpestid=R_W2PG9D7qzSP8Ofk_TBfDQD6a75vQC_eaHryDbWKodX9Qby-1D_jLOUFPz5Whgw-KsK1w",
};

/* ------------------ Allowed Sections ------------------ */
const ALLOWED_NAMES = [
    "china-updates",
    "all-updates",
    "sub-updates",
    "dub-updates",
];

/* ------------------ API Route ------------------ */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;

        /* ------------------ Validate ------------------ */
        if (!ALLOWED_NAMES.includes(name)) {
            return NextResponse.json(
                {
                    status: "error",
                    message: "Invalid category",
                },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(req.url);

        const page =
            Number(searchParams.get("page")) || 1;

        /* ------------------ Endpoint ------------------ */
        const url =
            `https://anikai.to/ajax/home/items?name=${name}&page=${page}`;

        /* ------------------ Fetch ------------------ */
        const res = await fetch(url, {
            headers: AJAX_HEADERS,
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();

            console.log("STATUS:", res.status);
            console.log("BODY:", text);

            throw new Error(
                `Failed to fetch: ${res.status}`
            );
        }

        const json = await res.json();

        /* ------------------ Parse HTML ------------------ */
        const html = json.result || "";

        const $ = cheerio.load(html);

        const data = $(".aitem")
            .map((_, el) => {
                const $el = $(el);

                const titleEl = $el.find(".title");

                const title =
                    titleEl.attr("title")?.trim() || "";

                const jpTitle =
                    titleEl.attr("data-jp")?.trim() || "";

                const link =
                    $el.find(".poster").attr("href") || "";

                const id =
                    link.split("/watch/")[1]
                        ?.split("#")[0] || "";

                const image =
                    $el.find("img")
                        .attr("data-src") || "";

                const subEpisode =
                    Number(
                        $el.find(".sub")
                            .text()
                            .trim()
                    ) || 0;

                const dubEpisode =
                    Number(
                        $el.find(".dub")
                            .text()
                            .trim()
                    ) || 0;

                const info =
                    $el.find(".info span b");

                const totalEpisodes =
                    info.length > 1
                        ? Number(
                            info.first()
                                .text()
                                .trim()
                        ) || null
                        : null;

                const type =
                    info.last()
                        .text()
                        .trim() || "";

                const isCompleted =
                    totalEpisodes !== null &&
                    subEpisode === totalEpisodes;

                const progress =
                    totalEpisodes && subEpisode
                        ? Number(
                            (
                                (subEpisode /
                                    totalEpisodes) *
                                100
                            ).toFixed(2)
                        )
                        : null;

                return {
                    id,
                    title,
                    jpTitle,
                    image,
                    link,
                    subEpisode,
                    dubEpisode,
                    totalEpisodes,
                    type,
                    isCompleted,
                    progress,
                };
            })
            .get();

        /* ------------------ Response ------------------ */
        return NextResponse.json({
            status: "ok",
            page,
            results: data.length,
            data,
        });
    } catch (error: any) {
        console.error("API ERROR:", error);

        return NextResponse.json(
            {
                status: "error",
                message:
                    error?.message ||
                    "Failed to fetch data",
            },
            { status: 500 }
        );
    }
}
