CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('applied', 'under_review', 'phone_screen', 'interviewed', 'offer_extended', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('greenhouse', 'lever', 'workday', 'bamboohr', 'linkedin', 'indeed', 'custom');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed', 'bounced', 'opened');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'seeker', 'employer', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'past_due', 'trialing', 'paused', 'expired');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('job_seeker', 'employer', 'admin');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seeker_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"resume_id" uuid,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"status_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_letter" text,
	"notes" text,
	"external_url" text,
	"contact_info" jsonb,
	"next_interview_at" timestamp with time zone,
	"offer_details" jsonb,
	"match_score" numeric(5, 2),
	"ai_explanation" text,
	"applied_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "applications_seeker_id_job_id_unique" UNIQUE("seeker_id","job_id")
);
--> statement-breakpoint
CREATE TABLE "career_site_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"label" varchar(255),
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"api_key" text,
	"provider_config" jsonb,
	"is_active" boolean DEFAULT true,
	"sync_interval_minutes" integer DEFAULT 60,
	"last_synced_at" timestamp with time zone,
	"next_sync_at" timestamp with time zone,
	"last_sync_job_count" integer DEFAULT 0,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "career_site_integrations_employer_id_provider_unique" UNIQUE("employer_id","provider")
);
--> statement-breakpoint
CREATE TABLE "email_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid,
	"to_email" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"template_variables" jsonb,
	"job_ids" jsonb,
	"provider_message_id" varchar(255),
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"company_website" text,
	"company_logo_url" text,
	"company_description" text,
	"company_size" varchar(50),
	"industry" varchar(150),
	"headquarters_location" varchar(255),
	"social_links" jsonb,
	"embedding" vector(1024),
	"active_job_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "employer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "notification_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"dodo_payment_id" varchar(255),
	"dodo_customer_id" varchar(255),
	"event_type" varchar(100) NOT NULL,
	"status" "payment_status" NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"raw_payload" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payments_dodo_payment_id_unique" UNIQUE("dodo_payment_id")
);
--> statement-breakpoint
CREATE TABLE "seeker_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"headline" varchar(500),
	"summary" text,
	"skills" jsonb,
	"experience_years" integer,
	"experience_level" varchar(50),
	"education" jsonb,
	"certifications" jsonb,
	"languages" jsonb,
	"work_history" jsonb,
	"desired_job_titles" jsonb,
	"desired_locations" jsonb,
	"desired_salary_min" numeric(10, 2),
	"desired_salary_max" numeric(10, 2),
	"desired_job_type" varchar(50),
	"open_to_remote" boolean DEFAULT true,
	"open_to_relocation" boolean DEFAULT false,
	"embedding" vector(1024),
	"prompt_history_summary" text,
	"last_parsed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "seeker_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"dodo_customer_id" varchar(255),
	"dodo_subscription_id" varchar(255),
	"dodo_product_id" varchar(255),
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"access_until" timestamp with time zone,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_dodo_subscription_id_unique" UNIQUE("dodo_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_seeker_id_users_id_fk" FOREIGN KEY ("seeker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_site_integrations" ADD CONSTRAINT "career_site_integrations_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeker_profiles" ADD CONSTRAINT "seeker_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_applications_seeker_status" ON "applications" USING btree ("seeker_id","status");--> statement-breakpoint
CREATE INDEX "idx_applications_job_pipeline" ON "applications" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_integrations_employer" ON "career_site_integrations" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "idx_integrations_sync_queue" ON "career_site_integrations" USING btree ("is_active","next_sync_at");--> statement-breakpoint
CREATE INDEX "idx_email_notif_pending" ON "email_notifications" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_email_notif_user" ON "email_notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_email_notif_template" ON "email_notifications" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_employer_profiles_user" ON "employer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_employer_profiles_company" ON "employer_profiles" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "idx_employer_profiles_industry" ON "employer_profiles" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_notif_templates_slug" ON "notification_templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_payments_user" ON "payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_payments_dodo_payment" ON "payments" USING btree ("dodo_payment_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_seeker_profiles_user" ON "seeker_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_seeker_profiles_level" ON "seeker_profiles" USING btree ("experience_level");--> statement-breakpoint
CREATE INDEX "idx_seeker_profiles_job_type" ON "seeker_profiles" USING btree ("desired_job_type");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_dodo_sub" ON "subscriptions" USING btree ("dodo_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_period_end" ON "subscriptions" USING btree ("current_period_end");