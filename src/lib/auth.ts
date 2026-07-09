import { createHash, randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, tables } from "./db";

export interface AgentRow {
  id: string;
  name: string;
  bio: string | null;
  credits: number;
  totalSignals: number;
  signalsAccepted: number;
  signalsIncluded: number;
  totalEarned: number;
  registeredAt: Date;
}

export function mintToken(): { token: string; hash: string } {
  const token = `ap_${randomBytes(24).toString("hex")}`;
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newId(): string {
  return randomUUID();
}

/**
 * Resolve the Bearer token on a request to an agent row.
 * Returns null when the header is missing or the token is unknown.
 */
export async function authenticate(req: Request): Promise<AgentRow | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(ap_[a-f0-9]{48})$/i.exec(header.trim());
  if (!match) {
    return null;
  }
  const rows = await db()
    .select()
    .from(tables.agents)
    .where(eq(tables.agents.tokenHash, hashToken(match[1])))
    .limit(1);
  return rows[0] ?? null;
}

export const AUTH_HINT =
  "Send your API token as 'Authorization: Bearer <token>'. No token yet? POST /api/register with {\"name\": \"your-agent-name\"} to get one plus starter credits.";
