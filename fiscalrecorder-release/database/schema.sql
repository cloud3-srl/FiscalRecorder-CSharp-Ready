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
ALTER TABLE "customers" ALTER COLUMN "code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vat_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "department_code" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "family_description" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "homogeneous_category_code" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "homogeneous_category_description" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_lot_managed" boolean;CREATE TABLE "product_lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"warehouse_id" integer NOT NULL,
	"lot_number" varchar(100) NOT NULL,
	"external_lot_code" varchar(100),
	"quantity_available" numeric(10, 2) DEFAULT '0' NOT NULL,
	"expiry_date" date,
	"entry_date" date,
	"cost_price" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "default_warehouse_id" integer;--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "product_lot_id" integer;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "warehouse_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "product_lots" ADD CONSTRAINT "product_lots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_lots" ADD CONSTRAINT "product_lots_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_product_warehouse_lot_idx" ON "product_lots" USING btree ("product_id","warehouse_id","lot_number");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_default_warehouse_id_warehouses_id_fk" FOREIGN KEY ("default_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_lot_id_product_lots_id_fk" FOREIGN KEY ("product_lot_id") REFERENCES "public"."product_lots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;TRUNCATE TABLE "sale_items", "sales" RESTART IDENTITY CASCADE;
ALTER TABLE "sales" ALTER COLUMN "warehouse_id" DROP NOT NULL;
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "sale_id" DROP NOT NULL;ALTER TABLE "sale_items" ADD COLUMN lot_number VARCHAR(100);
-- Crea gruppi favoriti di default basati sui reparti esistenti
INSERT INTO favorite_groups (name, type, original_id, display_order, created_at, updated_at)
SELECT 
    COALESCE(button_description, description) as name,
    'department' as type,
    id as original_id,
    id as display_order,
    NOW() as created_at,
    NOW() as updated_at
FROM departments
WHERE NOT EXISTS (
    SELECT 1 FROM favorite_groups 
    WHERE type = 'department' AND original_id = departments.id
);

-- Se non esistono reparti, crea alcuni gruppi favoriti di default
INSERT INTO favorite_groups (name, type, display_order, created_at, updated_at)
SELECT 'Bevande Calde', 'custom', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM favorite_groups);

INSERT INTO favorite_groups (name, type, display_order, created_at, updated_at)
SELECT 'Snack Dolci', 'custom', 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM favorite_groups WHERE name = 'Snack Dolci');

INSERT INTO favorite_groups (name, type, display_order, created_at, updated_at)
SELECT 'Promozioni', 'custom', 3, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM favorite_groups WHERE name = 'Promozioni');
