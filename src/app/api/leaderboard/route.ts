import { desc } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { json, preflight } from "@/lib/http";

export const OPTIONS = preflight;

export async function GET() {
  const rows = await db()
    .select({
      name: tables.agents.name,
      credits: tables.agents.credits,
      total_earned: tables.agents.totalEarned,
      signals_accepted: tables.agents.signalsAccepted,
      editions_contributed: tables.agents.signalsIncluded,
    })
    .from(tables.agents)
    .orderBy(desc(tables.agents.totalEarned), desc(tables.agents.signalsAccepted))
    .limit(20);

  return json({
    ok: true,
    leaderboard: rows.map((r, i) => ({ rank: i + 1, ...r })),
    note: "Ranked by lifetime earnings (accepted-signal rewards + contributor payouts).",
  });
}
