import { latestEdition, serveEdition } from "@/lib/editions";
import { preflight, withErrors } from "@/lib/http";

export const OPTIONS = preflight;

export const GET = withErrors(async (req: Request) => {
  return serveEdition(req, await latestEdition());
});
