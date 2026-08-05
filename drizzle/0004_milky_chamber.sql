ALTER TABLE "quote_requests" ADD COLUMN "msclkid" varchar(256);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "fbclid" varchar(256);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_touch_source" varchar(120);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_touch_medium" varchar(120);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_touch_campaign" varchar(160);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_touch_term" varchar(160);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_touch_content" varchar(160);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_touch_landing_page" varchar(512);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_touch_referrer" varchar(512);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_touch_timestamp" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "last_touch_source" varchar(120);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "last_touch_medium" varchar(120);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "last_touch_campaign" varchar(160);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "last_touch_term" varchar(160);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "last_touch_content" varchar(160);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "last_touch_landing_page" varchar(512);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "last_touch_referrer" varchar(512);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "last_touch_timestamp" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "quote_entry_page" varchar(512);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "submission_page" varchar(512);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "device_category" varchar(16);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "browser_language" varchar(80);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_response_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "first_contact_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "won_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "lost_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "estimated_job_value_cad" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "final_job_value_cad" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "betondispo_revenue_cad" numeric(12, 2);--> statement-breakpoint
CREATE INDEX "quote_requests_first_touch_source_idx" ON "quote_requests" USING btree ("first_touch_source");--> statement-breakpoint
CREATE INDEX "quote_requests_first_touch_landing_page_idx" ON "quote_requests" USING btree ("first_touch_landing_page");--> statement-breakpoint
CREATE INDEX "quote_requests_last_touch_source_idx" ON "quote_requests" USING btree ("last_touch_source");--> statement-breakpoint
CREATE INDEX "quote_requests_quote_entry_page_idx" ON "quote_requests" USING btree ("quote_entry_page");--> statement-breakpoint
CREATE INDEX "quote_requests_first_response_at_idx" ON "quote_requests" USING btree ("first_response_at");--> statement-breakpoint
CREATE INDEX "quote_requests_won_at_idx" ON "quote_requests" USING btree ("won_at");