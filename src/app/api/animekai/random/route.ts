import { NextResponse } from "next/server";
import { HEADERS } from "../lib/config";

export async function GET() {
    try {
        const res = await fetch("https://anikai.to/random", {
            headers: {
                ...HEADERS,

                "Accept": "text/html, */*; q=0.01",
                "Accept-Language": "en-US,en;q=0.9",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",

                "Referer": "https://anikai.to/",
                "Connection": "keep-alive",
            },
        });

        const html = await res.text();

        // 🔍 Debug (very important)
        if (!html.includes("watch")) {
            return NextResponse.json({
                success: false,
                reason: "Blocked or different HTML",
                preview: html.slice(0, 300),
            });
        }

        // ✅ Robust regex
        const match = html.match(/url=['"]?([^'">\s]+)['"]?/i);

        if (!match) {
            return NextResponse.json({
                success: false,
                reason: "No redirect found",
                preview: html.slice(0, 300),
            });
        }

        const redirectUrl = match[1];
        const id = redirectUrl.split("/watch/")[1] || null;

        return NextResponse.json({
            success: true,
            id,
            url: redirectUrl,
        });
    } catch (err) {
        return NextResponse.json({
            success: false,
            error: String(err),
        });
    }
}