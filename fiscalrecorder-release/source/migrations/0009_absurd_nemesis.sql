ALTER TABLE "customers" ALTER COLUMN "code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vat_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "department_code" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "family_description" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "homogeneous_category_code" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "homogeneous_category_description" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_lot_managed" boolean;