import { NextResponse } from "next/server";

const PROVIDERS = [
  "zoro",
  "yuki",
  "pahe",
  "kai",
  "desidubanime",
  "animesalt",
];

const BASE_API = "https://mapper-kiro.vercel.app";
const YUKI = "https://undec-senpa.vercel.app";
const ANI = "https://anilistapi.vercel.app";

async function checkProvider(id: string, provider: string) {
  try {
    let apiUrl: string;

    // DESI
    if (provider === "desidubanime") {
      apiUrl = `${BASE_API}/api/desidubanime/anime/${id}`;

      const res = await fetch(apiUrl);
      if (!res.ok) return false;

      const json = await res.json();

      return Array.isArray(json?.episodes) && json.episodes.length > 0;
    }

    // AnimeSalt
    if (provider === "animesalt") {
      apiUrl = `${BASE_API}/api/animesalt/info?id=${id}`;

      const res = await fetch(apiUrl);
      if (!res.ok) return false;

      const json = await res.json();

      return Array.isArray(json?.episodes) && json.episodes.length > 0;
    }

    // Yuki
    if (provider === "yuki") {
      apiUrl = `${YUKI}/api/animekai/anikai/${id}`;

      const res = await fetch(apiUrl);
      if (!res.ok) return false;

      const json = await res.json();

      return Array.isArray(json?.episodes) && json.episodes.length > 0;
    }

    // Zoro
    if (provider === "zoro") {
      apiUrl = `${BASE_API}/api/zoro/ani_id/${id}`;

      const res = await fetch(apiUrl);
      if (!res.ok) return false;

      const json = await res.json();

      return !!json?.success;
    }

    // Pahe
    if (provider === "pahe") {
      apiUrl = `${ANI}/api/meta/anilist/info/${id}/episodes`;

      const res = await fetch(apiUrl);
      if (!res.ok) return false;

      const json = await res.json();

      return Array.isArray(json) && json.length > 0;
    }

    // Kai
    if (provider === "kai") {
      apiUrl = `${BASE_API}/api/animekai/ani_id/${id}`;

      const res = await fetch(apiUrl);
      if (!res.ok) return false;

      const json = await res.json();

      return Array.isArray(json?.episodes) && json.episodes.length > 0;
    }

    return false;
  } catch (err) {
    console.error(`${provider} failed:`, err);
    return false;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const results: Record<string, boolean> = {};
  let fastestProvider: string | null = null;

  await Promise.all(
    PROVIDERS.map(async (provider) => {
      const isWorking = await checkProvider(id, provider);

      results[provider] = isWorking;

      if (isWorking && !fastestProvider) {
        fastestProvider = provider;
      }
    })
  );

  return NextResponse.json(
    {
      success: true,
      fastest: fastestProvider,
      providers: results
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    }
  );
}
