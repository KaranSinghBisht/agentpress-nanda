import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Editor-Key",
} as const;

/** JSON response with CORS headers. Every API response goes through this. */
export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

/**
 * Error responses always carry a `hint` — the caller is an autonomous agent,
 * and a good hint is the difference between it recovering and giving up.
 */
export function fail(status: number, error: string, hint: string): NextResponse {
  return json({ ok: false, error, hint }, status);
}

/** Shared CORS preflight handler; re-export as OPTIONS from route files. */
export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Parse a JSON body, returning null on malformed input instead of throwing. */
export async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
