CREATE TYPE "public"."concrete_strength" AS ENUM('UNKNOWN', 'MPA_25', 'MPA_30', 'MPA_32', 'MPA_35', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."contact_method" AS ENUM('PHONE', 'SMS', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('BUSINESS', 'INDIVIDUAL');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('fr', 'en');--> statement-breakpoint
CREATE TYPE "public"."preferred_time" AS ENUM('MORNING', 'AFTERNOON', 'FLEXIBLE');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('FOUNDATION', 'SLAB', 'GARAGE', 'POOL', 'LANDSCAPING', 'COMMERCIAL', 'REPAIR', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'QUOTING', 'OFFER_SENT', 'WON', 'LOST', 'INVALID');--> statement-breakpoint
CREATE TYPE "public"."tri_state" AS ENUM('YES', 'NO', 'UNKNOWN');--> statement-breakpoint
CREATE SEQUENCE "public"."quote_reference_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" bigint DEFAULT nextval('quote_reference_seq') NOT NULL,
	"public_id" text GENERATED ALWAYS AS ('BD-' || lpad(reference_number::text, 6, '0')) STORED NOT NULL,
	"locale" "locale" DEFAULT 'fr' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_type" "customer_type" NOT NULL,
	"name" varchar(120) NOT NULL,
	"company_name" varchar(160),
	"email" varchar(254) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"preferred_contact_method" "contact_method" NOT NULL,
	"address" varchar(240) NOT NULL,
	"city" varchar(120) NOT NULL,
	"postal_code" varchar(12) NOT NULL,
	"access_notes" text,
	"project_type" "project_type" NOT NULL,
	"estimated_volume_m3" numeric(7, 2),
	"volume_unknown" boolean DEFAULT false NOT NULL,
	"concrete_strength" "concrete_strength" DEFAULT 'UNKNOWN' NOT NULL,
	"pump_required" "tri_state" DEFAULT 'UNKNOWN' NOT NULL,
	"pump_notes" text,
	"desired_date" date NOT NULL,
	"preferred_time" "preferred_time",
	"schedule_flexible" boolean DEFAULT false NOT NULL,
	"additional_notes" text,
	"utm_source" varchar(120),
	"utm_medium" varchar(120),
	"utm_campaign" varchar(160),
	"utm_term" varchar(160),
	"utm_content" varchar(160),
	"referrer" varchar(512),
	"landing_page" varchar(512),
	"status" "quote_status" DEFAULT 'NEW' NOT NULL,
	"internal_notes" text,
	"lost_reason" text
);
--> statement-breakpoint
CREATE INDEX "quote_requests_created_at_idx" ON "quote_requests" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "quote_requests_status_idx" ON "quote_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quote_requests_city_idx" ON "quote_requests" USING btree ("city");--> statement-breakpoint
CREATE INDEX "quote_requests_desired_date_idx" ON "quote_requests" USING btree ("desired_date");--> statement-breakpoint
CREATE INDEX "quote_requests_customer_type_idx" ON "quote_requests" USING btree ("customer_type");