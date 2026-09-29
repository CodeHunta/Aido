ALTER TABLE "prices_daily" ADD COLUMN "source" text DEFAULT 'seed-sample' NOT NULL;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "ngx_symbol" text;