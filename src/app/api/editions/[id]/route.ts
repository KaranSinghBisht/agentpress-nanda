import { findEdition, serveEdition } from "@/lib/editions";
import { preflight, withErrors } from "@/lib/http";

export const OPTIONS = preflight;

export const GET = withErrors(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return serveEdition(req, await findEdition(id));
  },
);
