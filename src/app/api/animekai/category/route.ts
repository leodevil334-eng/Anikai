// /src/app/api/category/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { HEADERS } from '../lib/config';
import { successResponse, errorResponse } from '../lib/response';



export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const category = searchParams.get('category') || 'new-releases';
        const page = searchParams.get('page') || '1';

        // ✅ Simple URL (no filters)
        const targetUrl = `https://anikai.to/${category}?page=${page}`;
        console.log(targetUrl);

        const response = await fetch(targetUrl, {
            headers: HEADERS,
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // ✅ Anime list
        const animeList: any[] = [];

        for (const element of $('.aitem').toArray()) {
            const $inner = $(element).find('.inner');

            const poster =
                $inner.find('.poster img').attr('data-src') ||
                $inner.find('.poster img').attr('src') ||
                '';

            const title = $inner.find('.title').text().trim();
            const link = $inner.find('.poster').attr('href') || '';

            const $info = $inner.find('.info');

            let episodeCount = '';
            let animeType = '';
            let subCount = '';
            let dubCount = '';

            $info.find('span').each((_, span) => {
                const $span = $(span);

                const icon = $span.find('use').attr('href');

                if (icon === '#sub') {
                    subCount = $span.text().trim();
                }
                if (icon === '#dub') {
                    dubCount = $span.text().trim();
                }

                const text = $span.text().trim();

                if (!isNaN(Number(text)) && text !== '') {
                    episodeCount = text;
                } else if (text && !animeType) {
                    animeType = text;
                }
            });

            const hasAdult = $inner.find('.tags .adult').length > 0;

            animeList.push({
                id: link.split('/').pop() || '',
                title,
                poster: poster
                    ? `${poster}`
                    : '',
                url: `https://anikai.to${link}`,
                episodeCount,
                type: animeType,
                sub_episodes: subCount,
                dub_episodes: dubCount,
                isAdult: hasAdult,
            });
        }

        // ✅ Pagination parsing based on actual HTML structure
        const pagination = {
            currentPage: Number(page),
            hasNext: false,
            hasPrev: false,
            totalPages: 1,
            nextPage: null as number | null,
            prevPage: null as number | null,
        };

        // Get all pagination links
        const $pagination = $('.pagination');
        const $pageItems = $pagination.find('.page-item');

        // Extract total pages from the last page number
        let lastPageNumber = 1;

        $pageItems.each((_, item) => {
            const $item = $(item);
            const $link = $item.find('a.page-link');
            const $span = $item.find('span.page-link');

            // Get page number from text content
            let pageText = '';
            if ($link.length) {
                pageText = $link.text().trim();
            } else if ($span.length && !$item.hasClass('active')) {
                pageText = $span.text().trim();
            } else if ($item.hasClass('active')) {
                pageText = $span.text().trim();
            }

            // Check if it's a number (not an icon or empty)
            if (pageText && /^\d+$/.test(pageText)) {
                const pageNum = parseInt(pageText, 10);
                if (pageNum > lastPageNumber) {
                    lastPageNumber = pageNum;
                }
            }
        });

        pagination.totalPages = lastPageNumber;

        // Find next and previous pages
        $pageItems.each((_, item) => {
            const $item = $(item);
            const $link = $item.find('a.page-link');
            const href = $link.attr('href') || '';
            const hasIcon = $link.find('i').length > 0;

            // Get the text content (might be icon or number)
            const linkText = $link.text().trim();

            // Check for next page (» icon or "next" text)
            if (hasIcon || linkText === '»' || linkText === 'Next') {
                const match = href.match(/[?&]page=(\d+)/);
                if (match) {
                    const nextPageNum = parseInt(match[1], 10);
                    pagination.hasNext = true;
                    pagination.nextPage = nextPageNum;
                }
            }

            // Check for previous page (« icon or "prev" text)
            if ((hasIcon && $link.find('i.fa-angle-left').length) || linkText === '«' || linkText === 'Prev') {
                const match = href.match(/[?&]page=(\d+)/);
                if (match) {
                    const prevPageNum = parseInt(match[1], 10);
                    pagination.hasPrev = true;
                    pagination.prevPage = prevPageNum;
                }
            }
        });

        return successResponse({
            success: true,
            data: {
                category,
                animeList,
                pagination,
            },
        });
    } catch (error: any) {
        return errorResponse(error.message);
    }
}