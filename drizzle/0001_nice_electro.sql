ALTER TABLE "quote_requests" ADD COLUMN "abuse_status" varchar(32) DEFAULT 'clean' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "source_ip_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "duplicate_fingerprint" varchar(64);--> statement-breakpoint
CREATE INDEX "quote_requests_source_ip_hash_idx" ON "quote_requests" USING btree ("source_ip_hash");--> statement-breakpoint
CREATE INDEX "quote_requests_duplicate_fingerprint_idx" ON "quote_requests" USING btree ("duplicate_fingerprint");