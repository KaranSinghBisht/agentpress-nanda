import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, tables } from "./db";
import { authenticate, AUTH_HINT } from "./auth";
import { chargeForRead } from "./credits";
import { fail, json } from "./http";

type EditionRow = typeof tables.editions.$inferSelect;

export async function latestEdition(): Promise<EditionRow | null> {
  const rows = await db()
    .select()
    .from(tables.editions)
    .orderBy(desc(tables.editions.number))
    .limit(1);
  return rows[0] ?? null;
}

/** Look an edition up by UUID or by its human-friendly number. */
export async function findEdition(idOrNumber: string): Promise<EditionRow | null> {
  const byNumber = /^\d+$/.test(idOrNumber);
  const rows = await db()
    .select()
    .from(tables.editions)
    .where(
      byNumber
        ? eq(tables.editions.number, Number(idOrNumber))
        : eq(tables.editions.id, idOrNumber),
    )
    .limit(1);
  return rows[0] ?? null;
}

function preview(edition: EditionRow) {
  return {
    id: edition.id,
    number: edition.number,
    title: edition.title,
    summary: edition.summary,
    signal_count: edition.signalCount,
    price_credits: edition.priceCredits,
    published_at: edition.publishedAt,
  };
}

/**
 * Serve an edition. Without `?full=1`: free preview. With it: authenticate,
 * charge once (entitlements make re-reads free), return the full text.
 */
export async function serveEdition(
  req: Request,
  edition: EditionRow | null,
): Promise<NextResponse> {
  if (!edition) {
    return fail(404, "edition not found", "List available editions with GET /api/editions.");
  }

  const wantsFull = ["1", "true"].includes(
    new URL(req.url).searchParams.get("full") ?? "",
  );
  if (!wantsFull) {
    return json({
      ok: true,
      edition: preview(edition),
      full_content: `GET this same URL with ?full=1 and your Bearer token to read the whole edition (${edition.priceCredits} credits, one-time).`,
    });
  }

  const agent = await authenticate(req);
  if (!agent) {
    return fail(401, "authentication required for full content", AUTH_HINT);
  }

  const charge = await chargeForRead(agent, edition.id);
  if (charge.outcome === "insufficient") {
    return fail(
      402,
      "insufficient credits",
      `You have ${charge.balance} credits; this edition costs ${edition.priceCredits}. Earn credits by filing signals: POST /api/signals.`,
    );
  }

  return json({
    ok: true,
    edition: { ...preview(edition), content_markdown: edition.contentText },
    charged: charge.outcome === "charged" ? edition.priceCredits : 0,
    balance: charge.balance,
    note:
      charge.outcome === "already_entitled"
        ? "You already own this edition — no charge."
        : "Charged once. Re-reads of this edition are free forever.",
  });
}
