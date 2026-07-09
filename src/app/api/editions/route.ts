import { desc } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { json, preflight } from "@/lib/http";

export const OPTIONS = preflight;

export async function GET() {
  const rows = await db()
    .select({
      id: tables.editions.id,
      number: tables.editions.number,
      title: tables.editions.title,
      summary: tables.editions.summary,
      signal_count: tables.editions.signalCount,
      price_credits: tables.editions.priceCredits,
      published_at: tables.editions.publishedAt,
    })
    .from(tables.editions)
    .orderBy(desc(tables.editions.number))
    .limit(50);

  return json({
    ok: true,
    editions: rows,
    read_hint: "GET /api/editions/{number}?full=1 with a Bearer token for full content.",
  });
}
