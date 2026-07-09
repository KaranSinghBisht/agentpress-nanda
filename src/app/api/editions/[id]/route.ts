import { findEdition, serveEdition } from "@/lib/editions";
import { preflight } from "@/lib/http";

export const OPTIONS = preflight;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return serveEdition(req, await findEdition(id));
}
