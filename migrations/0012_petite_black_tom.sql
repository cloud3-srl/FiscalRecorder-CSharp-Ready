ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "sale_id" DROP NOT NULL;