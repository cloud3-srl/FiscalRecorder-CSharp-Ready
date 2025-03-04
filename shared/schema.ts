import { pgTable, text, serial, integer, numeric, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  listCode: varchar("list_code", { length: 50 }),
  activationDate: timestamp("activation_date"),
  deactivationDate: timestamp("deactivation_date"),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }),
  controlFlag: varchar("control_flag", { length: 10 }),
  discount1: numeric("discount1", { precision: 5, scale: 2 }),
  discount2: numeric("discount2", { precision: 5, scale: 2 }),
  discount3: numeric("discount3", { precision: 5, scale: 2 }),
  discount4: numeric("discount4", { precision: 5, scale: 2 }),
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
  label: varchar("label", { length: 50 }),
  active: boolean("active").default(true)
});

// Nuova tabella per le configurazioni del database esterno
export const databaseConfigs = pgTable("database_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  driver: varchar("driver", { length: 100 }).notNull(),
  server: varchar("server", { length: 100 }).notNull(),
  database: varchar("database", { length: 100 }).notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  password: varchar("password", { length: 100 }).notNull(),
  options: jsonb("options").default({}),
  isActive: boolean("is_active").default(false),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Nuova tabella per le configurazioni dell'applicazione
export const appConfigs = pgTable("app_configs", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Nuova tabella per le configurazioni della stampante
export const printerConfigs = pgTable("printer_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  printerName: varchar("printer_name", { length: 100 }).notNull(),
  paperWidth: integer("paper_width").default(140),
  paperHeight: integer("paper_height").default(199),
  marginTop: integer("margin_top").default(0),
  marginBottom: integer("margin_bottom").default(0),
  marginLeft: integer("margin_left").default(0),
  marginRight: integer("margin_right").default(0),
  headerText: text("header_text"),
  footerText: text("footer_text"),
  logoEnabled: boolean("logo_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, timestamp: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertQuickButtonSchema = createInsertSchema(quickButtons).omit({ id: true });
export const insertDatabaseConfigSchema = createInsertSchema(databaseConfigs).omit({ id: true, lastSync: true, createdAt: true });
export const insertAppConfigSchema = createInsertSchema(appConfigs).omit({ id: true, updatedAt: true });
// Aggiungi i tipi e gli schema
export const insertPrinterConfigSchema = createInsertSchema(printerConfigs).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type QuickButton = typeof quickButtons.$inferSelect;
export type DatabaseConfig = typeof databaseConfigs.$inferSelect;
export type AppConfig = typeof appConfigs.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type InsertQuickButton = z.infer<typeof insertQuickButtonSchema>;
export type InsertDatabaseConfig = z.infer<typeof insertDatabaseConfigSchema>;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type PrinterConfig = typeof printerConfigs.$inferSelect;
export type InsertPrinterConfig = z.infer<typeof insertPrinterConfigSchema>;