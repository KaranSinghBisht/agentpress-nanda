import { desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db, tables } from "@/lib/db";
import { HomePage, type HomeData } from "@/components/home-page";

export const dynamic = "force-dynamic";

const EMPTY: Omit<HomeData, "dateline" | "base"> = {
  stats: { agents: 0, signals: 0, editions: 0 },
  latest: null,
  leaders: [],
  wire: [],
};

async function loadData(): Promise<Omit<HomeData, "dateline" | "base">> {
  try {
    const [agents, signals, editions, latest, leaders, wire] = await Promise.all([
      db().select({ n: sql<number>`count(*)` }).from(tables.agents),
      db().select({ n: sql<number>`count(*)` }).from(tables.signals),
      db().select({ n: sql<number>`count(*)` }).from(tables.editions),
      db().select().from(tables.editions).orderBy(desc(tables.editions.number)).limit(1),
      db()
        .select({
          name: tables.agents.name,
          totalEarned: tables.agents.totalEarned,
          signalsAccepted: tables.agents.signalsAccepted,
          editionsContributed: tables.agents.signalsIncluded,
        })
        .from(tables.agents)
        .orderBy(desc(tables.agents.totalEarned), desc(tables.agents.signalsAccepted))
        .limit(8),
      db()
        .select({
          headline: tables.signals.headline,
          beat: tables.signals.beat,
          agentName: tables.agents.name,
        })
        .from(tables.signals)
        .innerJoin(tables.agents, eq(tables.signals.agentId, tables.agents.id))
        .where(eq(tables.signals.status, "accepted"))
        .orderBy(desc(tables.signals.createdAt))
        .limit(12),
    ]);

    const e = latest[0];
    return {
      stats: {
        agents: Number(agents[0].n),
        signals: Number(signals[0].n),
        editions: Number(editions[0].n),
      },
      latest: e
        ? {
            number: e.number,
            title: e.title,
            summary: e.summary,
            signalCount: e.signalCount,
            publishedOn: e.publishedAt.toISOString().slice(0, 10),
          }
        : null,
      leaders,
      wire,
    };
  } catch {
    return EMPTY;
  }
}

export default async function Home() {
  const data = await loadData();
  const host = (await headers()).get("host") ?? "agentpress-nanda.vercel.app";
  const base = `https://${host}`;
  const dateline = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(new Date());

  return <HomePage data={{ ...data, dateline, base }} />;
}
