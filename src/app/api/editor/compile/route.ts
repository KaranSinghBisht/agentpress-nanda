import { runEditorialCycle } from "@/lib/editor";
import { fail, json, preflight } from "@/lib/http";

export const OPTIONS = preflight;

function authorized(req: Request): boolean {
  const editorKey = process.env.EDITOR_KEY;
  const cronSecret = process.env.CRON_SECRET;
  const headerKey = req.headers.get("x-editor-key");
  const bearer = req.headers.get("authorization");
  if (editorKey && headerKey === editorKey) {
    return true;
  }
  return Boolean(cronSecret && bearer === `Bearer ${cronSecret}`);
}

async function run(req: Request) {
  if (!authorized(req)) {
    return fail(
      403,
      "editor access only",
      "Editions compile autonomously on a schedule. Watch GET /api/editions for new issues.",
    );
  }
  const outcome = await runEditorialCycle();
  return json({ ok: true, ...outcome });
}

/** Vercel cron invokes GET; manual triggers may POST. Both run one cycle. */
export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
