CREATE TABLE "quote_request_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_request_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" varchar(40) DEFAULT 'system' NOT NULL,
	"type" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "quote_request_events" ADD CONSTRAINT "quote_request_events_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quote_request_events_request_created_idx" ON "quote_request_events" USING btree ("quote_request_id","created_at");--> statement-breakpoint
CREATE INDEX "quote_request_events_type_idx" ON "quote_request_events" USING btree ("type");