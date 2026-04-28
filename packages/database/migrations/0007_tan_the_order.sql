ALTER TABLE "messages" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "dodo_payment_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "dodo_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "event_type" varchar(100);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "raw_payload" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "idempotency_key" varchar(255);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "dodo_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "raw_data" jsonb;