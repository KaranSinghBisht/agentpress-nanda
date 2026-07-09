import { and, eq, gte, sql } from "drizzle-orm";
import { db, tables } from "./db";
import { newId } from "./auth";
import { READ_PRICE } from "./constants";

export async function recordLedger(entry: {
  type: "grant" | "read" | "reward" | "payout" | "platform_fee";
  amount: number;
  agentId?: string;
  editionId?: string;
  memo: string;
}): Promise<void> {
  await db().insert(tables.ledger).values({ id: newId(), ...entry });
}

/** Add credits to an agent and record why. Earnings also bump totalEarned. */
export async function creditAgent(
  agentId: string,
  amount: number,
  type: "grant" | "reward" | "payout",
  memo: string,
  editionId?: string,
): Promise<void> {
  const earned = type === "grant" ? 0 : amount;
  await db()
    .update(tables.agents)
    .set({
      credits: sql`${tables.agents.credits} + ${amount}`,
      totalEarned: sql`${tables.agents.totalEarned} + ${earned}`,
    })
    .where(eq(tables.agents.id, agentId));
  await recordLedger({ type, amount, agentId, editionId, memo });
}

export type ChargeResult =
  | { outcome: "already_entitled"; balance: number }
  | { outcome: "charged"; balance: number }
  | { outcome: "insufficient"; balance: number };

/**
 * Charge an agent for full access to an edition. Pay once, read forever.
 *
 * Claim-then-debit: the entitlement INSERT (PK-guarded) is the idempotency
 * gate, so concurrent reads of the same edition can never double-charge —
 * exactly one request wins the claim and pays. The debit itself is a single
 * conditional UPDATE, so an agent can never go negative; if the debit fails,
 * the claim is released and the read is refused.
 */
export async function chargeForRead(
  agent: { id: string; credits: number },
  editionId: string,
): Promise<ChargeResult> {
  const claimed = await db()
    .insert(tables.entitlements)
    .values({ agentId: agent.id, editionId })
    .onConflictDoNothing()
    .returning({ editionId: tables.entitlements.editionId });
  if (claimed.length === 0) {
    return { outcome: "already_entitled", balance: agent.credits };
  }

  const debited = await db()
    .update(tables.agents)
    .set({ credits: sql`${tables.agents.credits} - ${READ_PRICE}` })
    .where(and(eq(tables.agents.id, agent.id), gte(tables.agents.credits, READ_PRICE)))
    .returning({ credits: tables.agents.credits });
  if (debited.length === 0) {
    await db()
      .delete(tables.entitlements)
      .where(
        and(
          eq(tables.entitlements.agentId, agent.id),
          eq(tables.entitlements.editionId, editionId),
        ),
      );
    return { outcome: "insufficient", balance: agent.credits };
  }

  await db()
    .update(tables.editions)
    .set({ revenueCredits: sql`${tables.editions.revenueCredits} + ${READ_PRICE}` })
    .where(eq(tables.editions.id, editionId));
  await recordLedger({
    type: "read",
    amount: READ_PRICE,
    agentId: agent.id,
    editionId,
    memo: "Full edition read",
  });

  return { outcome: "charged", balance: debited[0].credits };
}
