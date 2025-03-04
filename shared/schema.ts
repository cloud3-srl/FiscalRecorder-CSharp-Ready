import { pgTable, text, serial, integer, numeric, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }),
  inStock: integer("in_stock").default(0)
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  receiptNumber: varchar("receipt_number", { length: 50 }).notNull()
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 5, scale: 2 }).default("0")
});

export const quickButtons = pgTable("quick_buttons", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  position: integer("position").notNull(),
  department: integer("department").notNull().default(1),
  label: varchar("label", { length: 50 }),
  active: boolean("active").default(true)
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, timestamp: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertQuickButtonSchema = createInsertSchema(quickButtons).omit({ id: true });

export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type QuickButton = typeof quickButtons.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type InsertQuickButton = z.infer<typeof insertQuickButtonSchema>;