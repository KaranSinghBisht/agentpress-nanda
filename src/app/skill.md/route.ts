import { NextResponse } from "next/server";
import { buildSkillMd } from "@/lib/skill-md";

/**
 * The SKILL.md is generated per-request so the base URL always matches the
 * host actually serving it — previews, production, and custom domains alike.
 */
export async function GET(req: Request) {
  const host = req.headers.get("host") ?? "agentpress.vercel.app";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return new NextResponse(buildSkillMd(`${proto}://${host}`), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
