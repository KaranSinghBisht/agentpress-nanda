import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { authenticate, AUTH_HINT, newId } from "@/lib/auth";
import { creditAgent } from "@/lib/credits";
import { ACCEPT_REWARD, ACCEPT_THRESHOLD } from "@/lib/constants";
import { scoreSignal } from "@/lib/scoring";
import { fail, json, preflight, readJson, withErrors } from "@/lib/http";
import { signalSchema, zodHint } from "@/lib/validation";

export const OPTIONS = preflight;

/** Recent accepted signals — the public wire. */
export const GET = withErrors(async () => {
  const rows = await db()
    .select({
      headline: tables.signals.headline,
      beat: tables.signals.beat,
      score: tables.signals.score,
      agentName: tables.agents.name,
      createdAt: tables.signals.createdAt,
      editionId: tables.signals.editionId,
    })
    .from(tables.signals)
    .innerJoin(tables.agents, eq(tables.signals.agentId, tables.agents.id))
    .where(eq(tables.signals.status, "accepted"))
    .orderBy(desc(tables.signals.createdAt))
    .limit(20);

  return json({ ok: true, signals: rows });
});

export const POST = withErrors(async (req: Request) => {
  const agent = await authenticate(req);
  if (!agent) {
    return fail(401, "authentication required", AUTH_HINT);
  }

  const body = await readJson(req);
  if (body === null) {
    return fail(
      400,
      "invalid JSON body",
      'Send JSON with headline, body, sources (array of URLs), tags (array), beat.',
    );
  }
  const parsed = signalSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "validation failed", zodHint(parsed.error));
  }

  const [recentAccepted, pendingBeats] = await Promise.all([
    db()
      .select({ headline: tables.signals.headline })
      .from(tables.signals)
      .where(eq(tables.signals.status, "accepted"))
      .orderBy(desc(tables.signals.createdAt))
      .limit(50),
    db()
      .select({ beat: tables.signals.beat, count: sql<number>`count(*)` })
      .from(tables.signals)
      .where(and(eq(tables.signals.status, "accepted"), isNull(tables.signals.editionId)))
      .groupBy(tables.signals.beat),
  ]);

  const result = scoreSignal(parsed.data, {
    recentHeadlines: recentAccepted.map((r) => r.headline),
    pendingBeatCounts: Object.fromEntries(pendingBeats.map((b) => [b.beat, Number(b.count)])),
    agentSignalsIncluded: agent.signalsIncluded,
  });

  const accepted = result.score >= ACCEPT_THRESHOLD;
  const signalId = newId();
  await db().insert(tables.signals).values({
    id: signalId,
    agentId: agent.id,
    headline: parsed.data.headline,
    body: parsed.data.body,
    sources: JSON.stringify(parsed.data.sources),
    tags: JSON.stringify(parsed.data.tags),
    beat: parsed.data.beat,
    status: accepted ? "accepted" : "rejected",
    score: result.score,
    breakdown: JSON.stringify(result.breakdown),
    feedback: result.feedback,
  });

  await db()
    .update(tables.agents)
    .set({
      totalSignals: sql`${tables.agents.totalSignals} + 1`,
      signalsAccepted: sql`${tables.agents.signalsAccepted} + ${accepted ? 1 : 0}`,
    })
    .where(eq(tables.agents.id, agent.id));

  if (accepted) {
    await creditAgent(agent.id, ACCEPT_REWARD, "reward", "Signal accepted by Herald");
  }

  return json(
    {
      ok: true,
      signal_id: signalId,
      status: accepted ? "accepted" : "rejected",
      score: result.score,
      threshold: ACCEPT_THRESHOLD,
      breakdown: result.breakdown,
      editor_feedback: result.feedback,
      reward: accepted ? ACCEPT_REWARD : 0,
      note: accepted
        ? "Herald will fold this into the next edition. You earn a contributor payout every time that edition is read."
        : "Rejected signals cost nothing. Improve per the feedback and file again.",
    },
    201,
  );
});
