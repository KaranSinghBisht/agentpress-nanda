import { desc, eq, gt, isNull, sql, and, inArray } from "drizzle-orm";
import { db, tables } from "./db";
import { newId } from "./auth";
import { creditAgent, recordLedger } from "./credits";
import { splitByWeight } from "./settlement";
import {
  BEAT_LABELS,
  CONTRIBUTOR_SHARE_PCT,
  EDITION_MAX_SIGNALS,
  EDITOR_NAME,
  READ_PRICE,
  type Beat,
} from "./constants";

interface CompileOutcome {
  compiled: boolean;
  editionNumber?: number;
  signalCount?: number;
  settlements: Array<{
    editionNumber: number;
    settled: number;
    contributorPool: number;
    platformFee: number;
  }>;
}

/**
 * One editorial cycle, run by Herald (cron or manual trigger):
 * 1. Fold pending accepted signals into a new edition, best-scored first.
 * 2. Settle unpaid revenue on every edition: contributors split
 *    CONTRIBUTOR_SHARE_PCT weighted by signal score (largest-remainder,
 *    conservation-exact), platform keeps the remainder.
 */
export async function runEditorialCycle(): Promise<CompileOutcome> {
  const compiled = await compileEdition();
  const settlements = await settleRevenue();
  return { ...compiled, settlements };
}

async function compileEdition(): Promise<Omit<CompileOutcome, "settlements">> {
  const pending = await db()
    .select({
      id: tables.signals.id,
      agentId: tables.signals.agentId,
      headline: tables.signals.headline,
      body: tables.signals.body,
      sources: tables.signals.sources,
      beat: tables.signals.beat,
      score: tables.signals.score,
      agentName: tables.agents.name,
    })
    .from(tables.signals)
    .innerJoin(tables.agents, eq(tables.signals.agentId, tables.agents.id))
    .where(and(eq(tables.signals.status, "accepted"), isNull(tables.signals.editionId)))
    .orderBy(desc(tables.signals.score), tables.signals.createdAt)
    .limit(EDITION_MAX_SIGNALS);

  if (pending.length === 0) {
    return { compiled: false };
  }

  const last = await db()
    .select({ n: sql<number>`coalesce(max(${tables.editions.number}), 0)` })
    .from(tables.editions);
  const number = Number(last[0].n) + 1;

  const top = pending[0];
  const title = `AgentPress #${number}: ${top.headline}`;
  const beats = [...new Set(pending.map((s) => s.beat))];
  const summary = `${pending.length} signal${pending.length > 1 ? "s" : ""} from ${
    new Set(pending.map((s) => s.agentId)).size
  } agent${new Set(pending.map((s) => s.agentId)).size > 1 ? "s" : ""}, covering ${beats
    .map((b) => BEAT_LABELS[b as Beat] ?? b)
    .join(", ")}. Compiled autonomously by ${EDITOR_NAME}.`;

  const editionId = newId();
  await db().insert(tables.editions).values({
    id: editionId,
    number,
    title,
    summary,
    contentText: renderEdition(title, summary, pending),
    signalCount: pending.length,
    priceCredits: READ_PRICE,
  });

  for (const [position, s] of pending.entries()) {
    await db()
      .update(tables.signals)
      .set({ editionId, positionInEdition: position + 1 })
      .where(eq(tables.signals.id, s.id));
  }
  const contributorIds = [...new Set(pending.map((s) => s.agentId))];
  await db()
    .update(tables.agents)
    .set({ signalsIncluded: sql`${tables.agents.signalsIncluded} + 1` })
    .where(inArray(tables.agents.id, contributorIds));

  return { compiled: true, editionNumber: number, signalCount: pending.length };
}

async function settleRevenue(): Promise<CompileOutcome["settlements"]> {
  const unsettled = await db()
    .select()
    .from(tables.editions)
    .where(gt(tables.editions.revenueCredits, tables.editions.settledCredits));

  const results: CompileOutcome["settlements"] = [];
  for (const edition of unsettled) {
    const delta = edition.revenueCredits - edition.settledCredits;
    const contributors = await db()
      .select({
        agentId: tables.signals.agentId,
        weight: sql<number>`sum(${tables.signals.score})`,
      })
      .from(tables.signals)
      .where(eq(tables.signals.editionId, edition.id))
      .groupBy(tables.signals.agentId);

    const pool = Math.floor((delta * CONTRIBUTOR_SHARE_PCT) / 100);
    const platformFee = delta - pool;

    if (pool > 0 && contributors.length > 0) {
      const allocations = splitByWeight(
        pool,
        contributors.map((c) => ({ id: c.agentId, weight: Math.max(1, Number(c.weight)) })),
      );
      for (const a of allocations) {
        if (a.amount > 0) {
          await creditAgent(
            a.id,
            a.amount,
            "payout",
            `Contributor share, edition #${edition.number}`,
            edition.id,
          );
        }
      }
    }
    await recordLedger({
      type: "platform_fee",
      amount: platformFee,
      editionId: edition.id,
      memo: `Platform share, edition #${edition.number}`,
    });
    await db()
      .update(tables.editions)
      .set({ settledCredits: edition.revenueCredits })
      .where(eq(tables.editions.id, edition.id));

    results.push({
      editionNumber: edition.number,
      settled: delta,
      contributorPool: pool,
      platformFee,
    });
  }
  return results;
}

interface RenderableSignal {
  headline: string;
  body: string;
  sources: string;
  beat: string;
  score: number;
  agentName: string;
}

function renderEdition(
  title: string,
  summary: string,
  signalRows: RenderableSignal[],
): string {
  const stories = signalRows
    .map((s, i) => {
      const sources = (JSON.parse(s.sources) as string[]).join(", ");
      const label = BEAT_LABELS[s.beat as Beat] ?? s.beat;
      return [
        `## ${i + 1}. ${s.headline}`,
        `**Beat:** ${label} · **Editorial score:** ${s.score}/100 · **Filed by:** ${s.agentName}`,
        "",
        s.body,
        "",
        `Sources: ${sources}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return [
    `# ${title}`,
    "",
    `_Compiled autonomously by ${EDITOR_NAME}, the AgentPress editor._`,
    "",
    `> ${summary}`,
    "",
    "---",
    "",
    stories,
    "",
    "---",
    "",
    "_Agents research. Agents curate. Agents earn. — AgentPress on NANDA_",
  ].join("\n");
}
