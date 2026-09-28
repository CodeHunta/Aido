import {
  bigint,
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Money is stored in kobo (minor units) as bigint. Timestamps are timestamptz.

export const riskEnum = pgEnum("risk", ["conservative", "moderate", "aggressive"]);
export const horizonEnum = pgEnum("horizon", ["short", "medium", "long"]);
export const objectiveEnum = pgEnum("objective", [
  "growth",
  "dividend",
  "preservation",
  "income",
  "combination",
]);
export const frequencyEnum = pgEnum("frequency", ["once", "monthly", "irregular"]);
export const actionEnum = pgEnum("action", ["BUY", "HOLD", "SELL", "WATCH", "NO_SIGNAL"]);
export const confidenceEnum = pgEnum("confidence", ["high", "med", "low"]);
export const suitabilityEnum = pgEnum("suitability", ["high", "med", "low"]);

export const investorProfiles = pgTable("investor_profiles", {
  userId: text("user_id").primaryKey(),
  risk: riskEnum("risk").notNull().default("moderate"),
  horizon: horizonEnum("horizon").notNull().default("long"),
  objective: objectiveEnum("objective").notNull().default("growth"),
  capitalKobo: bigint("capital_kobo", { mode: "number" }).notNull().default(0),
  frequency: frequencyEnum("frequency").notNull().default("monthly"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stocks = pgTable("stocks", {
  ticker: varchar("ticker", { length: 12 }).primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull().default(""),
  industry: text("industry").notNull().default(""),
  categories: text("categories").array().notNull().default([]),
  status: text("status").notNull().default("active"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pricesDaily = pgTable(
  "prices_daily",
  {
    ticker: varchar("ticker", { length: 12 }).notNull(),
    date: date("date").notNull(),
    openKobo: bigint("open_kobo", { mode: "number" }),
    highKobo: bigint("high_kobo", { mode: "number" }),
    lowKobo: bigint("low_kobo", { mode: "number" }),
    closeKobo: bigint("close_kobo", { mode: "number" }),
    volume: bigint("volume", { mode: "number" }),
    marketCapKobo: bigint("market_cap_kobo", { mode: "number" }),
  },
  (t) => [uniqueIndex("prices_daily_ticker_date").on(t.ticker, t.date)],
);

export const financials = pgTable(
  "financials",
  {
    id: text("id").primaryKey(),
    ticker: varchar("ticker", { length: 12 }).notNull(),
    period: text("period").notNull(),
    periodEnd: date("period_end").notNull(),
    revenueKobo: bigint("revenue_kobo", { mode: "number" }),
    earningsKobo: bigint("earnings_kobo", { mode: "number" }),
    epsKobo: bigint("eps_kobo", { mode: "number" }),
    profitMargin: real("profit_margin"),
    roe: real("roe"),
    roa: real("roa"),
    debtToEquity: real("debt_to_equity"),
    fcfKobo: bigint("fcf_kobo", { mode: "number" }),
    payoutRatio: real("payout_ratio"),
    source: text("source").notNull().default(""),
    filedAt: timestamp("filed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("financials_ticker_period").on(t.ticker, t.period)],
);

export const dividends = pgTable("dividends", {
  id: text("id").primaryKey(),
  ticker: varchar("ticker", { length: 12 }).notNull(),
  declDate: date("decl_date"),
  qualDate: date("qual_date"),
  payDate: date("pay_date"),
  dpsKobo: bigint("dps_kobo", { mode: "number" }),
  yieldAtDecl: real("yield_at_decl"),
});

export const corporateEvents = pgTable("corporate_events", {
  id: text("id").primaryKey(),
  ticker: varchar("ticker", { length: 12 }).notNull(),
  date: date("date").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  material: boolean("material").notNull().default(false),
});

export const news = pgTable("news", {
  id: text("id").primaryKey(),
  ticker: varchar("ticker", { length: 12 }),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  material: boolean("material").notNull().default(false),
});

export const factorScores = pgTable(
  "factor_scores",
  {
    ticker: varchar("ticker", { length: 12 }).notNull(),
    asOf: date("as_of").notNull(),
    fundamental: smallint("fundamental"),
    valuation: smallint("valuation"),
    growth: smallint("growth"),
    marketBehaviour: smallint("market_behaviour"),
    dividend: smallint("dividend"),
    riskInverse: smallint("risk_inverse"),
    confidence: confidenceEnum("confidence").notNull().default("low"),
    engineVersion: text("engine_version").notNull().default("v1"),
    inputsHash: text("inputs_hash").notNull().default(""),
  },
  (t) => [uniqueIndex("factor_scores_ticker_asof").on(t.ticker, t.asOf)],
);

export const recommendations = pgTable("recommendations", {
  id: text("id").primaryKey(),
  ticker: varchar("ticker", { length: 12 }).notNull(),
  asOf: timestamp("as_of", { withTimezone: true }).notNull().defaultNow(),
  action: actionEnum("action").notNull(),
  score: smallint("score").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  why: text("why").array().notNull().default([]),
  keyRisk: text("key_risk").notNull().default(""),
  thesis: jsonb("thesis").notNull().default({}),
  inputsSnapshot: jsonb("inputs_snapshot").notNull().default({}),
  engineVersion: text("engine_version").notNull().default("v1"),
  supersedesId: text("supersedes_id"),
});

export const portfolios = pgTable(
  "portfolios",
  {
    userId: text("user_id").notNull(),
    ticker: varchar("ticker", { length: 12 }).notNull(),
    qty: bigint("qty", { mode: "number" }).notNull(),
    avgCostKobo: bigint("avg_cost_kobo", { mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("portfolios_user_ticker").on(t.userId, t.ticker)],
);

export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  valueKobo: bigint("value_kobo", { mode: "number" }).notNull(),
  pnlKobo: bigint("pnl_kobo", { mode: "number" }).notNull().default(0),
  allocation: jsonb("allocation").notNull().default({}),
});

export const watchlists = pgTable(
  "watchlists",
  {
    userId: text("user_id").notNull(),
    ticker: varchar("ticker", { length: 12 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watchlists_user_ticker").on(t.userId, t.ticker)],
);

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  ticker: varchar("ticker", { length: 12 }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weeklyPicks = pgTable("weekly_picks", {
  id: text("id").primaryKey(),
  week: date("week").notNull(),
  kind: text("kind").notNull(),
  userId: text("user_id"),
  ticker: varchar("ticker", { length: 12 }),
  action: actionEnum("action"),
  score: smallint("score"),
  rationale: text("rationale").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const devices = pgTable(
  "devices",
  {
    userId: text("user_id").notNull(),
    token: text("token").notNull(),
    platform: text("platform").notNull().default("expo"),
  },
  (t) => [uniqueIndex("devices_user_token").on(t.userId, t.token)],
);

export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id").primaryKey(),
  plan: text("plan").notNull().default("free"),
  paystackCustomer: text("paystack_customer"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),
  meta: jsonb("meta").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Better Auth tables (shape follows Better Auth Drizzle adapter; completed in Phase 8)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
