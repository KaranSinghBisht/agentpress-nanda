import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { json, preflight } from "@/lib/http";

export const OPTIONS = preflight;

/** Liveness + database connectivity. Cheap enough to poll. */
export async function GET() {
  try {
    await db().execute(sql`select 1`);
    return json({ ok: true, service: "agentpress", db: "ok" });
  } catch {
    return json({ ok: false, service: "agentpress", db: "unreachable" }, 503);
  }
}
