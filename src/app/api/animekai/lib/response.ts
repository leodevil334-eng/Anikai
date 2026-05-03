import { NextResponse } from "next/server";
import { AUTHOR_TAG } from "./config";

export function successResponse(
  data: Record<string, unknown>,
  status = 200
): NextResponse {
  return NextResponse.json(
    { Author: AUTHOR_TAG, ...data },
    {
      status,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}

export function errorResponse<T extends { error: string } = { error: string }>(
  message: string,
  status = 500
): NextResponse<T> {
  return NextResponse.json(
    { Author: AUTHOR_TAG, success: false, error: message } as unknown as T,
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
