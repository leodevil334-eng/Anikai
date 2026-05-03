# API Routes Documentation

This document provides comprehensive documentation for all API routes available in the `src/app/api` directory.

## Table of Contents

- [Overview](#overview)
- [Anime Providers](#anime-providers)
  - [AnikaiSource](#anikaisource)
  - [Animelok](#animelok)
  - [Animesalt](#animesalt)
  - [Animeyy](#animeyy)
  - [Animixstream](#animixstream)
  - [Desidubanime](#desidubanime)
  - [Kaido](#kaido)
- [Meta APIs](#meta-apis)
  - [Anilist](#anilist)
  - [TMDB](#tmdb)
- [Manga APIs](#manga-apis)
  - [Mangaball](#mangaball)
  - [Allmanga](#allmanga)
  - [Atsu](#atsu)
- [Utility APIs](#utility-apis)
  - [Proxy](#proxy)
  - [Provider Check](#provider-check)
- [Testing](#testing)

## Overview

The API provides endpoints for anime streaming, metadata retrieval, manga reading, and utility functions. All routes follow Next.js App Router conventions and support caching, CORS, and proper error handling.

## Anime Providers

### AnikaiSource

**Base URL**: `/api/anikaiSource/[anilistId]`

- **Purpose**: Fetch anime episodes from Anikai provider
- **Method**: GET
- **Parameters**:
  - `anilistId` (path): AniList ID of the anime
- **Response**: Episode list with streaming URLs

### Animelok

**Base URL**: `/api/animelok/`

#### `/anime` - Get anime details
- **Method**: GET
- **Parameters**: `id` (query) - Anime ID
- **Response**: Anime metadata and episode list

#### `/source` - Get episode sources
- **Method**: GET
- **Parameters**: `episodeId` (query) - Episode ID
- **Response**: Available streaming sources for episode

### Animesalt

**Base URL**: `/api/animesalt/`

#### `/info` - Get anime information
- **Method**: GET
- **Parameters**: `id` (query) - AniList ID
- **Response**: Anime details, slug, season, and episode list
- **Features**: 
  - Automatic title normalization
  - Season detection
  - Hard-coded slug overrides for specific anime

#### `/episode` - Get episode sources
- **Method**: GET
- **Parameters**: `episodeId` (query) - Episode ID
- **Response**: Available sources from multiple providers (animesalt, animejoker)
- **Features**: 
  - Multiple source fallback
  - Iframe extraction
  - Localhost URL replacement for animesalt

### Animeyy

**Base URL**: `/api/animeyy/`

#### `/info` - Get anime information
- **Method**: GET
- **Parameters**: `id` (query) - Anime ID
- **Response**: Anime metadata and episode list

#### `/source` - Get episode sources
- **Method**: GET
- **Parameters**: `episodeId` (query) - Episode ID
- **Response**: Available streaming sources

### Animixstream

**Base URL**: `/api/animixstream/`

#### `/[episodeId]` - Get episode details
- **Method**: GET
- **Parameters**: `episodeId` (path) - Episode ID
- **Response**: Episode list with download links
- **Features**: 
  - Supabase integration for anime data
  - Download link extraction
  - No source scraping (returns download links only)

#### `/info` - Get anime information
- **Method**: GET
- **Parameters**: `anilistId` (path) - AniList ID
- **Response**: Anime metadata and episode information

#### `/source` - Get episode sources
- **Method**: GET
- **Parameters**: `id` (path) - Episode ID
- **Response**: Available streaming sources

### Desidubanime

**Base URL**: `/api/desidubanime/`

#### `/home` - Get homepage content
- **Method**: GET
- **Response**: Featured content including:
  - Hero section
  - Latest releases
  - Top airing
  - Most popular
  - Completed series
  - Latest episodes
  - Latest movies
  - Upcoming Hindi dub
- **Features**: 
  - AniList ID mapping
  - Caching (5 minutes)
  - Rate limiting protection

#### `/anime/[slug]` - Get anime details
- **Method**: GET
- **Parameters**: `slug` (path) - Anime slug
- **Response**: Anime metadata and episode list

#### `/sources` - Get episode sources
- **Method**: GET
- **Parameters**: `episodeId` (query) - Episode ID
- **Response**: Available streaming sources

#### `/shedule` - Get schedule
- **Method**: GET
- **Response**: Anime release schedule

### Kaido

**Base URL**: `/api/kaido/`

#### `/info` - Get anime information
- **Method**: GET
- **Parameters**: `anilistId` (query) - AniList ID
- **Response**: Comprehensive anime data including:
  - AniList metadata (title, format, episodes)
  - Kaido match information
  - Episode list with thumbnails
  - Season information
- **Features**:
  - AniList integration with rate limiting
  - Smart title matching with episode count scoring
  - Thumbnail mapping from AniList streaming episodes
  - Hard-coded slug overrides

#### `/episode` - Get episode sources
- **Method**: GET
- **Parameters**: `episodeId` (query) - Episode ID
- **Response**: Available streaming sources

#### `/servers` - Get available servers
- **Method**: GET
- **Parameters**: `episodeId` (query) - Episode ID
- **Response**: List of available streaming servers

#### `/stream` - Get stream URLs
- **Method**: GET
- **Parameters**: `episodeId` (query) - Episode ID
- **Response**: Stream URLs from available servers

## Meta APIs

### Anilist

**Base URL**: `/api/meta/anilist/[...route]`

Comprehensive AniList GraphQL API wrapper with caching and rate limiting.

#### Available Routes:

- **`/trending`** - Get trending anime
- **`/search`** - Search anime by query
- **`/advanced-search`** - Advanced search with filters
- **`/ongoing`** - Currently airing anime
- **`/recent`** - Recently updated anime
- **`/updates`** - Upcoming releases
- **`/new-releases`** - New releases
- **`/completed`** - Completed series
- **`/popular`** - Popular anime
- **`/spotlight`** - Featured anime
- **`/schedule`** - Airing schedule
- **`/country`** - Anime by country
- **`/releasing`** - Currently releasing
- **`/tv`** - TV series
- **`/movie`** - Movies
- **`/ona`** - Original net animations
- **`/ova`** - Original video animations
- **`/trending-range`** - Trending by time range
- **`/fetchNameid`** - Fetch anime by name
- **`/random-anime`** - Get random anime
- **`/seasons`** - Get anime seasons

#### Features:
- In-memory caching with TTL
- Request deduplication
- Rate limiting (350ms between requests)
- Retry logic with exponential backoff
- CORS support
- Pagination support

### TMDB

**Base URL**: `/api/meta/tmdb/[...route]`

The TMDB API routes are available but not documented in detail in the current codebase.

## Manga APIs

### Mangaball

**Base URL**: `/api/manga/mangaball/`

#### Available Routes:
- **`/home`** - Featured titles and banners
- **`/latest`** - Latest updated titles
- **`/recommendation`** - Recommended titles
- **`/popular`** - Popular titles this season
- **`/added`** - Recently added titles
- **`/new-chap`** - Titles with new chapters
- **`/foryou`** - Personalized suggestions
- **`/recent`** - Recent chapter reads
- **`/search`** - Search titles
- **`/filters`** - Advanced filtering with tags
- **`/manga`** - Browse Japanese Manga
- **`/manhwa`** - Browse Korean Manhwa
- **`/manhua`** - Browse Chinese Manhua
- **`/comics`** - Browse English Comics
- **`/ongoing`** - Browse ongoing series
- **`/completed`** - Browse completed series
- **`/detail/:slug`** - Full title details and chapter list
- **`/read/:id`** - Chapter images and metadata
- **`/tags`** - List all available tags/genres
- **`/tags-detail`** - Detailed tag statistics
- **`/image/*`** - Image proxy for bypass

### Allmanga

**Base URL**: `/api/manga/allmanga/`

#### Available Routes:
- **`/home`** - Home Page (Popular, Latest, Tags, Random)
- **`/latest`** - Latest updated titles
- **`/popular`** - Popular titles
- **`/random`** - Random recommendations
- **`/search`** - Search titles
- **`/tags`** - List all available tags, genres, and magazines
- **`/genre/:genre`** - Search titles by genre/tag slug
- **`/author/:author`** - Search titles by author slug
- **`/detail`** - Full title details and chapter list
- **`/read`** - Chapter images and metadata
- **`/image/*`** - Image proxy for CDN bypass

### Atsu

**Base URL**: `/api/manga/atsu/`

#### Standard Endpoints:
- **`/home`** - Get All Home Sections combined
- **`/trending`** - Trending titles
- **`/most-bookmarked`** - Most Bookmarked titles
- **`/hot-updates`** - Hot Updates
- **`/top-rated`** - Top Rated titles
- **`/popular`** - Popular titles
- **`/recently-added`** - Recently added titles

#### Discovery & Filters:
- **`/filters`** - List all valid Genre/Type/Status slugs
- **`/explore`** - Filtered search
- **`/genre/:slug`** - Browse titles by genre ID

#### Content Endpoints:
- **`/detail/:id`** - Full title details and complete chapter list
- **`/info/:id`** - Lightweight metadata + chapter list
- **`/read`** - Fetch pages for a chapter

#### Adult (18+) Endpoints:
- **`/adult/home`** - Get All Adult Home Sections combined
- **`/adult/explore`** - Filtered Adult search
- **`/adult/genre/:slug`** - Browse Adult titles by genre ID
- **`/adult/author/:slug`** - Browse Adult titles by author ID
- **`/adult/trending`** - Trending Adult titles
- **`/adult/most-bookmarked`** - Most Bookmarked Adult titles
- **`/adult/hot-updates`** - Hot Updates for Adult titles
- **`/adult/top-rated`** - Top Rated Adult titles
- **`/adult/popular`** - Popular Adult titles
- **`/adult/recently-added`** - Recently added Adult titles

#### Utils:
- **`/image/*`** - Image proxy for bypass

## Utility APIs

### Proxy

**Base URL**: `/api/proxy`

#### `/` - Proxy requests
- **Method**: GET
- **Parameters**: 
  - `url` (query) - Target URL to proxy
  - `referer` (query, optional) - Referer header
- **Response**: Proxied content with CORS headers
- **Features**:
  - Host filtering (allows only `as-cdn*.top`)
  - M3U8 playlist rewriting
  - Automatic CORS headers
  - Range request support

### Provider Check

**Base URL**: `/api/provider-check/[id]`

#### `/` - Check provider availability
- **Method**: GET
- **Parameters**: `id` (path) - AniList ID
- **Response**: Provider availability status
- **Features**:
  - Checks multiple providers in parallel
  - Returns fastest working provider
  - 5-minute caching
  - CORS support

## Testing

### Test File

**Location**: `/api/test.mjs`

A test file for extracting M3U8 URLs from FileMoon links.

**Usage**:
```bash
node src/app/api/test.mjs
```

**Example Output**:
```
m3u8: https://example.com/playlist.m3u8
```

## Common Features

### Caching
- Most endpoints implement caching with appropriate TTLs
- CDN caching headers for Vercel/Cloudflare
- In-memory caching for expensive operations

### CORS
- All endpoints include proper CORS headers
- Allow all origins for cross-domain requests

### Error Handling
- Consistent error response format
- Status codes for different error types
- Detailed error messages in development

### Rate Limiting
- AniList API includes rate limiting (350ms between requests)
- Request deduplication to prevent duplicate calls

### Pagination
- Most list endpoints support pagination
- Standard `page` and `perPage` parameters
- PageInfo objects with metadata

## Usage Examples

### Fetch Anime Episodes
```javascript
// Get episodes from Animesalt
const response = await fetch('/api/animesalt/info?id=12345');
const data = await response.json();
console.log(data.episodes);
```

### Search Anime
```javascript
// Search anime on AniList
const response = await fetch('/api/meta/anilist/search?q=attack+on+titan&page=1');
const data = await response.json();
console.log(data.results);
```

### Get Manga Chapters
```javascript
// Get manga chapters from Mangaball
const response = await fetch('/api/manga/mangaball/detail/attack-on-titan');
const data = await response.json();
console.log(data.chapters);
```

### Check Provider Availability
```javascript
// Check which providers have a specific anime
const response = await fetch('/api/provider-check/12345');
const data = await response.json();
console.log(data.fastest); // "animesalt"
console.log(data.providers); // { animesalt: true, kaido: false, ... }
```

## Notes

- All anime provider APIs require valid IDs (AniList ID, provider-specific ID, or slug)
- Manga APIs support multiple providers with unified endpoints
- Meta APIs provide comprehensive access to AniList data with caching
- Utility APIs offer proxy and provider checking functionality
- All endpoints are designed for production use with proper error handling and caching
