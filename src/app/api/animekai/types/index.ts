export interface AnimeItem {
  title: string;
  japanese_title: string;
  slug: string;
  url: string;
  poster: string;
  sub_episodes: string;
  dub_episodes: string;
  total_episodes: string;
  year: string;
  type: string;
  rating: string;
}

export interface BrowseAnimeItem {
  title: string;
  japanese_title: string;
  slug: string;
  poster: string;
  sub_episodes: string;
  dub_episodes: string;
  total_episodes: string;
  year: string;
  rating: string;
  id: string;
  jpTitle?: string;
  url: string | null;
  image: string | null;
  subCount?: string;
  dubCount?: string;
  episodeCount?: string;
  type?: string;
}

export interface BannerItem {
  id: string;
  anilist_id: string;
  title: string;
  japanese_title: string;
  description: string;
  poster: string;
  url: string;
  sub_episodes: string;
  dub_episodes: string;
  type: string;
  genres: string;
  rating: string;
  release: string;
  quality: string;
}

export interface LatestItem {
  id: string;
  title: string;
  japanese_title: string;
  poster: string;
  url: string;
  current_episode: string;
  sub_episodes: string;
  dub_episodes: string;
  type: string;
}

export interface TrendingItem {
  id: string;
  rank: string;
  title: string;
  japanese_title: string;
  poster: string;
  url: string;
  sub_episodes: string;
  dub_episodes: string;
  type: string;
}

export interface sections {
  id: string;
  title: string;
  japanese_title: string;
  poster: string;
  url: string;
  current_episode: string;
  sub_episodes: string;
  dub_episodes: string;
  type: string;
}

export interface HomeData {
  banner: BannerItem[];
  top_trending: Record<string, TrendingItem[]>;
  sections: Record<string, sections[]>;
  latest: LatestItem[];
}

export interface AnimeDetail {
  ani_id: string;
  title: string;
  japanese_title: string;
  description: string;
  poster: string;
  banner: string;
  sub_episodes: string;
  dub_episodes: string;
  type: string;
  rating: string;
  mal_score: string;
  mal_id: string;
  al_id: string;
  detail: Record<string, string | string[]>;
  seasons: SeasonItem[];
  episodes: Episode[];
  recommended: RecommendedItem[];
}

export interface RecommendedItem {
  id: string;
  title: string;
  japanese_title: string;
  poster: string;
  url: string;
  sub_episodes: string;
  dub_episodes: string;
  type: string;
  episodes: string;
}

export interface SeasonItem {
  title: string;
  episodes: string;
  poster: string;
  url: string;
  active: boolean;
}

export interface Episode {
  number: string;
  slug: string;
  title: string;
  japanese_title: string;
  token: string;
  has_sub: boolean;
  has_dub: boolean;
  image?: string;
}

export interface Server {
  name: string;
  server_id: string;
  episode_id: string;
  link_id: string;
}

export interface ServersData {
  watching: string;
  servers: Record<string, Server[]>;
}

export interface SourceData {
  embed_url: string;
  skip: Record<string, unknown>;
  sources: unknown[];
  tracks: unknown[];
  download: string;
}

export interface MostSearchedItem {
  name: string;
  keyword: string;
  search_url: string;
}

export interface ApiError {
  success: false;
  error: string;
}

export interface ApiSuccess<T> {
  success: true;
  Author: string;
  [key: string]: unknown;
}

// types/index.ts


export interface ScrapedResponse {
  success: boolean;
  count: number;
  totalCount?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: any;
  data: Partial<AnimeItem>[];
  error?: string;
}