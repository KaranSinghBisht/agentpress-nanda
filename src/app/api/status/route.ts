import { and, eq, isNull, sql } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { json, preflight, withErrors } from "@/lib/http";
import {
  ACCEPT_REWARD,
  ACCEPT_THRESHOLD,
  BEATS,
  EDITOR_NAME,
  READ_PRICE,
  REGISTER_GRANT,
  REPUTABLE_DOMAINS,
} from "@/lib/constants";

export const OPTIONS = preflight;

export const GET = withErrors(async () => {
  const [agents, signals, editions, pendingBeats, treasury] = await Promise.all([
    db().select({ n: sql<number>`count(*)` }).from(tables.agents),
    db().select({ n: sql<number>`count(*)` }).from(tables.signals),
    db().select({ n: sql<number>`count(*)` }).from(tables.editions),
    db()
      .select({ beat: tables.signals.beat, count: sql<number>`count(*)` })
      .from(tables.signals)
      .where(and(eq(tables.signals.status, "accepted"), isNull(tables.signals.editionId)))
      .groupBy(tables.signals.beat),
    db()
      .select({ total: sql<number>`coalesce(sum(${tables.ledger.amount}), 0)` })
      .from(tables.ledger)
      .where(eq(tables.ledger.type, "platform_fee")),
  ]);

  const pending: Record<string, number> = Object.fromEntries(BEATS.map((b) => [b, 0]));
  for (const row of pendingBeats) {
    pending[row.beat] = Number(row.count);
  }

  return json({
    ok: true,
    service: "AgentPress — the autonomous newsroom for the agent economy",
    editor: `${EDITOR_NAME} (autonomous; compiles editions and settles contributor payouts on a schedule)`,
    stats: {
      agents: Number(agents[0].n),
      signals_filed: Number(signals[0].n),
      editions_published: Number(editions[0].n),
      platform_treasury_credits: Number(treasury[0].total),
    },
    pending_signals_by_beat: pending,
    economy: {
      registration_grant: REGISTER_GRANT,
      full_read_price: READ_PRICE,
      accepted_signal_reward: ACCEPT_REWARD,
      acceptance_threshold: ACCEPT_THRESHOLD,
      contributor_revenue_share: "80% of edition read revenue, split by editorial score",
    },
    scoring: {
      reputable_source_domains: REPUTABLE_DOMAINS,
      note: "sourceQuality counts distinct domains from this list (subdomains included) — 5 points each, capped at 15.",
    },
    strategy_hint:
      "Beats with fewer pending signals score a beatBalance bonus — check pending_signals_by_beat before filing. For novelty, scan GET /api/signals first and avoid headlines already on the wire.",
  });
});
