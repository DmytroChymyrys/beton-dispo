CREATE TYPE "public"."ad_consent" AS ENUM('GRANTED', 'DENIED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."google_ads_granularity" AS ENUM('CAMPAIGN', 'AD_GROUP');--> statement-breakpoint
CREATE TYPE "public"."google_ads_sync_status" AS ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'PARTIALLY_FAILED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."offline_conversion_stage" AS ENUM('QUALIFIED_LEAD', 'WON_JOB');--> statement-breakpoint
CREATE TYPE "public"."offline_conversion_status" AS ENUM('PENDING', 'PROCESSING', 'UPLOADED', 'RETRY', 'PERMANENTLY_FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."qualification_status" AS ENUM('PENDING', 'QUALIFIED', 'DISQUALIFIED');--> statement-breakpoint
CREATE TYPE "public"."supplier_assignment_status" AS ENUM('PENDING', 'VIEWED', 'INTERESTED', 'QUOTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('PROSPECT', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "google_ads_daily_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar(32) NOT NULL,
	"report_date" date NOT NULL,
	"granularity" "google_ads_granularity" DEFAULT 'CAMPAIGN' NOT NULL,
	"performance_key" text NOT NULL,
	"campaign_id" varchar(32) NOT NULL,
	"campaign_name" varchar(255) NOT NULL,
	"campaign_status" varchar(40),
	"campaign_type" varchar(80),
	"ad_group_id" varchar(32),
	"ad_group_name" varchar(255),
	"currency_code" varchar(8) DEFAULT 'CAD' NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"cost_micros" bigint DEFAULT 0 NOT NULL,
	"conversions" numeric(12, 4) DEFAULT '0' NOT NULL,
	"conversion_value" numeric(14, 4) DEFAULT '0' NOT NULL,
	"all_conversions" numeric(12, 4) DEFAULT '0' NOT NULL,
	"all_conversion_value" numeric(14, 4) DEFAULT '0' NOT NULL,
	"interactions" integer,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_ads_offline_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_request_id" uuid NOT NULL,
	"request_number" varchar(32) NOT NULL,
	"conversion_stage" "offline_conversion_stage" NOT NULL,
	"conversion_action_id" varchar(64),
	"conversion_action_resource_name" varchar(255),
	"gclid" varchar(256),
	"gbraid" varchar(256),
	"wbraid" varchar(256),
	"order_id" varchar(80) NOT NULL,
	"conversion_date_time" timestamp with time zone NOT NULL,
	"conversion_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency_code" varchar(8) DEFAULT 'CAD' NOT NULL,
	"value_strategy" varchar(80) DEFAULT 'fixed' NOT NULL,
	"consent_ad_user_data" "ad_consent" DEFAULT 'UNKNOWN' NOT NULL,
	"consent_ad_personalization" "ad_consent" DEFAULT 'UNKNOWN' NOT NULL,
	"upload_status" "offline_conversion_status" DEFAULT 'PENDING' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"google_job_id" varchar(120),
	"google_error_code" varchar(120),
	"sanitized_error" text,
	"uploaded_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_ads_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "google_ads_sync_status" DEFAULT 'PENDING' NOT NULL,
	"rows_received" integer DEFAULT 0 NOT NULL,
	"rows_upserted" integer DEFAULT 0 NOT NULL,
	"api_calls" integer DEFAULT 0 NOT NULL,
	"error_code" varchar(120),
	"sanitized_error" text,
	"initiated_by" varchar(80) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_request_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"response_status" "supplier_assignment_status" DEFAULT 'PENDING' NOT NULL,
	"quoted_amount" numeric(12, 2),
	"supplier_message" text,
	"accepted_at" timestamp with time zone,
	"declined_at" timestamp with time zone,
	"decline_reason" varchar(255),
	"won_at" timestamp with time zone,
	"lost_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"legal_name" varchar(200),
	"email" varchar(254) NOT NULL,
	"phone" varchar(32),
	"status" "supplier_status" DEFAULT 'PROSPECT' NOT NULL,
	"service_areas" jsonb,
	"project_capabilities" jsonb,
	"minimum_volume_m3" numeric(7, 2),
	"maximum_volume_m3" numeric(7, 2),
	"pump_available" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "qualification_status" "qualification_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "qualified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "qualified_by" varchar(120);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "qualification_reason" text;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "disqualification_reason" varchar(80);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "ad_user_data_consent" "ad_consent" DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "ad_personalization_consent" "ad_consent" DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "consent_captured_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "consent_source" varchar(80);--> statement-breakpoint
ALTER TABLE "google_ads_offline_conversions" ADD CONSTRAINT "google_ads_offline_conversions_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_assignments" ADD CONSTRAINT "supplier_assignments_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_assignments" ADD CONSTRAINT "supplier_assignments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "google_ads_daily_unique_idx" ON "google_ads_daily_performance" USING btree ("performance_key");--> statement-breakpoint
CREATE INDEX "google_ads_daily_report_date_idx" ON "google_ads_daily_performance" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "google_ads_daily_campaign_idx" ON "google_ads_daily_performance" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "google_ads_daily_customer_date_idx" ON "google_ads_daily_performance" USING btree ("customer_id","report_date");--> statement-breakpoint
CREATE UNIQUE INDEX "google_ads_offline_order_id_idx" ON "google_ads_offline_conversions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "google_ads_offline_stage_request_idx" ON "google_ads_offline_conversions" USING btree ("conversion_stage","quote_request_id");--> statement-breakpoint
CREATE INDEX "google_ads_offline_status_next_idx" ON "google_ads_offline_conversions" USING btree ("upload_status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "google_ads_offline_quote_idx" ON "google_ads_offline_conversions" USING btree ("quote_request_id");--> statement-breakpoint
CREATE INDEX "google_ads_sync_runs_started_idx" ON "google_ads_sync_runs" USING btree ("started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "google_ads_sync_runs_status_idx" ON "google_ads_sync_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_assignments_unique_idx" ON "supplier_assignments" USING btree ("quote_request_id","supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_assignments_supplier_idx" ON "supplier_assignments" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_assignments_quote_idx" ON "supplier_assignments" USING btree ("quote_request_id");--> statement-breakpoint
CREATE INDEX "supplier_assignments_status_idx" ON "supplier_assignments" USING btree ("response_status");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_email_idx" ON "suppliers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "quote_requests_qualification_status_idx" ON "quote_requests" USING btree ("qualification_status");--> statement-breakpoint
CREATE INDEX "quote_requests_qualified_at_idx" ON "quote_requests" USING btree ("qualified_at");
