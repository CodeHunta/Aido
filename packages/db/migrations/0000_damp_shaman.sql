CREATE TYPE "public"."action" AS ENUM('BUY', 'HOLD', 'SELL', 'WATCH', 'NO_SIGNAL');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('high', 'med', 'low');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('once', 'monthly', 'irregular');--> statement-breakpoint
CREATE TYPE "public"."horizon" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
CREATE TYPE "public"."objective" AS ENUM('growth', 'dividend', 'preservation', 'income', 'combination');--> statement-breakpoint
CREATE TYPE "public"."risk" AS ENUM('conservative', 'moderate', 'aggressive');--> statement-breakpoint
CREATE TYPE "public"."suitability" AS ENUM('high', 'med', 'low');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"ticker" varchar(12),
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_events" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" varchar(12) NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"material" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devices" (
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"platform" text DEFAULT 'expo' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dividends" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" varchar(12) NOT NULL,
	"decl_date" date,
	"qual_date" date,
	"pay_date" date,
	"dps_kobo" bigint,
	"yield_at_decl" real
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "factor_scores" (
	"ticker" varchar(12) NOT NULL,
	"as_of" date NOT NULL,
	"fundamental" smallint,
	"valuation" smallint,
	"growth" smallint,
	"market_behaviour" smallint,
	"dividend" smallint,
	"risk_inverse" smallint,
	"confidence" "confidence" DEFAULT 'low' NOT NULL,
	"engine_version" text DEFAULT 'v1' NOT NULL,
	"inputs_hash" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financials" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" varchar(12) NOT NULL,
	"period" text NOT NULL,
	"period_end" date NOT NULL,
	"revenue_kobo" bigint,
	"earnings_kobo" bigint,
	"eps_kobo" bigint,
	"profit_margin" real,
	"roe" real,
	"roa" real,
	"debt_to_equity" real,
	"fcf_kobo" bigint,
	"payout_ratio" real,
	"source" text DEFAULT '' NOT NULL,
	"filed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investor_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"risk" "risk" DEFAULT 'moderate' NOT NULL,
	"horizon" "horizon" DEFAULT 'long' NOT NULL,
	"objective" "objective" DEFAULT 'growth' NOT NULL,
	"capital_kobo" bigint DEFAULT 0 NOT NULL,
	"frequency" "frequency" DEFAULT 'monthly' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "news" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" varchar(12),
	"published_at" timestamp with time zone NOT NULL,
	"source" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"material" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolio_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"value_kobo" bigint NOT NULL,
	"pnl_kobo" bigint DEFAULT 0 NOT NULL,
	"allocation" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolios" (
	"user_id" text NOT NULL,
	"ticker" varchar(12) NOT NULL,
	"qty" bigint NOT NULL,
	"avg_cost_kobo" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prices_daily" (
	"ticker" varchar(12) NOT NULL,
	"date" date NOT NULL,
	"open_kobo" bigint,
	"high_kobo" bigint,
	"low_kobo" bigint,
	"close_kobo" bigint,
	"volume" bigint,
	"market_cap_kobo" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" varchar(12) NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "action" NOT NULL,
	"score" smallint NOT NULL,
	"confidence" "confidence" NOT NULL,
	"why" text[] DEFAULT '{}' NOT NULL,
	"key_risk" text DEFAULT '' NOT NULL,
	"thesis" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"inputs_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"engine_version" text DEFAULT 'v1' NOT NULL,
	"supersedes_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stocks" (
	"ticker" varchar(12) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sector" text DEFAULT '' NOT NULL,
	"industry" text DEFAULT '' NOT NULL,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"paystack_customer" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "watchlists" (
	"user_id" text NOT NULL,
	"ticker" varchar(12) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_picks" (
	"id" text PRIMARY KEY NOT NULL,
	"week" date NOT NULL,
	"kind" text NOT NULL,
	"user_id" text,
	"ticker" varchar(12),
	"action" "action",
	"score" smallint,
	"rationale" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "devices_user_token" ON "devices" USING btree ("user_id","token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "factor_scores_ticker_asof" ON "factor_scores" USING btree ("ticker","as_of");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "financials_ticker_period" ON "financials" USING btree ("ticker","period");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "portfolios_user_ticker" ON "portfolios" USING btree ("user_id","ticker");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "prices_daily_ticker_date" ON "prices_daily" USING btree ("ticker","date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "watchlists_user_ticker" ON "watchlists" USING btree ("user_id","ticker");