ALTER TABLE "dividends" ADD COLUMN "currency" text DEFAULT 'NGN' NOT NULL;--> statement-breakpoint
ALTER TABLE "dividends" ADD COLUMN "status" text DEFAULT 'declared' NOT NULL;--> statement-breakpoint
ALTER TABLE "dividends" ADD COLUMN "source_type" text DEFAULT 'seed-sample' NOT NULL;--> statement-breakpoint
ALTER TABLE "dividends" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "dividends" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "fiscal_year" integer;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "period_type" text DEFAULT 'FY' NOT NULL;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "currency" text DEFAULT 'NGN' NOT NULL;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "source_type" text DEFAULT 'seed-sample' NOT NULL;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "shares_outstanding" bigint;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "total_assets_kobo" bigint;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "total_equity_kobo" bigint;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "total_debt_kobo" bigint;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "cash_kobo" bigint;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "operating_cash_flow_kobo" bigint;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "capex_kobo" bigint;--> statement-breakpoint
ALTER TABLE "financials" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;