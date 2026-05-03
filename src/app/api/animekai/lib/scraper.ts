import * as cheerio from "cheerio";
import { config, HEADERS, AJAX_HEADERS } from "./config";
import { parseInfoSpans } from "./parser";
import { encodeToken, decodeKai, decodeMega } from "./crypto";
import { MegaUp } from "./megacup";
import type {
  AnimeItem,
  BannerItem,
  TrendingItem,
  HomeData,
  AnimeDetail,
  Episode,
  ServersData,
  SourceData,
  MostSearchedItem,
  RecommendedItem,
} from "../types";


// ---------- most-searched ----------

export async function scrapeMostSearched(): Promise<MostSearchedItem[]> {
  try {
    const res = await fetch(config.ANIMEKAI_URL, {
      headers: HEADERS,
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    // ✅ Robust selector
    let section = $(".most-searched");
    if (!section.length) section = $(".most_searched");

    // ❗ DO NOT throw — just return empty
    if (!section.length) {
      console.warn("most-searched not found");
      return [];
    }

    const base = config.ANIMEKAI_URL.replace(/\/$/, "");
    const results: MostSearchedItem[] = [];

    section.find("a").each((_, el) => {
      try {
        const name = $(el).text().trim();
        const href = $(el).attr("href") || "";

        if (!name || !href) return;

        let keyword = "";

        if (href.includes("keyword=")) {
          const raw = href.split("keyword=").pop() || "";
          try {
            keyword = decodeURIComponent(raw.replace(/\+/g, " "));
          } catch {
            keyword = raw.replace(/\+/g, " ");
          }
        }

        results.push({
          name,
          keyword,
          search_url: href.startsWith("/")
            ? `${base}${href}`
            : href,
        });
      } catch (err) {
        // 🔥 Skip broken item instead of crashing whole API
        console.warn("item parse error", err);
      }
    });

    return results;
  } catch (err) {
    console.error("scrapeMostSearched failed:", err);

    // ✅ Never crash API
    return [];
  }
}

// ---------- search ----------

export async function searchAnime(keyword: string): Promise<AnimeItem[]> {
  const url = new URL(config.ANIMEKAI_SEARCH_URL);
  url.searchParams.set("keyword", keyword);

  const res = await fetch(url.toString(), {
    headers: AJAX_HEADERS,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const html: string = json?.result?.html ?? "";
  if (!html) return [];

  const $ = cheerio.load(html);
  const results: AnimeItem[] = [];

  $("a.aitem").each((_, el) => {
    const item = $(el);
    const titleTag = item.find("h6.title");
    const title = titleTag.text().trim();
    const japanese_title = titleTag.attr("data-jp") ?? "";
    const poster = item.find(".poster img").attr("src") ?? "";
    const href = item.attr("href") ?? "";
    const slug = href.startsWith("/watch/") ? href.replace("/watch/", "") : href;

    let sub = "",
      dub = "",
      animeType = "",
      year = "",
      rating = "",
      total_eps = "";

    item.find(".info span").each((_, span) => {
      const cls = $(span).attr("class")?.split(" ") ?? [];
      const text = $(span).text().trim();
      if (cls.includes("sub")) sub = text;
      else if (cls.includes("dub")) dub = text;
      else if (cls.includes("rating")) rating = text;
      else {
        const hasB = $(span).find("b").length > 0;
        if (hasB && /^\d+$/.test(text)) total_eps = text;
        else if (hasB) animeType = text;
        else year = text;
      }
    });

    if (title) {
      results.push({
        title,
        japanese_title,
        slug,
        url: `${config.ANIMEKAI_URL.replace(/\/$/, "")}${href}`,
        poster,
        sub_episodes: sub,
        dub_episodes: dub,
        total_episodes: total_eps,
        year,
        type: animeType,
        rating,
      });
    }
  });

  return results;
}

// ---------- home ----------

export async function scrapeHome(): Promise<HomeData> {
  const res = await fetch(config.ANIMEKAI_HOME_URL, {
    headers: HEADERS,
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const $ = cheerio.load(await res.text());
  const base = config.ANIMEKAI_URL.replace(/\/$/, "");

  // Banner
  const banner: BannerItem[] = [];
  const slides = $(".swiper-slide").toArray();

  for (const el of slides) {
    const slide = $(el);

    const style = slide.attr("style") ?? "";
    const poster = style.includes("url(")
      ? style.split("url(")[1].split(")")[0]
      : "";

    const titleTag = slide.find("p.title");
    const href = slide.find("a.watch-btn").attr("href") || "";
    const id = href.startsWith("/watch/") ? href.slice(7) : "";

    const title = titleTag.text().trim();
    const japanese_title = titleTag.attr("data-jp") ?? "";

    const description = slide.find("p.desc").text().trim();

    const infoEl = slide.find(".info");
    const { sub, dub, animeType } = parseInfoSpans($, infoEl);

const anilist_id =
      slide.find(".user-bookmark").attr("data-alid")?.trim() || "";
    let genres = "";
    infoEl.find("span").each((_, span) => {
      const cls = $(span).attr("class") ?? "";
      if (!cls && !$(span).find("b").length) {
        const t = $(span).text().trim();
        if (t && !/^\d+$/.test(t)) genres = t;
      }
    });

    let rating = "", release = "", quality = "";
    slide.find(".mics > div").each((_, div) => {
      const lbl = $(div).find("div").first().text().trim().toLowerCase();
      const val = $(div).find("span").first().text().trim();
      if (lbl === "rating") rating = val;
      else if (lbl === "release") release = val;
      else if (lbl === "quality") quality = val;
    });

    if (title) {
      banner.push({
        id,
        anilist_id,
        title,
        japanese_title,
        description,
        poster,
        url: href ? `${base}${href}` : "",
        sub_episodes: sub,
        dub_episodes: dub,
        type: animeType,
        genres,
        rating,
        release,
        quality,
      });
    }
  }



  // Trending
  const top_trending: Record<string, TrendingItem[]> = {};
  const TAB_MAP: Record<string, string> = {
    trending: "NOW",
    day: "DAY",
    week: "WEEK",
    month: "MONTH",
  };

  for (const [tabId, tabLabel] of Object.entries(TAB_MAP)) {
    const container = $(`.aitem-col.top-anime[data-id="${tabId}"]`);
    if (!container.length) continue;
    const items: TrendingItem[] = [];

    const elements = container.find("a.aitem").toArray();
    for (const el of elements) {
      const item = $(el);
      const style = item.attr("style") ?? "";
      const poster = style.includes("url(")
        ? style.split("url(")[1].split(")")[0]
        : "";
      const { sub, dub, animeType } = parseInfoSpans($, item.find(".info"));
      const id = item.attr("href")?.split("/").pop() ?? "";

      items.push({
        id: id,
        rank: item.find(".num").text().trim(),
        title: item.find(".detail .title").text().trim(),
        japanese_title: item.find(".detail .title").attr("data-jp") ?? "",
        poster,
        url: `${base}${item.attr("href") ?? ""}`,
        sub_episodes: sub,
        dub_episodes: dub,
        type: animeType,
      });
    }

    top_trending[tabLabel] = items;
  }

  // Latest
  const latest: any[] = [];
  const latestItems = $(".aitem-wrapper.regular .aitem").toArray();
  for (const el of latestItems) {
    const item = $(el);
    const titleTag = item.find("a.title");
    let href = item.find("a.poster").attr("href") ?? "";
    const episode = href.includes("#ep=") ? href.split("#ep=").pop()! : "";
    href = href.split("#ep=")[0];
    const id = href.startsWith("/watch/") ? href.slice(7) : "";
    const { sub, dub, animeType } = parseInfoSpans($, item.find(".info"));
    if (titleTag.text().trim()) {
      latest.push({
        id: id,
        title: titleTag.text().trim(),
        japanese_title: titleTag.attr("data-jp") ?? "",
        poster: item.find("img.lazyload").attr("data-src") ?? "",
        url: `${base}${href}`,
        current_episode: episode,
        sub_episodes: sub,
        dub_episodes: dub,
        type: animeType,
      });
    }
  }


  //
  const sections: Record<string, any[]> = {};

  /* ------------------ ⚡ Parse Sections ------------------ */
  const sectionSlides = $(".alist-group .swiper-slide").toArray();

  for (const slideEl of sectionSlides) {
    const slide = $(slideEl);

    const sectionTitle = slide
      .find(".stitle")
      .text()
      .trim()
      .toLowerCase(); // "new releases", "upcoming", "completed"

    const items = slide.find(".aitem").toArray();

    const parsedItems: any[] = [];
    items.forEach((el) => {
      const item = $(el);

      const titleTag = item.find(".title");
      const href = item.attr("href") ?? "";

      const id =
        href.split("/watch/")[1]?.split("#")[0] || "";

      const episode = href.includes("#ep=")
        ? href.split("#ep=").pop()
        : "";

      const poster =
        item.find("img.lazyload").attr("data-src") ?? "";

      const title = titleTag.text().trim();
      const japanese_title = titleTag.attr("data-jp") ?? "";

      const infoEl = item.find(".info");
      const { sub, dub, animeType } = parseInfoSpans($, infoEl);

      parsedItems.push({
        id,
        title,
        japanese_title,
        poster,
        url: `${base}${href}`,
        current_episode: episode,
        sub_episodes: sub,
        dub_episodes: dub,
        type: animeType,
      });
    });

    sections[sectionTitle] = parsedItems;
  }

  return { banner, top_trending, sections, latest };
}

// ---------- anime info ----------

export async function scrapeAnimeInfo(slug: string): Promise<AnimeDetail | null> {
  const url = `${config.ANIMEKAI_URL}watch/${slug}`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });

  // Gracefully handle 404 and other errors instead of throwing
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`HTTP ${res.status}`);
  }

  const $ = cheerio.load(await res.text());

  let ani_id = "";
  const syncScript = $("script#syncData");
  if (syncScript.length) {
    try {
      ani_id = JSON.parse(syncScript.html() ?? "")?.anime_id ?? "";
    } catch {
      /* ignore */
    }
  }

  const infoEl = $(".main-entity .info");
  const { sub, dub, animeType } = parseInfoSpans($, infoEl);

  const detail: Record<string, string | string[]> = {};
  $(".detail > div > div").each((_, div) => {
    const text = $(div).text().replace(/\s+/g, " ").trim();
    if (!text.includes(":")) return;
    const [rawKey, ...rest] = text.split(":");
    const key = rawKey.trim().toLowerCase().replace(/\s+/g, "_");
    const links = $(div).find("span a");
    detail[key] = links.length
      ? links.map((_, a) => $(a).attr("href") || $(a).text().trim()).get()
      : rest.join(":").trim();
  });

  let mal_id = "";
  let al_id = "";
  if (Array.isArray(detail.links)) {
    for (const link of detail.links as string[]) {
      if (link.includes("myanimelist.net/anime/")) {
        mal_id = link.split("/anime/")[1]?.split("/")[0] ?? "";
      } else if (link.includes("anilist.co/anime/")) {
        al_id = link.split("/anime/")[1]?.split("/")[0] ?? "";
      }
    }
  }

  const seasons = $(".swiper-wrapper.season .aitem")
    .map((_, el) => {
      const item = $(el);
      const d = item.find(".detail");
      return {
        title: d.find("span").first().text().trim(),
        episodes: d.find(".btn").first().text().trim(),
        poster: item.find("img").attr("src") ?? "",
        url: item.find("a.poster").length
          ? `${config.ANIMEKAI_URL.replace(/\/$/, "")}${item.find("a.poster").attr("href") ?? ""
          }`
          : "",
        active: (item.attr("class") ?? "").includes("active"),
      };
    })
    .get();

  const bgEl = $(".watch-section-bg");
  const bgStyle = bgEl.attr("style") ?? "";
  const bannerImg =
    bgStyle.includes("url(") ? bgStyle.split("url(")[1].split(")")[0] : "";

  const recommended: RecommendedItem[] = [];
  const recHeader = $(".stitle").filter((_, el) => $(el).text().trim() === "Recommended");
  if (recHeader.length) {
    recHeader.parent().next(".aitem-col").find("a.aitem").each((_, el) => {
      const item = $(el);
      const href = item.attr("href") ?? "";
      const id = href.split("/watch/")[1]?.split("#")[0] || href.split("/").pop() || "";
      const style = item.attr("style") ?? "";
      const poster = style.includes("url(")
        ? style.split("url(")[1].split(")")[0].replace(/['"]/g, "")
        : "";
      const { sub, dub, animeType } = parseInfoSpans($, item.find(".info"));
      
      // Extract total episodes from the bold span that is not the type
      let episodes = "";
      item.find(".info span b").each((_, bEl) => {
        const text = $(bEl).text().trim();
        if (/^\d+$/.test(text)) {
          episodes = text;
        }
      });

      recommended.push({
        id,
        title: item.find(".title").text().trim(),
        japanese_title: item.find(".title").attr("data-jp") ?? "",
        poster,
        url: href.startsWith("/") ? `${config.ANIMEKAI_URL.replace(/\/$/, "")}${href}` : href,
        sub_episodes: sub,
        dub_episodes: dub,
        type: animeType,
        episodes,
      });
    });
  }

  const episodes: Episode[] = [];
  try {
    const epRes = await fetchEpisodes(ani_id);
    episodes.push(...epRes);
  } catch (e) {
    // ignore
  }

  return {
    ani_id,
    mal_id,
    al_id,
    title: $("h1.title").first().text().trim(),
    japanese_title: $("h1.title").first().attr("data-jp") ?? "",
    description: $(".desc").first().text().trim(),
    poster: $(".poster img[itemprop='image']").attr("src") ?? "",
    banner: bannerImg,
    sub_episodes: sub,
    dub_episodes: dub,
    type: animeType,
    rating: infoEl.find(".rating").first().text().trim(),
    mal_score: $(".rate-box .value").first().text().trim(),
    detail,
    seasons,
    episodes,
    recommended,
  };
}

// ---------- episodes ----------

export async function fetchEpisodes(ani_id: string): Promise<Episode[]> {
  const encoded = await encodeToken(ani_id);
  if (!encoded) throw new Error("Token encryption failed");

  const url = new URL(config.ANIMEKAI_EPISODES_URL);
  url.searchParams.set("ani_id", ani_id);
  url.searchParams.set("_", encoded);

  const res = await fetch(url.toString(), {
    headers: AJAX_HEADERS,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html: string = (await res.json())?.result ?? "";
  if (!html) return [];

  const $ = cheerio.load(html);
  const episodes: Episode[] = [];

  $(".eplist a").each((_, el) => {
    const ep = $(el);
    const langs = ep.attr("langs") ?? "0";
    episodes.push({
      number: ep.attr("num") ?? "",
      slug: ep.attr("slug") ?? "",
      title: ep.find("span").first().text().trim(),
      japanese_title: ep.find("span").first().attr("data-jp") ?? "",
      token: ep.attr("token") ?? "",
      has_sub: /^\d+$/.test(langs) ? Boolean(parseInt(langs) & 1) : false,
      has_dub: /^\d+$/.test(langs) ? Boolean(parseInt(langs) & 2) : false,
    });
  });

  return episodes;
}

// ---------- servers ----------

export async function fetchServers(ep_token: string): Promise<ServersData> {
  const encoded = await encodeToken(ep_token);
  if (!encoded) throw new Error("Token encryption failed");

  const url = new URL(config.ANIMEKAI_SERVERS_URL);
  url.searchParams.set("token", ep_token);
  url.searchParams.set("_", encoded);

  const res = await fetch(url.toString(), {
    headers: AJAX_HEADERS,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html: string = (await res.json())?.result ?? "";
  const $ = cheerio.load(html);

  const servers: Record<string, ServersData["servers"][string]> = {};
  $(".server-items").each((_, group) => {
    const lang = $(group).attr("data-id") ?? "unknown";
    servers[lang] = $(group)
      .find(".server")
      .map((_, s) => ({
        name: $(s).text().trim(),
        server_id: $(s).attr("data-sid") ?? "",
        episode_id: $(s).attr("data-eid") ?? "",
        link_id: $(s).attr("data-lid") ?? "",
      }))
      .get();
  });

  return {
    watching: $(".server-note p").first().text().trim(),
    servers,
  };
}

// ---------- source ----------

export async function resolveSource(link_id: string): Promise<SourceData> {
  console.log("🔍 resolveSource called with:", link_id);

  // 🔐 Generate token using MegaUp API
  const encoded = await MegaUp.generateToken(link_id);
  console.log("🔐 Encoded token:", encoded);

  if (!encoded) throw new Error("Token encryption failed");

  const url = new URL(config.ANIMEKAI_LINKS_VIEW_URL);
  url.searchParams.set("id", link_id);
  url.searchParams.set("_", encoded);

  console.log("🌐 Fetching links view URL:", url.toString());

  const res = await fetch(url.toString(), {
    headers: AJAX_HEADERS,
    next: { revalidate: 0 },
  });

  console.log("📡 Response status (links view):", res.status);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Detect Cloudflare HTML response before trying to parse JSON
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const rawHtml = await res.text();
    console.error("⚠️  GOT CLOUDFLARE BLOCK PAGE instead of JSON");
    throw new Error("Cloudflare blocked this request. Use residential proxy for deployment.");
  }

  const json = await res.json();
  console.log("📦 Raw links view response:", json);

  const encryptedResult: string = json?.result ?? "";
  console.log("🔒 Encrypted result:", encryptedResult);

  // 🔓 Decode iframe data using MegaUp
  const embedData = await MegaUp.decodeIframeData(encryptedResult);
  console.log("🔓 Decrypted embed data:", embedData);

  if (!embedData) throw new Error("Embed decryption failed");

  const embedUrl = embedData.url || "";
  console.log("🎬 Embed URL:", embedUrl);

  if (!embedUrl) throw new Error("No embed URL found");

  // Always set embed_url to the HTML page
  let embed_url = embedUrl;

  // 🚀 Extract final sources from the real iframe src
  let extracted;
  try {
    // Fetch the embed page to get the real iframe src for extraction
    const embedRes = await fetch(embedUrl, { headers: HEADERS });
    if (!embedRes.ok) throw new Error(`Failed to fetch embed page: ${embedRes.status}`);
    const html = await embedRes.text();
    const $ = cheerio.load(html);
    const realIframeSrc = $('iframe').attr('src');
    if (!realIframeSrc) throw new Error("No iframe src found in embed page");

    extracted = await MegaUp.extract(realIframeSrc);
    console.log("🎥 Extracted media from real iframe src:", extracted);
  } catch (error) {
    console.log("⚠️ M3U8 extraction failed, falling back to iframe:", error);
    extracted = {
      sources: [{ url: embedUrl, isM3U8: false }],
      subtitles: [],
      download: "",
    };
  }

  const output: SourceData = {
    embed_url,
    skip: embedData.skip ?? {},
    sources: extracted.sources ?? [],
    tracks: extracted.subtitles ?? [],
    download: extracted.download ?? "",
  };

  console.log("✅ Final output:", output);

  return output;
}
