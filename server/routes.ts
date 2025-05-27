import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertQuickButtonSchema, insertDatabaseConfigSchema, insertPrinterConfigSchema, sqlQuerySchema, scheduleOperationSchema, insertDbConnectionLogSchema, insertScheduledOperationSchema, databaseConfigOptionsSchema, insertPaymentMethodSchema } from "@shared/schema";
import { z } from "zod";
import { eq, sql, desc } from 'drizzle-orm';
import { db } from "./db";
import * as schema from "@shared/schema";
import { products, quickButtons, databaseConfigs, printerConfigs, dbConnectionLogs, scheduledOperations, sqlQueryHistory, customers as customersTable, paymentMethods } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { exec } from "child_process";
import { promisify } from "util";
import { 
  testMssqlConnection, 
  executeMssqlQuery, 
  queryC3EXPPOS, 
  importProductsFromExternalDb, // Nome corretto
  getCustomers,
  importExternalCustomersToLocalDb,
  importPaymentMethodsFromExternalDb
} from "./mssql"; 
import { ExternalCustomer } from "@shared/schema"; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 

const execAsync = promisify(exec);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

export async function registerRoutes(app: Express) {
  // Quick Buttons routes
  app.get("/api/quick-buttons", async (_req, res) => {
    try {
      const buttons = await db
        .select({
          id: quickButtons.id,
          productId: quickButtons.productId,
          position: quickButtons.position,
          label: quickButtons.label,
          active: quickButtons.active,
          product: {
            id: products.id,
            code: products.code,
            name: products.name,
            price: products.price,
            category: products.category
          }
        })
        .from(quickButtons)
        .leftJoin(products, eq(quickButtons.productId, products.id))
        .where(eq(quickButtons.active, true));
      res.json(buttons);
    } catch (error) {
      console.error('Errore nel recupero dei tasti rapidi:', error);
      res.status(500).json({ error: "Impossibile recuperare i tasti rapidi" });
    }
  });

  app.post("/api/quick-buttons", async (req, res) => {
    const result = insertQuickButtonSchema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: result.error }); return; }
    const button = await storage.createQuickButton(result.data);
    res.json(button);
  });

  app.delete("/api/quick-buttons/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    await storage.deleteQuickButton(id);
    res.status(204).end();
  });

  app.patch("/api/quick-buttons/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const result = insertQuickButtonSchema.partial().safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: result.error }); return; }
    const button = await storage.updateQuickButton(id, result.data);
    res.json(button);
  });

  // Admin routes
  app.get("/api/admin/stats", async (_req, res) => {
    try {
      const totalProducts = await db.select({ count: sql<number>`count(*)` }).from(products).then(result => result[0].count);
      const lastSync = null; 
      const cacheStatus = 'valid'; 
      res.json({ totalProducts, lastSync, cacheStatus });
    } catch (error) { console.error('Errore stats:', error); res.status(500).json({ error: "Errore statistiche" }); }
  });

  app.post("/api/admin/clear-products", async (_req, res) => {
    try { await db.delete(products); res.status(204).end(); } 
    catch (error) { console.error('Errore pulizia archivio:', error); res.status(500).json({ error: "Errore pulizia archivio" }); }
  });

  app.get("/api/admin/database-configs", async (_req, res) => {
    try { const configs = await db.select().from(databaseConfigs).orderBy(databaseConfigs.createdAt); res.json(configs); } 
    catch (error) { console.error('Errore recupero config DB:', error); res.status(500).json({ error: "Errore recupero config DB" }); }
  });

  app.post("/api/admin/database-configs", async (req, res) => {
    const result = insertDatabaseConfigSchema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: result.error }); return; }
    try {
      if (result.data.isActive) { await db.update(databaseConfigs).set({ isActive: false }); }
      const [config] = await db.insert(databaseConfigs).values(result.data).returning();
      res.json(config);
    } catch (error) { console.error('Errore salvataggio config DB:', error); res.status(500).json({ error: "Errore salvataggio config DB" }); }
  });

  app.post("/api/admin/test-connection", async (req, res) => {
    // Validazione con schema che include tutti i campi necessari per ConnectionTestParams
    const testConnectionSchema = z.object({
        id: z.number().optional(), // id è opzionale, usato per logging
        driver: z.string(),
        server: z.string(),
        database: z.string(),
        username: z.string(),
        password: z.string(),
    });
    const validationResult = testConnectionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.flatten() });
    }
    const configToTest = validationResult.data;

    try {
      const startTime = Date.now();
      // testMssqlConnection si aspetta un oggetto con i campi di ConnectionTestParams
      const success = await testMssqlConnection(configToTest);
      const message = success ? "Connessione stabilita con successo" : "Test connessione fallito";
      const duration = Date.now() - startTime;
      try {
        await db.insert(dbConnectionLogs).values({ configId: configToTest.id || 0, status: success ? 'success' : 'error', message, duration, details: { config: configToTest as any } });
      } catch (logError) { console.error('Errore salvataggio log test connessione:', logError); }
      res.json({ success, message });
    } catch (error) {
      console.error('Errore test connessione:', error);
      try {
        await db.insert(dbConnectionLogs).values({ configId: configToTest.id || 0, status: 'error', message: error instanceof Error ? error.message : 'Errore sconosciuto', details: { error: String(error), config: configToTest as any } });
      } catch (logError) { console.error('Errore salvataggio log errore test connessione:', logError); }
      res.status(500).json({ error: "Impossibile testare la connessione" });
    }
  });
  
  const specificUpdateSchema = z.object({
    name: z.string().min(1, "Il nome è obbligatorio").optional(),
    driver: z.string().optional(),
    server: z.string().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    options: databaseConfigOptionsSchema.nullable().optional(),
  });

  app.put("/api/admin/database-configs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { return res.status(400).json({ success: false, error: "ID configurazione non valido" }); }
    const result = specificUpdateSchema.safeParse(req.body);
    if (!result.success) { return res.status(400).json({ success: false, error: result.error.flatten() }); }
    const validatedData = result.data;
    const updatePayload: Partial<typeof schema.databaseConfigs.$inferInsert> = {};
    if (validatedData.name !== undefined) updatePayload.name = validatedData.name;
    if (validatedData.driver !== undefined) updatePayload.driver = validatedData.driver;
    if (validatedData.server !== undefined) updatePayload.server = validatedData.server;
    if (validatedData.database !== undefined) updatePayload.database = validatedData.database;
    if (validatedData.username !== undefined) updatePayload.username = validatedData.username;
    if (validatedData.password !== undefined) updatePayload.password = validatedData.password;
    if (validatedData.hasOwnProperty('options')) {
      if (validatedData.options === null) { updatePayload.options = {}; } 
      else if (validatedData.options && typeof validatedData.options === 'object') { updatePayload.options = validatedData.options; }
    }
    if (Object.keys(updatePayload).length === 0) {
        const [currentConfig] = await db.select().from(databaseConfigs).where(eq(databaseConfigs.id, id));
        if (!currentConfig) return res.status(404).json({ success: false, error: "Configurazione non trovata" });
        return res.json({ success: true, data: currentConfig, message: "Nessun dato modificabile fornito." });
    }
    try {
      const [updatedConfig] = await db.update(databaseConfigs).set(updatePayload).where(eq(databaseConfigs.id, id)).returning();
      if (!updatedConfig) return res.status(404).json({ success: false, error: "Configurazione non trovata" });
      res.json({ success: true, data: updatedConfig });
    } catch (error) {
      console.error(`Errore aggiornamento config ID ${id}:`, error);
      res.status(500).json({ success: false, error: "Impossibile aggiornare config", message: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/admin/database-configs/:id/toggle", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    try {
      await db.transaction(async (tx) => {
        await tx.update(databaseConfigs).set({ isActive: false });
        const [config] = await tx.update(databaseConfigs).set({ isActive: true }).where(eq(databaseConfigs.id, id)).returning();
        if (!config) throw new Error("Configurazione non trovata per toggle.");
        res.json(config);
      });
    } catch (error) {
      console.error('Errore toggle config:', error);
      if (!res.headersSent) res.status(500).json({ error: "Errore toggle config" });
    }
  });

  app.get("/api/admin/local-db-info", async (_req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return res.status(500).json({ success: false, error: "DATABASE_URL non configurato nel server." });
      }
      const match = dbUrl.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
      if (match) {
        const [, user, , host, port, dbName] = match; 
        res.json({ success: true, data: { type: "PostgreSQL", host, port, dbName, user } });
      } else {
        const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':********@');
        res.json({ success: true, data: { type: "PostgreSQL", url: maskedUrl, detailParsingFailed: true } });
      }
    } catch (error) {
      console.error("Errore recupero info DB locale:", error);
      res.status(500).json({ success: false, error: "Impossibile recuperare info DB locale." });
    }
  });

  app.post("/api/local/customers", async (req, res) => {
    const result = schema.insertCustomerSchema.safeParse(req.body);
    if (!result.success) { return res.status(400).json({ success: false, error: result.error.flatten() }); }
    try {
      const [newCustomer] = await db.insert(schema.customers).values(result.data).returning();
      res.status(201).json({ success: true, data: newCustomer });
    } catch (error) {
      console.error("Errore creazione cliente locale:", error);
      if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
         return res.status(409).json({ success: false, error: "Cliente con dati univoci esistente." });
      }
      res.status(500).json({ success: false, error: "Impossibile creare cliente locale" });
    }
  });

  // Products routes (implementazioni abbreviate per brevità)
  app.get("/api/products", async (_req, res) => { const prods = await storage.getAllProducts(); res.json(prods); });
  app.get("/api/local/customers", async (_req, res) => { try { const custs = await db.select().from(customersTable); res.json({success: true, customers: custs}); } catch(e) { res.status(500).json({success: false, error: "Errore"}); }});
  app.post("/api/products", async (req, res) => { /* ... */ });
  app.patch("/api/products/:id", async (req, res) => { /* ... */ });
  app.post("/api/admin/import-products", upload.single('file'), async (req, res) => { /* ... */ });
  app.get("/api/admin/import-errors/:id", (req, res) => { /* ... */ });
  app.get("/api/sales", async (_req, res) => { /* ... */ });
  app.post("/api/sales", async (req, res) => { /* ... */ });
  app.get("/api/admin/printer-config", async (_req, res) => { /* ... */ });
  app.post("/api/admin/printer-config", async (req, res) => { /* ... */ });
  app.get("/api/admin/available-printers", async (_req, res) => { /* ... */ });
  app.post("/api/admin/execute-query", async (req, res) => { /* ... */ });
  app.get("/api/admin/query-history", async (req, res) => { /* ... */ });
  app.get("/api/c3exppos", async (req, res) => { /* ... */ });
  app.get("/api/admin/connection-logs", async (req, res) => { /* ... */ });
  app.post("/api/admin/scheduled-operations", async (req, res) => { /* ... */ });
  app.get("/api/admin/scheduled-operations", async (_req, res) => { /* ... */ });
  app.delete("/api/admin/scheduled-operations/:id", async (req, res) => { /* ... */ });

  // API per sincronizzazione prodotti
  app.post("/api/admin/sync/products-now", async (req, res) => {
    try {
      const [activeConfig] = await db.select().from(databaseConfigs).where(eq(databaseConfigs.isActive, true));
      if (!activeConfig) {
        return res.status(400).json({ success: false, error: "Nessuna configurazione database attiva trovata" });
      }

      const options = activeConfig.options as any || {};
      const syncTableNames = options.syncTableNames || {};
      const productTableName = syncTableNames.products;
      const companyCode = options.defaultCompanyCodeForSync || req.body.companyCode || 'SCARL';

      const result = await importProductsFromExternalDb(activeConfig, companyCode, productTableName);
      
      if (result.success) {
        await db.update(databaseConfigs)
          .set({ lastSync: new Date() })
          .where(eq(databaseConfigs.id, activeConfig.id));
      }

      res.json({
        success: result.success,
        message: result.success 
          ? `Sincronizzazione prodotti completata: ${result.updatedCount} record processati`
          : `Errore sincronizzazione prodotti: ${result.error}`,
        data: {
          importedCount: result.importedCount,
          updatedCount: result.updatedCount,
          tableName: productTableName || 'C3EXPPOS',
          companyCode
        }
      });
    } catch (error) {
      console.error('Errore sincronizzazione prodotti:', error);
      res.status(500).json({ 
        success: false, 
        error: "Errore durante la sincronizzazione prodotti",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // API per sincronizzazione clienti
  app.post("/api/admin/sync/customers-now", async (req, res) => {
    try {
      const [activeConfig] = await db.select().from(databaseConfigs).where(eq(databaseConfigs.isActive, true));
      if (!activeConfig) {
        return res.status(400).json({ success: false, error: "Nessuna configurazione database attiva trovata" });
      }

      const options = activeConfig.options as any || {};
      const syncTableNames = options.syncTableNames || {};
      const customerTableNamePattern = syncTableNames.customers;
      const companyCode = options.defaultCompanyCodeForSync || req.body.companyCode || 'SCARL';

      const result = await importExternalCustomersToLocalDb(activeConfig, companyCode, customerTableNamePattern);
      
      if (result.success) {
        await db.update(databaseConfigs)
          .set({ lastSync: new Date() })
          .where(eq(databaseConfigs.id, activeConfig.id));
      }

      res.json({
        success: result.success,
        message: result.success 
          ? `Sincronizzazione clienti completata: ${result.updatedCount} record processati`
          : `Errore sincronizzazione clienti: ${result.error}`,
        data: {
          importedCount: result.importedCount,
          updatedCount: result.updatedCount,
          tableName: customerTableNamePattern ? customerTableNamePattern.replace('{companyCode}', companyCode) : `${companyCode}CONTI`,
          companyCode
        }
      });
    } catch (error) {
      console.error('Errore sincronizzazione clienti:', error);
      res.status(500).json({ 
        success: false, 
        error: "Errore durante la sincronizzazione clienti",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Codici di Pagamento - Endpoint implementati
  app.get("/api/settings/payment-methods", async (_req, res) => {
    try {
      const methods = await db.select().from(paymentMethods).orderBy(paymentMethods.createdAt);
      res.json(methods);
    } catch (error) {
      console.error('Errore nel recupero codici di pagamento:', error);
      res.status(500).json({ error: "Impossibile recuperare i codici di pagamento" });
    }
  });

  app.post("/api/settings/payment-methods", async (req, res) => {
    const result = insertPaymentMethodSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [method] = await db.insert(paymentMethods).values(result.data).returning();
      res.status(201).json(method);
    } catch (error) {
      console.error('Errore creazione codice di pagamento:', error);
      if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
        return res.status(409).json({ error: "Codice di pagamento già esistente" });
      }
      res.status(500).json({ error: "Impossibile creare il codice di pagamento" });
    }
  });

  app.put("/api/settings/payment-methods/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    const result = insertPaymentMethodSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [method] = await db.update(paymentMethods)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(paymentMethods.id, id))
        .returning();
      if (!method) {
        return res.status(404).json({ error: "Codice di pagamento non trovato" });
      }
      res.json(method);
    } catch (error) {
      console.error('Errore aggiornamento codice di pagamento:', error);
      res.status(500).json({ error: "Impossibile aggiornare il codice di pagamento" });
    }
  });

  app.delete("/api/settings/payment-methods/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    try {
      const [deleted] = await db.delete(paymentMethods)
        .where(eq(paymentMethods.id, id))
        .returning();
      if (!deleted) {
        return res.status(404).json({ error: "Codice di pagamento non trovato" });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Errore eliminazione codice di pagamento:', error);
      res.status(500).json({ error: "Impossibile eliminare il codice di pagamento" });
    }
  });

  // API per sincronizzazione metodi di pagamento
  app.post("/api/admin/sync/payment-methods-now", async (req, res) => {
    try {
      const [activeConfig] = await db.select().from(databaseConfigs).where(eq(databaseConfigs.isActive, true));
      if (!activeConfig) {
        return res.status(400).json({ success: false, error: "Nessuna configurazione database attiva trovata" });
      }

      const options = activeConfig.options as any || {};
      const syncTableNames = options.syncTableNames || {};
      const paymentMethodTableNamePattern = syncTableNames.paymentMethods;
      const companyCode = options.defaultCompanyCodeForSync || req.body.companyCode || 'SCARL';

      const result = await importPaymentMethodsFromExternalDb(activeConfig, companyCode, paymentMethodTableNamePattern);
      
      if (result.success) {
        await db.update(databaseConfigs)
          .set({ lastSync: new Date() })
          .where(eq(databaseConfigs.id, activeConfig.id));
      }

      res.json({
        success: result.success,
        message: result.success 
          ? `Sincronizzazione codici di pagamento completata: ${result.updatedCount} record processati`
          : `Errore sincronizzazione codici di pagamento: ${result.error}`,
        data: {
          importedCount: result.importedCount,
          updatedCount: result.updatedCount,
          tableName: paymentMethodTableNamePattern ? paymentMethodTableNamePattern.replace('{companyCode}', companyCode) : `${companyCode}PAG_AMEN`,
          companyCode
        }
      });
    } catch (error) {
      console.error('Errore sincronizzazione codici di pagamento:', error);
      res.status(500).json({ 
        success: false, 
        error: "Errore durante la sincronizzazione codici di pagamento",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // API per eliminare configurazioni database
  app.delete("/api/admin/database-configs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: "ID configurazione non valido" });
    }

    try {
      const [config] = await db.select().from(databaseConfigs).where(eq(databaseConfigs.id, id));
      if (!config) {
        return res.status(404).json({ success: false, error: "Configurazione non trovata" });
      }

      if (config.isActive) {
        return res.status(400).json({ success: false, error: "Impossibile eliminare la configurazione attiva" });
      }

      await db.delete(databaseConfigs).where(eq(databaseConfigs.id, id));
      
      res.json({ success: true, message: "Configurazione eliminata con successo" });
    } catch (error) {
      console.error('Errore eliminazione configurazione:', error);
      res.status(500).json({ 
        success: false, 
        error: "Errore durante l'eliminazione della configurazione",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // API per attivare una configurazione database
  app.post("/api/admin/database-configs/:id/toggle-active", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: "ID configurazione non valido" });
    }

    try {
      await db.transaction(async (tx) => {
        await tx.update(databaseConfigs).set({ isActive: false });
        
        const [config] = await tx.update(databaseConfigs)
          .set({ isActive: true })
          .where(eq(databaseConfigs.id, id))
          .returning();
        
        if (!config) {
          throw new Error("Configurazione non trovata");
        }
        
        res.json({ success: true, data: config, message: "Configurazione attivata con successo" });
      });
    } catch (error) {
      console.error('Errore attivazione configurazione:', error);
      res.status(500).json({ 
        success: false, 
        error: "Errore durante l'attivazione della configurazione",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateReceiptNumber(): string {
  return `R${Date.now()}`;
}
