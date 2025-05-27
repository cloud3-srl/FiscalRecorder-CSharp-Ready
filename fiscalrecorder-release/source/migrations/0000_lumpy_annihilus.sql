-- Previous CREATE TABLE statements removed as tables already exist.
-- Applying changes only to the "customers" table.

ALTER TABLE "customers" ADD COLUMN "province" varchar(50);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "country" varchar(50);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "sdi_code" varchar(7);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "payment_code" varchar(50);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "last_synced_from_external_at" timestamp;
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
