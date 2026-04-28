CREATE TYPE "public"."bot_platform" AS ENUM('discord', 'reddit', 'twitter', 'slack');--> statement-breakpoint
CREATE TYPE "public"."scrape_source_status" AS ENUM('active', 'paused', 'broken', 'rate_limited');--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE 'discord_owner' BEFORE 'enterprise';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'discord_owner';--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_by" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"diff" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bot_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "bot_platform" NOT NULL,
	"platform_config" jsonb NOT NULL,
	"credentials" jsonb,
	"token_expires_at" timestamp with time zone,
	"job_filters" jsonb,
	"post_format" varchar(50) DEFAULT 'default',
	"max_posts_per_day" integer DEFAULT 10,
	"post_schedule" jsonb,
	"is_active" boolean DEFAULT true,
	"last_post_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bot_configs_user_id_platform_unique" UNIQUE("user_id","platform")
);
--> statement-breakpoint
CREATE TABLE "bot_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_config_id" uuid NOT NULL,
	"job_id" uuid,
	"platform" "bot_platform" NOT NULL,
	"external_post_id" varchar(255),
	"content_snapshot" text,
	"status" varchar(30) DEFAULT 'sent',
	"error_message" text,
	"posted_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bot_posts_bot_config_id_job_id_unique" UNIQUE("bot_config_id","job_id")
);
--> statement-breakpoint
CREATE TABLE "discord_posted_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_config_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"message_id" varchar(255),
	"posted_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "discord_posted_jobs_discord_config_id_job_id_unique" UNIQUE("discord_config_id","job_id")
);
--> statement-breakpoint
CREATE TABLE "job_fingerprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"source_id" uuid,
	"fingerprint" varchar(64) NOT NULL,
	"source_url" text,
	"first_seen_at" timestamp with time zone DEFAULT now(),
	"last_seen_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "job_fingerprints_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "plan_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"ai_tokens_per_day" integer,
	"ai_tokens_per_month" integer,
	"job_matches_per_day" integer,
	"job_searches_per_day" integer,
	"api_calls_per_minute" integer,
	"api_calls_per_day" integer,
	"resume_parses_per_month" integer,
	"bot_posts_per_day" integer,
	"is_unlimited" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "plan_quotas_plan_unique" UNIQUE("plan")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"applies_to_plan" "subscription_plan",
	"max_uses" integer,
	"uses_count" integer DEFAULT 0,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"override_type" varchar(50) NOT NULL,
	"override_value" integer,
	"granted_by" uuid,
	"expires_at" timestamp with time zone,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"status" varchar(30) DEFAULT 'running',
	"jobs_found" integer DEFAULT 0,
	"jobs_new" integer DEFAULT 0,
	"jobs_updated" integer DEFAULT 0,
	"jobs_deduped" integer DEFAULT 0,
	"error_log" jsonb
);
--> statement-breakpoint
CREATE TABLE "scrape_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_url" text NOT NULL,
	"scraper_type" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"status" "scrape_source_status" DEFAULT 'active',
	"requests_per_minute" integer DEFAULT 10,
	"retry_after_seconds" integer DEFAULT 60,
	"crawl_interval_minutes" integer DEFAULT 60,
	"last_crawled_at" timestamp with time zone,
	"next_crawl_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0,
	"last_error" text,
	"total_jobs_scraped" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"last_active_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "system_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"slug" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "token_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"window_type" varchar(20) NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"api_calls" integer DEFAULT 0 NOT NULL,
	"job_matches" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "token_usage_user_id_window_type_window_start_unique" UNIQUE("user_id","window_type","window_start")
);
--> statement-breakpoint
DROP INDEX "idx_users_role";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "system_prompt_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "total_tokens_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "context_window_used" integer;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "guild_name" varchar(255);--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "channel_name" varchar(255);--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "bot_webhook_url" text;--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "job_filters" jsonb;--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "post_format" varchar(50) DEFAULT 'embed';--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "ping_role_id" varchar(255);--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "ping_everyone" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "max_posts_per_day" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "last_post_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "posts_today" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "discord_configs" ADD COLUMN "posts_today_reset_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employer_profiles" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_matches" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "scrape_source_id" uuid;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "external_job_id" varchar(255);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "fingerprint" varchar(64);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tokens_used" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "model_used" varchar(100);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "latency_ms" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "finish_reason" varchar(50);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "cost_usd" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "idempotency_key" varchar(255);--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "seeker_profiles" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "promo_code_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "roles" "user_role"[] DEFAULT '{"job_seeker"}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_configs" ADD CONSTRAINT "bot_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_posts" ADD CONSTRAINT "bot_posts_bot_config_id_bot_configs_id_fk" FOREIGN KEY ("bot_config_id") REFERENCES "public"."bot_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_posts" ADD CONSTRAINT "bot_posts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_posted_jobs" ADD CONSTRAINT "discord_posted_jobs_discord_config_id_discord_configs_id_fk" FOREIGN KEY ("discord_config_id") REFERENCES "public"."discord_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_posted_jobs" ADD CONSTRAINT "discord_posted_jobs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_fingerprints" ADD CONSTRAINT "job_fingerprints_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_fingerprints" ADD CONSTRAINT "job_fingerprints_source_id_scrape_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."scrape_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limit_overrides" ADD CONSTRAINT "rate_limit_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limit_overrides" ADD CONSTRAINT "rate_limit_overrides_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_runs" ADD CONSTRAINT "scrape_runs_source_id_scrape_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."scrape_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_prompts" ADD CONSTRAINT "system_prompts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bot_configs_active" ON "bot_configs" USING btree ("is_active","platform");--> statement-breakpoint
CREATE INDEX "idx_bot_posts_config" ON "bot_posts" USING btree ("bot_config_id","posted_at");--> statement-breakpoint
CREATE INDEX "idx_discord_posted_config" ON "discord_posted_jobs" USING btree ("discord_config_id");--> statement-breakpoint
CREATE INDEX "idx_scrape_runs_source" ON "scrape_runs" USING btree ("source_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_scrape_sources_queue" ON "scrape_sources" USING btree ("status","next_crawl_at");--> statement-breakpoint
CREATE INDEX "idx_system_prompts_active" ON "system_prompts" USING btree ("slug","is_active");--> statement-breakpoint
CREATE INDEX "idx_token_usage_user_window" ON "token_usage" USING btree ("user_id","window_type","window_start");--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_scrape_source_id_scrape_sources_id_fk" FOREIGN KEY ("scrape_source_id") REFERENCES "public"."scrape_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_jobs_active" ON "jobs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("roles");--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "status_history";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key");