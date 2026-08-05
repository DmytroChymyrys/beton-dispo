ALTER TABLE "quote_requests" ADD COLUMN "gclid" varchar(256);--> statement-breakpoint
CREATE INDEX "quote_requests_gclid_idx" ON "quote_requests" USING btree ("gclid");
