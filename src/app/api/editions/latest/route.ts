import { latestEdition, serveEdition } from "@/lib/editions";
import { preflight } from "@/lib/http";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  return serveEdition(req, await latestEdition());
}
