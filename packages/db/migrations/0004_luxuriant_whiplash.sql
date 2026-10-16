CREATE TABLE IF NOT EXISTS "alert_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"weekly_pick" boolean DEFAULT true NOT NULL,
	"rec_change" boolean DEFAULT true NOT NULL,
	"price_move" boolean DEFAULT true NOT NULL,
	"dividend" boolean DEFAULT true NOT NULL,
	"news" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
