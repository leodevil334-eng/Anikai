import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { AJAX_HEADERS } from "../lib/config";
import { successResponse, errorResponse } from "../lib/response";

const BASE_URL = "https://anikai.to";



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

async function getTimezoneFromIP(ip: string): Promise<string> {
    try {
        const res = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await res.json();
        if (data.timezone) {
            const now = new Date();
            const offset = now.toLocaleString('en', { timeZone: data.timezone, timeZoneName: 'short' }).match(/GMT([+-]\d{2}:\d{2})/)?.[1] || '+05:30';
            return offset;
        }
    } catch (err) {
        console.error('Failed to get timezone from IP:', err);
    }
    return '+05:30';
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let time = searchParams.get("time");

        // Get user's IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
        const tz = await getTimezoneFromIP(ip);
        const TZ = encodeURIComponent(tz);

        const scheduleRes = await fetch(`${BASE_URL}/ajax/schedule`, {
            headers: AJAX_HEADERS,
        });

        const scheduleData = await scheduleRes.json();
        const $ = cheerio.load(scheduleData.result);

        const days: any[] = [];
        let activeTime = "";

        $(".day").each((_, el) => {
            const timestamp = $(el).attr("data-time") || "";

            const dayObj = {
                day: $(el).find("span").text(),
                date: $(el).find("div").text(),
                fullDate: $(el).attr("title"),
                timestamp,
                active: $(el).hasClass("active"),
            };

            if (dayObj.active) activeTime = timestamp;
            days.push(dayObj);
        });

        const selectedTime = time || activeTime;

        const itemsRes = await fetch(
            `${BASE_URL}/ajax/schedule/items?tz=${TZ}&time=${selectedTime}`,
            { headers: { "X-Requested-With": "XMLHttpRequest" } }
        );

        const itemsData = await itemsRes.json();
        const $$ = cheerio.load(itemsData.result);

        const items: any[] = [];

        $$("li").each((_, el) => {
            const link = $$(el).find("a");

            items.push({
                id: link.attr("href")?.split("/").pop() || "",
                time: link.find(".time").text(),
                title: link.find(".title").text(),
                jpTitle: link.find(".title").attr("data-jp") || null,
                episode: link.find("span").last().text(),
                url: BASE_URL + link.attr("href"),
                isCurrent: link.hasClass("current"),
                isPassed: link.hasClass("passed"),
            });
        });

        const schedule = items;

        const response = successResponse({
            status: "ok",
            selectedTime,
            days,
            schedule,
        });
        
        // Add CORS headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return response;
    } catch (err) {
        console.error(err);
        return errorResponse("Failed");
    }
}
