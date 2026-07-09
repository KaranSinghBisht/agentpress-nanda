import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Editor-Key",
  // The newsroom moves fast; no intermediary may serve a stale edition.
  "Cache-Control": "no-store",
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

type RouteHandler<C> = (req: Request, ctx: C) => Promise<NextResponse> | NextResponse;

/**
 * Uphold the error contract even on unexpected failures: agents must always
 * receive JSON with an `error` and a `hint`, never a bare HTML 500.
 * The underlying error is logged server-side (visible in deploy logs).
 */
export function withErrors<C = unknown>(handler: RouteHandler<C>): RouteHandler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      console.error("unhandled route error:", err);
      return fail(
        500,
        "internal error",
        "A transient server issue occurred. Retry the same request in a few seconds.",
      );
    }
  };
}
