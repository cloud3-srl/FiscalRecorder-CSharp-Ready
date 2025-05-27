import { pgTable, text, serial, integer, numeric, varchar, timestamp, boolean, jsonb, primaryKey, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Definizione tabella warehouses (REINTRODOTTA)
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  barcode: varchar("barcode", { length: 50 }), 
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }), 
  listCode: varchar("list_code", { length: 50 }),
  activationDate: timestamp("activation_date"),
  deactivationDate: timestamp("deactivation_date"),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }),
  controlFlag: varchar("control_flag", { length: 10 }), 
  discount1: numeric("discount1", { precision: 5, scale: 2 }),
  discount2: numeric("discount2", { precision: 5, scale: 2 }),
  discount3: numeric("discount3", { precision: 5, scale: 2 }),
  discount4: numeric("discount4", { precision: 5, scale: 2 }),
  departmentCode: varchar("department_code", { length: 10 }), 
  category: varchar("category", { length: 50 }), 
  familyDescription: varchar("family_description", { length: 100 }), 
  homogeneousCategoryCode: varchar("homogeneous_category_code", { length: 10 }), 
  homogeneousCategoryDescription: varchar("homogeneous_category_description", { length: 100 }), 
  isLotManaged: boolean("is_lot_managed"), 
  inStock: integer("in_stock").default(0),
  defaultWarehouseId: integer("default_warehouse_id").references(() => warehouses.id, { onDelete: 'set null' })
});

// Definizione tabella productLots (REINTRODOTTA)
export const productLots = pgTable("product_lots", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id, { onDelete: 'restrict' }),
  lotNumber: varchar("lot_number", { length: 100 }).notNull(),
  externalLotCode: varchar("external_lot_code", { length: 100 }),
  quantityAvailable: numeric("quantity_available", { precision: 10, scale: 2 }).notNull().default("0"),
  expiryDate: date("expiry_date"),
  entryDate: date("entry_date"),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  unq_product_warehouse_lot: uniqueIndex("unq_product_warehouse_lot_idx").on(table.productId, table.warehouseId, table.lotNumber),
}));

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  receiptNumber: varchar("receipt_number", { length: 50 }).notNull(),
  customerId: integer("customer_id"), 
  status: varchar("status", { length: 20 }).default("completed").notNull(),
  notes: text("notes"),
  returnedSaleId: integer("returned_sale_id"), 
  warehouseId: integer("warehouse_id").references(() => warehouses.id, { onDelete: 'restrict' })
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id"), 
  productId: integer("product_id"), 
  productLotId: integer("product_lot_id").references(() => productLots.id, { onDelete: 'restrict' }),
  lotNumber: varchar("lot_number", { length: 100 }), 
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

export const syncTableNamesSchema = z.object({
  products: z.string().optional(),
  customers: z.string().optional(),
  paymentMethods: z.string().optional(),
}).optional();

export const databaseConfigOptionsSchema = z.object({
  syncTableNames: syncTableNamesSchema,
  defaultCompanyCodeForSync: z.string().optional()
}).optional();

