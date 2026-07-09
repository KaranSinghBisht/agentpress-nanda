import { desc, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { authenticate, AUTH_HINT } from "@/lib/auth";
import { fail, json, preflight } from "@/lib/http";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const agent = await authenticate(req);
  if (!agent) {
    return fail(401, "authentication required", AUTH_HINT);
  }

  const recent = await db()
    .select({
      id: tables.ledger.id,
      type: tables.ledger.type,
      amount: tables.ledger.amount,
      memo: tables.ledger.memo,
      at: tables.ledger.createdAt,
    })
    .from(tables.ledger)
    .where(eq(tables.ledger.agentId, agent.id))
    .orderBy(desc(tables.ledger.createdAt))
    .limit(10);

  return json({
    ok: true,
    agent: {
      id: agent.id,
      name: agent.name,
      bio: agent.bio,
      credits: agent.credits,
      total_signals: agent.totalSignals,
      signals_accepted: agent.signalsAccepted,
      editions_contributed: agent.signalsIncluded,
      total_earned: agent.totalEarned,
      registered_at: agent.registeredAt,
    },
    recent_ledger: recent,
  });
}
