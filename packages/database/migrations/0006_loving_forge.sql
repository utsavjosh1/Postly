CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(100),
	"subject" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "career_site_integrations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "discord_configs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "discord_posted_jobs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_notifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "job_fingerprints" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_attachments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_templates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "plan_quotas" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "promo_codes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rate_limit_overrides" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scrape_runs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scrape_sources" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "career_site_integrations" CASCADE;--> statement-breakpoint
DROP TABLE "discord_configs" CASCADE;--> statement-breakpoint
DROP TABLE "discord_posted_jobs" CASCADE;--> statement-breakpoint
DROP TABLE "email_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "job_fingerprints" CASCADE;--> statement-breakpoint
DROP TABLE "message_attachments" CASCADE;--> statement-breakpoint
DROP TABLE "notification_templates" CASCADE;--> statement-breakpoint
DROP TABLE "plan_quotas" CASCADE;--> statement-breakpoint
DROP TABLE "promo_codes" CASCADE;--> statement-breakpoint
DROP TABLE "rate_limit_overrides" CASCADE;--> statement-breakpoint
DROP TABLE "scrape_runs" CASCADE;--> statement-breakpoint
DROP TABLE "scrape_sources" CASCADE;--> statement-breakpoint
ALTER TABLE "bot_posts" DROP CONSTRAINT "bot_posts_bot_config_id_job_id_unique";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_dodo_payment_id_unique";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_idempotency_key_unique";--> statement-breakpoint
ALTER TABLE "token_usage" DROP CONSTRAINT "token_usage_user_id_window_type_window_start_unique";--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_scrape_source_id_scrape_sources_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_promo_code_id_promo_codes_id_fk";
--> statement-breakpoint
ALTER TABLE "system_prompts" DROP CONSTRAINT "system_prompts_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "bot_configs" ALTER COLUMN "platform" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."bot_platform";--> statement-breakpoint
CREATE TYPE "public"."bot_platform" AS ENUM('discord', 'reddit', 'twitter');--> statement-breakpoint
ALTER TABLE "bot_configs" ALTER COLUMN "platform" SET DATA TYPE "public"."bot_platform" USING "platform"::"public"."bot_platform";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscription_plan";--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('seeker', 'employer', 'discord_owner');--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DATA TYPE "public"."subscription_plan" USING "plan"::"public"."subscription_plan";--> statement-breakpoint
DROP INDEX "idx_applications_seeker_status";--> statement-breakpoint
DROP INDEX "idx_applications_job_pipeline";--> statement-breakpoint
DROP INDEX "idx_bot_configs_active";--> statement-breakpoint
DROP INDEX "idx_bot_posts_config";--> statement-breakpoint
DROP INDEX "idx_conversations_user";--> statement-breakpoint
DROP INDEX "idx_conversations_archived";--> statement-breakpoint
DROP INDEX "idx_employer_profiles_company";--> statement-breakpoint
DROP INDEX "idx_employer_profiles_industry";--> statement-breakpoint
DROP INDEX "idx_job_matches_user";--> statement-breakpoint
DROP INDEX "idx_job_matches_job";--> statement-breakpoint
DROP INDEX "idx_jobs_location";--> statement-breakpoint
DROP INDEX "idx_jobs_remote";--> statement-breakpoint
DROP INDEX "idx_jobs_type";--> statement-breakpoint
DROP INDEX "idx_messages_conversation";--> statement-breakpoint
DROP INDEX "idx_messages_parent";--> statement-breakpoint
DROP INDEX "idx_messages_active";--> statement-breakpoint
DROP INDEX "idx_payments_user";--> statement-breakpoint
DROP INDEX "idx_payments_dodo_payment";--> statement-breakpoint
DROP INDEX "idx_payments_status";--> statement-breakpoint
DROP INDEX "idx_seeker_profiles_level";--> statement-breakpoint
DROP INDEX "idx_seeker_profiles_job_type";--> statement-breakpoint
DROP INDEX "idx_subscriptions_user";--> statement-breakpoint
DROP INDEX "idx_subscriptions_status";--> statement-breakpoint
DROP INDEX "idx_subscriptions_dodo_sub";--> statement-breakpoint
DROP INDEX "idx_subscriptions_period_end";--> statement-breakpoint
DROP INDEX "idx_system_prompts_active";--> statement-breakpoint
DROP INDEX "idx_token_usage_user_window";--> statement-breakpoint
DROP INDEX "idx_users_reset_token";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bot_configs" ADD COLUMN "target_id" varchar(255);--> statement-breakpoint
ALTER TABLE "bot_configs" ADD COLUMN "target_name" varchar(255);--> statement-breakpoint
ALTER TABLE "bot_configs" ADD COLUMN "webhook_url" text;--> statement-breakpoint
ALTER TABLE "bot_configs" ADD COLUMN "filter_keywords" varchar(500);--> statement-breakpoint
ALTER TABLE "bot_configs" ADD COLUMN "filter_locations" varchar(500);--> statement-breakpoint
ALTER TABLE "bot_configs" ADD COLUMN "filter_min_salary" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bot_configs" ADD COLUMN "filter_job_types" varchar(255)[];--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "external_url";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "contact_info";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "next_interview_at";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "offer_details";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "match_score";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "ai_explanation";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "audit_log" DROP COLUMN "diff";--> statement-breakpoint
ALTER TABLE "audit_log" DROP COLUMN "ip_address";--> statement-breakpoint
ALTER TABLE "bot_configs" DROP COLUMN "platform_config";--> statement-breakpoint
ALTER TABLE "bot_configs" DROP COLUMN "token_expires_at";--> statement-breakpoint
ALTER TABLE "bot_configs" DROP COLUMN "job_filters";--> statement-breakpoint
ALTER TABLE "bot_configs" DROP COLUMN "post_format";--> statement-breakpoint
ALTER TABLE "bot_configs" DROP COLUMN "max_posts_per_day";--> statement-breakpoint
ALTER TABLE "bot_configs" DROP COLUMN "post_schedule";--> statement-breakpoint
ALTER TABLE "bot_posts" DROP COLUMN "platform";--> statement-breakpoint
ALTER TABLE "bot_posts" DROP COLUMN "content_snapshot";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "model";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "is_archived";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "system_prompt_version";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "total_tokens_used";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "context_window_used";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "scrape_source_id";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "parent_message_id";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "model_used";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "latency_ms";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "finish_reason";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "cost_usd";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "dodo_payment_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "dodo_customer_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "event_type";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "idempotency_key";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "raw_payload";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "paid_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "dodo_customer_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "dodo_product_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "current_period_start";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "trial_ends_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "cancelled_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "access_until";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "promo_code_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "raw_data";--> statement-breakpoint
ALTER TABLE "system_prompts" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "token_usage" DROP COLUMN "window_type";--> statement-breakpoint
ALTER TABLE "token_usage" DROP COLUMN "api_calls";--> statement-breakpoint
ALTER TABLE "token_usage" DROP COLUMN "job_matches";--> statement-breakpoint
ALTER TABLE "token_usage" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "token_usage" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_window_start_unique" UNIQUE("user_id","window_start");--> statement-breakpoint
DROP TYPE "public"."integration_provider";--> statement-breakpoint
DROP TYPE "public"."scrape_source_status";