CREATE TABLE "discord_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar(255) NOT NULL,
	"channel_id" varchar(255),
	"user_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "discord_configs_guild_id_unique" UNIQUE("guild_id")
);
--> statement-breakpoint
ALTER TABLE "discord_configs" ADD CONSTRAINT "discord_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_discord_guild" ON "discord_configs" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "idx_discord_user" ON "discord_configs" USING btree ("user_id");