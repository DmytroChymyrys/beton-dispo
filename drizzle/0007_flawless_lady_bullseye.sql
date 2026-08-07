CREATE TYPE "public"."supplier_application_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE SEQUENCE "public"."supplier_application_reference_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "supplier_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" bigint DEFAULT nextval('supplier_application_reference_seq') NOT NULL,
	"public_id" text GENERATED ALWAYS AS ('BP-' || lpad(reference_number::text, 6, '0')) STORED NOT NULL,
	"locale" "locale" DEFAULT 'fr' NOT NULL,
	"status" "supplier_application_status" DEFAULT 'NEW' NOT NULL,
	"company_name" varchar(160) NOT NULL,
	"contact_name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"website" varchar(255),
	"service_area_text" varchar(500) NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"message" text,
	"landing_page" varchar(512),
	"referrer" varchar(512),
	"gclid" varchar(256),
	"msclkid" varchar(256),
	"fbclid" varchar(256),
	"utm_source" varchar(120),
	"utm_medium" varchar(120),
	"utm_campaign" varchar(160),
	"utm_term" varchar(160),
	"utm_content" varchar(160),
	"first_touch_source" varchar(120),
	"first_touch_medium" varchar(120),
	"first_touch_campaign" varchar(160),
	"first_touch_term" varchar(160),
	"first_touch_content" varchar(160),
	"first_touch_landing_page" varchar(512),
	"first_touch_referrer" varchar(512),
	"first_touch_timestamp" timestamp with time zone,
	"last_touch_source" varchar(120),
	"last_touch_medium" varchar(120),
	"last_touch_campaign" varchar(160),
	"last_touch_term" varchar(160),
	"last_touch_content" varchar(160),
	"last_touch_landing_page" varchar(512),
	"last_touch_referrer" varchar(512),
	"last_touch_timestamp" timestamp with time zone,
	"submission_page" varchar(512),
	"device_category" varchar(16),
	"browser_language" varchar(80),
	"abuse_status" varchar(32) DEFAULT 'clean' NOT NULL,
	"source_ip_hash" varchar(64),
	"duplicate_fingerprint" varchar(64),
	"internal_notes" text,
	"first_contacted_at" timestamp with time zone,
	"qualified_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "supplier_applications_created_at_idx" ON "supplier_applications" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "supplier_applications_status_idx" ON "supplier_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "supplier_applications_email_idx" ON "supplier_applications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "supplier_applications_company_idx" ON "supplier_applications" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "supplier_applications_source_idx" ON "supplier_applications" USING btree ("first_touch_source");--> statement-breakpoint
CREATE INDEX "supplier_applications_duplicate_fingerprint_idx" ON "supplier_applications" USING btree ("duplicate_fingerprint");--> statement-breakpoint
CREATE INDEX "supplier_applications_source_ip_hash_idx" ON "supplier_applications" USING btree ("source_ip_hash");