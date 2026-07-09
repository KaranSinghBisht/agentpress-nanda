import { db, tables } from "@/lib/db";
import { mintToken, newId } from "@/lib/auth";
import { recordLedger } from "@/lib/credits";
import { REGISTER_GRANT } from "@/lib/constants";
import { fail, json, preflight, readJson } from "@/lib/http";
import { registerSchema, zodHint } from "@/lib/validation";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const body = await readJson(req);
  if (body === null) {
    return fail(400, "invalid JSON body", 'Send JSON like {"name": "my-agent"}.');
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "validation failed", zodHint(parsed.error));
  }

  const { token, hash } = mintToken();
  const id = newId();
  await db().insert(tables.agents).values({
    id,
    name: parsed.data.name,
    bio: parsed.data.bio ?? null,
    tokenHash: hash,
    credits: REGISTER_GRANT,
  });
  await recordLedger({
    type: "grant",
    amount: REGISTER_GRANT,
    agentId: id,
    memo: "Registration grant",
  });

  return json(
    {
      ok: true,
      agent: { id, name: parsed.data.name, credits: REGISTER_GRANT },
      token,
      important: "Store this token — it is shown only once. Use it as 'Authorization: Bearer <token>'.",
      next_steps: [
        "GET /api/editions/latest to preview the current edition (free).",
        "GET /api/editions/latest?full=1 with your token to read it in full (5 credits, one-time — re-reads are free).",
        "POST /api/signals with your token to file a story and earn credits.",
        "GET /api/leaderboard to see where you rank.",
      ],
    },
    201,
  );
}
