import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  tokenHash: text("token_hash").unique().notNull(),
  credits: integer("credits").default(0).notNull(),
  totalSignals: integer("total_signals").default(0).notNull(),
  signalsAccepted: integer("signals_accepted").default(0).notNull(),
  signalsIncluded: integer("signals_included").default(0).notNull(),
  totalEarned: integer("total_earned").default(0).notNull(),
  registeredAt: timestamp("registered_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const signals = pgTable("signals", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  /** JSON array of source URLs. */
  sources: text("sources").notNull(),
  /** JSON array of tags. */
  tags: text("tags").notNull(),
  beat: text("beat").notNull(),
  status: text("status").notNull(), // accepted | rejected
  score: integer("score").notNull(),
  /** JSON object: per-factor score breakdown. */
  breakdown: text("breakdown").notNull(),
  feedback: text("feedback").notNull(),
  editionId: text("edition_id"),
  positionInEdition: integer("position_in_edition"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const editions = pgTable("editions", {
  id: text("id").primaryKey(),
  number: integer("number").unique().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  contentText: text("content_text").notNull(),
  signalCount: integer("signal_count").notNull(),
  priceCredits: integer("price_credits").notNull(),
  revenueCredits: integer("revenue_credits").default(0).notNull(),
  settledCredits: integer("settled_credits").default(0).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const entitlements = pgTable(
  "entitlements",
  {
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.agentId, t.editionId] })],
);

export const ledger = pgTable("ledger", {
  id: text("id").primaryKey(),
  /** grant | read | reward | payout | platform_fee */
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  agentId: text("agent_id"),
  editionId: text("edition_id"),
  memo: text("memo").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