export const appConfigs = pgTable("app_configs", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

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
  logoImage: text("logo_image"),
  logoWidth: integer("logo_width").default(120),
  logoHeight: integer("logo_height").default(40),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  fiscalCode: varchar("fiscal_code", { length: 16 }),
  vatNumber: varchar("vat_number", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 50 }),
  country: varchar("country", { length: 50 }),
  sdiCode: varchar("sdi_code", { length: 7 }),
  paymentCode: varchar("payment_code", { length: 50 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  points: integer("points").default(0),
  lastSyncedFromExternalAt: timestamp("last_synced_from_external_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const dbConnectionLogs = pgTable("db_connection_logs", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  message: text("message"),
  details: jsonb("details").default({}),
  duration: integer("duration")
});

export const scheduledOperations = pgTable("scheduled_operations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  configId: integer("config_id").notNull(),
  schedule: varchar("schedule", { length: 100 }).notNull(),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  options: jsonb("options").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const sqlQueryHistory = pgTable("sql_query_history", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").notNull(),
  query: text("query").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  duration: integer("duration"),
  status: varchar("status", { length: 20 }).notNull(),
  message: text("message"),
  rowsAffected: integer("rows_affected"),
  userId: integer("user_id")
});

export const companyProfile = pgTable('company_profile', {
  id: serial('id').primaryKey(),
  groupName: text('group_name'),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  addressStreet: text('address_street'),
  addressZip: varchar('address_zip', { length: 20 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressProvince: varchar('address_province', { length: 50 }),
  addressCountry: varchar('address_country', { length: 50 }),
  vatNumber: varchar('vat_number', { length: 20 }),
  fiscalCode: varchar('fiscal_code', { length: 20 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  description: varchar('description', { length: 255 }).notNull(),
  buttonDescription: varchar('button_description', { length: 50 }).notNull(),
  receiptDescription: varchar('receipt_description', { length: 100 }).notNull(),
  vatRateId: integer('vat_rate_id'),
  vatRateValue: numeric('vat_rate_value', { precision: 5, scale: 2 }),
  saleType: varchar('sale_type', { length: 100 }).notNull(),
  amountLimit: numeric('amount_limit', { precision: 10, scale: 2 }),
  color: varchar('color', { length: 7 }).notNull().default('#FFFFFF'),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  departmentId: integer('department_id').references(() => departments.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const saleModes = pgTable('sale_modes', {
  id: serial('id').primaryKey(),
  description: varchar('description', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }),
  chargeOrDiscountPercent: numeric('charge_or_discount_percent', { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionKey: varchar('permission_key', { length: 100 }).notNull(), 
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionKey] }), 
}));

export const saleCausals = pgTable('sale_causals', {
  id: serial('id').primaryKey(),
  description: varchar('description', { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const operators = pgTable('operators', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const favoriteGroups = pgTable('favorite_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).default('custom').notNull(),
  originalId: integer('original_id'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const favoriteSlots = pgTable('favorite_slots', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => favoriteGroups.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  positionInGrid: integer('position_in_grid').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('other').notNull(),
  isActive: boolean('is_active').default(true),
  details: jsonb('details').default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, timestamp: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertQuickButtonSchema = createInsertSchema(quickButtons).omit({ id: true });
export const insertDatabaseConfigSchema = createInsertSchema(databaseConfigs).omit({ id: true, lastSync: true, createdAt: true });
export const insertAppConfigSchema = createInsertSchema(appConfigs).omit({ id: true, updatedAt: true });
export const insertPrinterConfigSchema = createInsertSchema(printerConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true, lastSyncedFromExternalAt: true }); 
export const insertDbConnectionLogSchema = createInsertSchema(dbConnectionLogs).omit({ id: true, timestamp: true });
export const insertScheduledOperationSchema = createInsertSchema(scheduledOperations).omit({ id: true, lastRun: true, nextRun: true, createdAt: true, updatedAt: true });
export const insertSqlQueryHistorySchema = createInsertSchema(sqlQueryHistory).omit({ id: true, timestamp: true });
export const insertCompanyProfileSchema = createInsertSchema(companyProfile).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSaleModeSchema = createInsertSchema(saleModes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOperatorSchema = createInsertSchema(operators).omit({ id: true, createdAt: true, updatedAt: true, hashedPassword: true });
export const operatorFormSchema = insertOperatorSchema.extend({
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri").optional(), 
  confirmPassword: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});
export const insertSaleCausalSchema = createInsertSchema(saleCausals).omit({ id: true, createdAt: true, updatedAt: true });
export const updateOperatorFormSchema = insertOperatorSchema.extend({
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri").optional(),
  confirmPassword: z.string().optional(),
}).partial().refine(data => {
  if (data.password !== undefined || data.confirmPassword !== undefined) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});
export const insertFavoriteGroupSchema = createInsertSchema(favoriteGroups);
export const insertFavoriteSlotSchema = createInsertSchema(favoriteSlots);
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods);

// Schemi Zod per warehouses e productLots (REINTRODOTTI)
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductLotSchema = createInsertSchema(productLots).omit({ id: true, createdAt: true, updatedAt: true });


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
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type DbConnectionLog = typeof dbConnectionLogs.$inferSelect;
export type InsertDbConnectionLog = z.infer<typeof insertDbConnectionLogSchema>;
export type ScheduledOperation = typeof scheduledOperations.$inferSelect;
export type InsertScheduledOperation = z.infer<typeof insertScheduledOperationSchema>;
export type SqlQueryHistory = typeof sqlQueryHistory.$inferSelect;
export type InsertSqlQueryHistory = z.infer<typeof insertSqlQueryHistorySchema>;
export type CompanyProfile = typeof companyProfile.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type SaleMode = typeof saleModes.$inferSelect;
export type InsertSaleMode = z.infer<typeof insertSaleModeSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type Operator = typeof operators.$inferSelect;
export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type SaleCausal = typeof saleCausals.$inferSelect;
export type InsertSaleCausal = z.infer<typeof insertSaleCausalSchema>;
export type FavoriteGroup = typeof favoriteGroups.$inferSelect;
export type InsertFavoriteGroup = z.infer<typeof insertFavoriteGroupSchema>;
export type FavoriteSlot = typeof favoriteSlots.$inferSelect;
export type InsertFavoriteSlot = z.infer<typeof insertFavoriteSlotSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

// Tipi per warehouses e productLots (REINTRODOTTI)
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type ProductLot = typeof productLots.$inferSelect;
export type InsertProductLot = z.infer<typeof insertProductLotSchema>;


export const AVAILABLE_PERMISSIONS = {
  VIEW_POS: "Visualizzare pagina POS",
  MANAGE_SALES: "Gestire vendite (pagamenti, resi)",
  VIEW_REPORTS: "Visualizzare report",
  MANAGE_CUSTOMERS: "Gestire clienti",
  ACCESS_SETTINGS: "Accedere alle Impostazioni",
  MANAGE_SETTINGS_COMPANY: "Gestire Ragione Sociale",
  MANAGE_SETTINGS_VAT: "Gestire Aliquote IVA",
  MANAGE_SETTINGS_DEPARTMENTS: "Gestire Reparti",
  MANAGE_SETTINGS_CATEGORIES: "Gestire Categorie",
  MANAGE_SETTINGS_PRODUCTS: "Gestire Prodotti",
  MANAGE_SETTINGS_SALEMODES: "Gestire Modalità di Vendita",
  MANAGE_SETTINGS_PRINTERS: "Gestire Stampanti",
  MANAGE_SETTINGS_BARCODESCANNER: "Gestire Lettori Barcode",
  MANAGE_SETTINGS_CUSTOMERDISPLAY: "Gestire Display Cliente",
  MANAGE_SETTINGS_PAYMENTS: "Gestire Metodi di Pagamento",
  MANAGE_SETTINGS_ROLES: "Gestire Ruoli e Permessi",
  MANAGE_SETTINGS_OPERATORS: "Gestire Operatori",
  MANAGE_SETTINGS_DOCUMENTS: "Gestire Configurazione Documenti",
  MANAGE_SETTINGS_ORDERS: "Gestire Configurazione Ordini",
  MANAGE_SETTINGS_GENERAL: "Gestire Impostazioni Generali",
  MANAGE_SETTINGS_IMPORT: "Gestire Importazione Dati",
  MANAGE_SETTINGS_DBCONFIG: "Gestire Configurazione DB Esterno",
  MANAGE_SETTINGS_DBSYNC: "Gestire Sincronizzazione DB",
  "general_settings_default_pos_warehouse_id": "ID Magazzino POS predefinito",
} as const;

export type PermissionKey = keyof typeof AVAILABLE_PERMISSIONS;

export const sqlQuerySchema = z.object({
  configId: z.number(),
  query: z.string().min(1),
  parameters: z.array(z.any()).optional()
});

export const scheduleOperationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['import', 'export', 'sync']),
  configId: z.number(),
  schedule: z.string().min(1),
  options: z.record(z.any()).optional()
});

export type SqlQuery = z.infer<typeof sqlQuerySchema>;
export type ScheduleOperation = z.infer<typeof scheduleOperationSchema>;

export type ExternalCustomer = {
  ANCODICE: string;
  ANDESCRI: string;
  ANPARIVA?: string | null;
  ANCODFIS?: string | null;
  ANCODEST?: string | null;
  ANINDIRI?: string | null;
  ANLOCALI?: string | null;
  ANPROVIN?: string | null;
  ANNAZION?: string | null;
  ANCODPAG?: string | null;
};
