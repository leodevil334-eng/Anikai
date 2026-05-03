// app/api/anime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { BrowseAnimeItem } from '../types';
import { HEADERS } from '../lib/config';



export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Build filter parameters from request
        const params = new URLSearchParams();
        params.append('keyword', searchParams.get('keyword') || '');

        // Handle array parameters from query string
        const genres = searchParams.getAll('genre[]');
        genres.forEach(genre => params.append('genre[]', genre));

        const type = searchParams.getAll('type[]');
        type.forEach(type => params.append('type[]', type));

        const statuses = searchParams.getAll('status[]');
        statuses.forEach(status => params.append('status[]', status));
        const seasons = searchParams.getAll('season[]');
        seasons.forEach(season => params.append('season[]', season));

        const years = searchParams.getAll('year[]');
        years.forEach(year => params.append('year[]', year));

        const ratings = searchParams.getAll('rating[]');
        ratings.forEach(rating => params.append('rating[]', rating));

        const countries = searchParams.getAll('country[]');
        countries.forEach(country => params.append('country[]', country));

        const languages = searchParams.getAll('language[]');
        languages.forEach(language => params.append('language[]', language));
        const page = searchParams.get('page');

        // Add page parameter if provided
        if (page) params.append('page', page);

        const url = `https://anikai.to/browser?${params.toString()}`;
        console.log('Fetching URL:', url);

        const response = await axios.get(url, {
            headers: HEADERS
        });

        const $ = cheerio.load(response.data);
        const animeList: Partial<BrowseAnimeItem>[] = [];

        // Extract data from .aitem elements
        $('.aitem').each((index, element) => {
            // Get the inner div
            const inner = $(element).find('.inner');

            // Extract title - from <a class="title"> tag
            const titleElement = inner.find('a.title');
            const title = titleElement.text().trim();
            const jpTitle = titleElement.attr('data-jp') || '';

            // Extract URL
            const posterLink = inner.find('a.poster');
            const relativeUrl = posterLink.attr('href');
            const url = relativeUrl ? `https://anikai.to${relativeUrl}` : null;
            const id = url?.split('/').pop() || '';
            // Extract image
            const imgElement = inner.find('img.lazyload');
            const imageUrl = imgElement.attr('data-src') || imgElement.attr('src');

            // Extract info
            const infoSpans = inner.find('.info span');
            let subCount = '';
            let dubCount = '';
            let episodeCount = '';
            let animeType = '';

            infoSpans.each((i, span) => {
                const text = $(span).text().trim();
                const hasSubIcon = $(span).find('svg use[href="#sub"]').length > 0;
                const hasDubIcon = $(span).find('svg use[href="#dub"]').length > 0;

                if (hasSubIcon) {
                    subCount = text;
                } else if (hasDubIcon) {
                    dubCount = text;
                } else if (text.match(/^\d+$/)) {
                    episodeCount = text;
                } else if (text === 'TV' || text === 'ONA' || text === 'Movie' || text === 'OVA') {
                    animeType = text;
                }
            });

            // Also check for episode count in the info div (sometimes appears as bold text)
            const episodeBold = inner.find('.info b').first().text().trim();
            if (episodeBold && !episodeCount) {
                episodeCount = episodeBold;
            }

            if (title) {
                animeList.push({
                    id: id,
                    title: title,
                    jpTitle: jpTitle,
                    url: url,
                    image: imageUrl,
                    subCount: subCount,
                    dubCount: dubCount,
                    episodeCount: episodeCount,
                    type: animeType
                });
            }
        });

        // Extract pagination info
        const pagination = {
            currentPage: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
        };

        const paginationLinks = $('.pagination .page-link');
        paginationLinks.each((i, link) => {
            const text = $(link).text().trim();
            const href = $(link).attr('href');

            if (text && !isNaN(Number(text)) && $(link).parent().hasClass('active')) {
                pagination.currentPage = parseInt(text);
            }

            if (href && href.includes('page=')) {
                const pageMatch = href.match(/page=(\d+)/);
                if (pageMatch) {
                    const pageNum = parseInt(pageMatch[1]);
                    if ($(link).parent().hasClass('next') || $(link).attr('rel') === 'next') {
                        pagination.hasNext = true;
                    }
                    if (!pagination.totalPages || pageNum > pagination.totalPages) {
                        pagination.totalPages = pageNum;
                    }
                }
            }
        });

        // Get total anime count from the header
        let totalCount = 0;
        const countText = $('.shead span').last().text().trim();
        const countMatch = countText.match(/(\d+(?:,\d+)?)/);
        if (countMatch) {
            totalCount = parseInt(countMatch[1].replace(/,/g, ''));
        }

        const jsonResponse = NextResponse.json({
            success: true,
            count: animeList.length,
            totalCount: totalCount,
            pagination: pagination,
            filters: {
                genres: genres,
                statuses: statuses,
                seasons: seasons,
                years: years,
                ratings: ratings,
                countries: countries,
                languages: languages
            },
            data: animeList
        });

        jsonResponse.headers.set('Access-Control-Allow-Origin', '*');
        jsonResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return jsonResponse;

    } catch (error) {
        console.error('Error:', error);
        const errorResponse = NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        }, { status: 500 });

        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return errorResponse;
    }
}