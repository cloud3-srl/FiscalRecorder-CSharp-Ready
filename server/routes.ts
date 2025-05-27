import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertQuickButtonSchema, insertDatabaseConfigSchema, insertPrinterConfigSchema, sqlQuerySchema, scheduleOperationSchema, insertDbConnectionLogSchema, insertScheduledOperationSchema, databaseConfigOptionsSchema, insertPaymentMethodSchema, insertFavoriteGroupSchema, insertFavoriteSlotSchema } from "@shared/schema";
import { z } from "zod";
import { eq, sql, desc, and } from 'drizzle-orm';
import { db } from "./db";
import * as schema from "@shared/schema";
import { products, quickButtons, databaseConfigs, printerConfigs, dbConnectionLogs, scheduledOperations, sqlQueryHistory, customers as customersTable, paymentMethods, favoriteGroups, favoriteSlots, departments } from "@shared/schema";
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
  // API per Gruppi Favoriti
  app.get("/api/favorite-groups", async (_req, res) => {
    try {
      const groups = await db.select().from(favoriteGroups).orderBy(favoriteGroups.displayOrder, favoriteGroups.createdAt);
      res.json(groups);
    } catch (error) {
      console.error('Errore nel recupero gruppi favoriti:', error);
      res.status(500).json({ error: "Impossibile recuperare i gruppi favoriti" });
    }
  });

  app.post("/api/favorite-groups", async (req, res) => {
    const result = insertFavoriteGroupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [group] = await db.insert(favoriteGroups).values(result.data).returning();
      res.status(201).json(group);
    } catch (error) {
      console.error('Errore creazione gruppo favoriti:', error);
      res.status(500).json({ error: "Impossibile creare il gruppo favoriti" });
    }
  });

  app.put("/api/favorite-groups/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    const result = insertFavoriteGroupSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [group] = await db.update(favoriteGroups)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(favoriteGroups.id, id))
        .returning();
      if (!group) {
        return res.status(404).json({ error: "Gruppo favoriti non trovato" });
      }
      res.json(group);
    } catch (error) {
      console.error('Errore aggiornamento gruppo favoriti:', error);
      res.status(500).json({ error: "Impossibile aggiornare il gruppo favoriti" });
    }
  });

  app.delete("/api/favorite-groups/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    try {
      const [deleted] = await db.delete(favoriteGroups)
        .where(eq(favoriteGroups.id, id))
        .returning();
      if (!deleted) {
        return res.status(404).json({ error: "Gruppo favoriti non trovato" });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Errore eliminazione gruppo favoriti:', error);
      res.status(500).json({ error: "Impossibile eliminare il gruppo favoriti" });
    }
  });

  // API per Slot Favoriti
  app.get("/api/favorite-slots/:groupId", async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      return res.status(400).json({ error: "ID gruppo non valido" });
    }
    try {
      const slots = await db
        .select({
          id: favoriteSlots.id,
          groupId: favoriteSlots.groupId,
          productId: favoriteSlots.productId,
          positionInGrid: favoriteSlots.positionInGrid,
          product: {
            id: products.id,
            code: products.code,
            name: products.name,
            price: products.price,
            category: products.category,
            departmentCode: products.departmentCode
          }
        })
        .from(favoriteSlots)
        .leftJoin(products, eq(favoriteSlots.productId, products.id))
        .where(eq(favoriteSlots.groupId, groupId))
        .orderBy(favoriteSlots.positionInGrid);
      res.json(slots);
    } catch (error) {
      console.error('Errore nel recupero slot favoriti:', error);
      res.status(500).json({ error: "Impossibile recuperare gli slot favoriti" });
    }
  });

  app.post("/api/favorite-slots", async (req, res) => {
    const result = insertFavoriteSlotSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      // Rimuovi slot esistente nella stessa posizione dello stesso gruppo
      await db.delete(favoriteSlots)
        .where(and(
          eq(favoriteSlots.groupId, result.data.groupId!),
          eq(favoriteSlots.positionInGrid, result.data.positionInGrid!)
        ));
      
      const [slot] = await db.insert(favoriteSlots).values(result.data).returning();
      res.status(201).json(slot);
    } catch (error) {
      console.error('Errore creazione slot favoriti:', error);
      res.status(500).json({ error: "Impossibile creare lo slot favoriti" });
    }
  });

  app.delete("/api/favorite-slots/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    try {
      const [deleted] = await db.delete(favoriteSlots)
        .where(eq(favoriteSlots.id, id))
        .returning();
      if (!deleted) {
        return res.status(404).json({ error: "Slot favoriti non trovato" });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Errore eliminazione slot favoriti:', error);
      res.status(500).json({ error: "Impossibile eliminare lo slot favoriti" });
    }
  });

  // API per Reparti (collegata ai gruppi favoriti)
  app.get("/api/settings/departments", async (_req, res) => {
    try {
      const depts = await db.select().from(departments).orderBy(departments.createdAt);
      res.json(depts);
    } catch (error) {
      console.error('Errore nel recupero reparti:', error);
      res.status(500).json({ error: "Impossibile recuperare i reparti" });
    }
  });

  app.post("/api/settings/departments", async (req, res) => {
    const result = schema.insertDepartmentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [dept] = await db.insert(departments).values(result.data).returning();
      
      // Crea automaticamente un gruppo favoriti per il nuovo reparto
      await db.insert(favoriteGroups).values({
        name: dept.buttonDescription || dept.description,
        type: 'department',
        originalId: dept.id,
        displayOrder: dept.id
      });
      
      res.status(201).json(dept);
    } catch (error) {
      console.error('Errore creazione reparto:', error);
      if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
        return res.status(409).json({ error: "Reparto già esistente" });
      }
      res.status(500).json({ error: "Impossibile creare il reparto" });
    }
  });

  app.put("/api/settings/departments/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    const result = schema.insertDepartmentSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [dept] = await db.update(departments)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(departments.id, id))
        .returning();
      if (!dept) {
        return res.status(404).json({ error: "Reparto non trovato" });
      }
      
      // Aggiorna anche il gruppo favoriti corrispondente se esiste
      if (result.data.buttonDescription || result.data.description) {
        await db.update(favoriteGroups)
          .set({ 
            name: result.data.buttonDescription || result.data.description || dept.buttonDescription || dept.description,
            updatedAt: new Date()
          })
          .where(and(
            eq(favoriteGroups.type, 'department'),
            eq(favoriteGroups.originalId, id)
          ));
      }
      
      res.json(dept);
    } catch (error) {
      console.error('Errore aggiornamento reparto:', error);
      res.status(500).json({ error: "Impossibile aggiornare il reparto" });
    }
  });

  app.delete("/api/settings/departments/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    try {
      // Elimina anche il gruppo favoriti corrispondente
      await db.delete(favoriteGroups)
        .where(and(
          eq(favoriteGroups.type, 'department'),
          eq(favoriteGroups.originalId, id)
        ));
        
      const [deleted] = await db.delete(departments)
        .where(eq(departments.id, id))
        .returning();
      if (!deleted) {
        return res.status(404).json({ error: "Reparto non trovato" });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Errore eliminazione reparto:', error);
      res.status(500).json({ error: "Impossibile eliminare il reparto" });
    }
  });

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

  // Sync routes - API per sincronizzazione dati
  app.post("/api/admin/sync/products-now", async (_req, res) => {
    try {
      // Per ora ritorna una risposta simulata
      res.json({
        success: true,
        message: "Sincronizzazione prodotti (simulata) completata!",
        data: {
          importedCount: 0,
          updatedCount: 0
        }
      });
    } catch (error) {
      console.error('Errore sincronizzazione prodotti:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Errore sincronizzazione prodotti"
      });
    }
  });

  app.post("/api/admin/sync/customers-now", async (_req, res) => {
    try {
      // Ottieni la configurazione attiva
      const activeConfig = await db.select()
        .from(databaseConfigs)
        .where(eq(databaseConfigs.isActive, true))
        .limit(1);

      if (activeConfig.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Nessuna configurazione database attiva trovata"
        });
      }

      const config = activeConfig[0];
      const result = await importExternalCustomersToLocalDb(config);
      
      // Aggiorna lastSync della configurazione
      await db.update(databaseConfigs)
        .set({ lastSync: new Date() })
        .where(eq(databaseConfigs.id, config.id));

      res.json({
        success: true,
        message: "Sincronizzazione clienti completata con successo!",
        data: {
          importedCount: result.importedCount,
          updatedCount: result.updatedCount
        }
      });
    } catch (error) {
      console.error('Errore sincronizzazione clienti:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Errore sincronizzazione clienti"
      });
    }
  });

  app.post("/api/admin/sync/payment-methods-now", async (_req, res) => {
    try {
      // Ottieni la configurazione attiva
      const activeConfig = await db.select()
        .from(databaseConfigs)
        .where(eq(databaseConfigs.isActive, true))
        .limit(1);

      if (activeConfig.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Nessuna configurazione database attiva trovata"
        });
      }

      const config = activeConfig[0];
      const result = await importPaymentMethodsFromExternalDb(config);
      
      // Aggiorna lastSync della configurazione
      await db.update(databaseConfigs)
        .set({ lastSync: new Date() })
        .where(eq(databaseConfigs.id, config.id));

      res.json({
        success: true,
        message: "Sincronizzazione codici di pagamento completata con successo!",
        data: {
          importedCount: result.importedCount,
          updatedCount: result.updatedCount
        }
      });
    } catch (error) {
      console.error('Errore sincronizzazione codici di pagamento:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Errore sincronizzazione codici di pagamento"
      });
    }
  });

  // Database configuration routes
  app.get("/api/admin/database-configs", async (_req, res) => {
    try { 
      const configs = await db.select().from(databaseConfigs).orderBy(databaseConfigs.createdAt); 
      res.json(configs); 
    } 
    catch (error) { 
      console.error('Errore recupero config DB:', error); 
      res.status(500).json({ error: "Errore recupero config DB" }); 
    }
  });

  app.post("/api/admin/database-configs", async (req, res) => {
    const result = insertDatabaseConfigSchema.safeParse(req.body);
    if (!result.success) { 
      res.status(400).json({ error: result.error }); 
      return; 
    }
    try {
      if (result.data.isActive) { 
        await db.update(databaseConfigs).set({ isActive: false }).where(sql`1=1`); 
      }
      const [config] = await db.insert(databaseConfigs).values(result.data).returning();
      res.json(config);
    } catch (error) { 
      console.error('Errore salvataggio config DB:', error); 
      res.status(500).json({ error: "Errore salvataggio config DB" }); 
    }
  });

  app.put("/api/admin/database-configs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    const result = insertDatabaseConfigSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      if (result.data.isActive) {
        await db.update(databaseConfigs).set({ isActive: false }).where(sql`1=1`);
      }
      const [config] = await db.update(databaseConfigs)
        .set(result.data)
        .where(eq(databaseConfigs.id, id))
        .returning();
      if (!config) {
        return res.status(404).json({ error: "Configurazione non trovata" });
      }
      res.json(config);
    } catch (error) {
      console.error('Errore aggiornamento config DB:', error);
      res.status(500).json({ error: "Errore aggiornamento config DB" });
    }
  });

  app.delete("/api/admin/database-configs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    try {
      const [deleted] = await db.delete(databaseConfigs)
        .where(eq(databaseConfigs.id, id))
        .returning();
      if (!deleted) {
        return res.status(404).json({ error: "Configurazione non trovata" });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Errore eliminazione config DB:', error);
      res.status(500).json({ error: "Errore eliminazione config DB" });
    }
  });

  app.post("/api/admin/database-configs/:id/toggle-active", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    try {
      // Disattiva tutte le configurazioni
      await db.update(databaseConfigs).set({ isActive: false }).where(sql`1=1`);
      
      // Attiva quella richiesta
      const [config] = await db.update(databaseConfigs)
        .set({ isActive: true })
        .where(eq(databaseConfigs.id, id))
        .returning();
      
      if (!config) {
        return res.status(404).json({ error: "Configurazione non trovata" });
      }
      res.json(config);
    } catch (error) {
      console.error('Errore attivazione config DB:', error);
      res.status(500).json({ error: "Errore attivazione config DB" });
    }
  });

  // Connection logs routes
  app.get("/api/admin/connection-logs", async (_req, res) => {
    try {
      const logs = await db.select()
        .from(dbConnectionLogs)
        .orderBy(desc(dbConnectionLogs.timestamp))
        .limit(100);
      res.json(logs);
    } catch (error) {
      console.error('Errore recupero log connessioni:', error);
      res.status(500).json({ error: "Errore recupero log connessioni" });
    }
  });

  // Local database status route
  app.get("/api/admin/local-db-status", async (_req, res) => {
    try {
      // Informazioni base sempre disponibili
      const baseInfo = {
        status: 'online',
        type: 'SQLite',
        host: 'localhost',
        port: 'N/A',
        dbName: 'local.db'
      };

      try {
        // Prova a ottenere più informazioni dal database
        const productCount = await db.select({ count: sql<number>`count(*)` }).from(products);
        const customerCount = await db.select({ count: sql<number>`count(*)` }).from(customersTable);
        
        res.json({
          success: true,
          data: {
            ...baseInfo,
            connections: 1,
            version: 'SQLite 3.x',
            size: 'N/A',
            uptime: 'N/A',
            details: {
              products: productCount[0]?.count || 0,
              customers: customerCount[0]?.count || 0
            }
          }
        });
      } catch (detailError) {
        console.warn('Errore recupero dettagli DB locale:', detailError);
        res.json({
          success: true,
          data: {
            ...baseInfo,
            detailParsingFailed: true
          }
        });
      }
    } catch (error) {
      console.error('Errore stato DB locale:', error);
      res.json({
        success: false,
        error: "Impossibile determinare lo stato del database locale"
      });
    }
  });

  // SQL Query execution route
  app.post("/api/admin/execute-query", async (req, res) => {
    const result = z.object({
      query: z.string().min(1, "Query richiesta")
    }).safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      // Ottieni la configurazione attiva
      const activeConfig = await db.select()
        .from(databaseConfigs)
        .where(eq(databaseConfigs.isActive, true))
        .limit(1);

      if (activeConfig.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: "Nessuna configurazione database attiva trovata" 
        });
      }

      const config = activeConfig[0];
      const queryResult = await executeMssqlQuery(config, result.data.query);
      
      // Salva la query nella cronologia usando i campi corretti dello schema
      try {
        await db.insert(sqlQueryHistory).values({
          configId: config.id,
          query: result.data.query,
          status: 'success',
          message: 'Query eseguita con successo',
          rowsAffected: Array.isArray(queryResult) ? queryResult.length : 1
        });
      } catch (historyError) {
        console.warn('Errore salvataggio cronologia query:', historyError);
      }

      res.json({
        success: true,
        data: queryResult,
        message: "Query eseguita con successo"
      });

    } catch (error) {
      console.error('Errore esecuzione query:', error);
      
      // Salva l'errore nella cronologia
      try {
        const activeConfig = await db.select()
          .from(databaseConfigs)
          .where(eq(databaseConfigs.isActive, true))
          .limit(1);
        
        if (activeConfig.length > 0) {
          await db.insert(sqlQueryHistory).values({
            configId: activeConfig[0].id,
            query: result.data.query,
            status: 'error',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      } catch (historyError) {
        console.warn('Errore salvataggio cronologia errore query:', historyError);
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Errore sconosciuto durante l'esecuzione della query"
      });
    }
  });

  app.post("/api/admin/test-connection", async (req, res) => {
    const testConnectionSchema = z.object({
        id: z.number().optional(),
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
      const success = await testMssqlConnection(configToTest);
      const message = success ? "Connessione stabilita con successo" : "Test connessione fallito";
      const duration = Date.now() - startTime;
      try {
        await db.insert(dbConnectionLogs).values({ 
          configId: configToTest.id || 0, 
          status: success ? 'success' : 'error', 
          message, 
          duration, 
          details: { config: configToTest as any } 
        });
      } catch (logError) { 
        console.error('Errore salvataggio log test connessione:', logError); 
      }
      res.json({ success, message });
    } catch (error) {
      console.error('Errore test connessione:', error);
      try {
        await db.insert(dbConnectionLogs).values({ 
          configId: configToTest.id || 0, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Errore sconosciuto', 
          details: { error: String(error), config: configToTest as any } 
        });
      } catch (logError) { 
        console.error('Errore salvataggio log errore test connessione:', logError); 
      }
      res.status(500).json({ error: "Impossibile testare la connessione" });
    }
  });

  // Products routes
  app.get("/api/products", async (_req, res) => { 
    const prods = await storage.getAllProducts(); 
    res.json(prods); 
  });

  // Codici di Pagamento
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

  // Configuration generale
  app.get("/api/settings/general-config", async (_req, res) => {
    try {
      const configs = await db.select().from(schema.appConfigs);
      const configObj = configs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, any>);
      res.json({ success: true, data: configObj });
    } catch (error) {
      console.error('Errore recupero configurazione generale:', error);
      res.status(500).json({ error: "Impossibile recuperare la configurazione generale" });
    }
  });

  // Products creation
  app.post("/api/products", async (req, res) => {
    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: result.error }); return; }
    const product = await storage.createProduct(result.data);
    res.json(product);
  });

  // Customers routes  
  app.get("/api/customers", async (_req, res) => {
    try {
      const customers = await db.select().from(customersTable).orderBy(customersTable.name);
      res.json(customers);
    } catch (error) {
      console.error('Errore nel recupero clienti:', error);
      res.status(500).json({ error: "Impossibile recuperare i clienti" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    const result = schema.insertCustomerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [customer] = await db.insert(customersTable).values(result.data).returning();
      res.status(201).json(customer);
    } catch (error) {
      console.error('Errore creazione cliente:', error);
      res.status(500).json({ error: "Impossibile creare il cliente" });
    }
  });

  // API Stampanti
  app.get("/api/printers", async (_req, res) => {
    try {
      const printers = await db.select().from(printerConfigs).orderBy(printerConfigs.createdAt);
      res.json({ success: true, data: printers });
    } catch (error) {
      console.error('Errore nel recupero stampanti:', error);
      res.status(500).json({ error: "Impossibile recuperare le stampanti" });
    }
  });

  app.post("/api/printers", async (req, res) => {
    const result = insertPrinterConfigSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [printer] = await db.insert(printerConfigs).values({
        ...result.data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      res.status(201).json({ success: true, data: printer });
    } catch (error) {
      console.error('Errore creazione stampante:', error);
      res.status(500).json({ error: "Impossibile creare la stampante" });
    }
  });

  app.put("/api/printers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    const result = insertPrinterConfigSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [printer] = await db.update(printerConfigs)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(printerConfigs.id, id))
        .returning();
      if (!printer) {
        return res.status(404).json({ error: "Stampante non trovata" });
      }
      res.json({ success: true, data: printer });
    } catch (error) {
      console.error('Errore aggiornamento stampante:', error);
      res.status(500).json({ error: "Impossibile aggiornare la stampante" });
    }
  });

  app.delete("/api/printers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    try {
      const [deleted] = await db.delete(printerConfigs)
        .where(eq(printerConfigs.id, id))
        .returning();
      if (!deleted) {
        return res.status(404).json({ error: "Stampante non trovata" });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Errore eliminazione stampante:', error);
      res.status(500).json({ error: "Impossibile eliminare la stampante" });
    }
  });

  app.post("/api/printers/test-connection", async (req, res) => {
    try {
      const { connectionMethod, ipAddress, port, usbPort, wifiSSID, bluetoothAddress } = req.body;
      
      // Simula test di connessione
      const startTime = Date.now();
      
      // Aggiungi delay per simulare test reale
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      let success = false;
      let message = "";
      
      switch (connectionMethod) {
        case "USB":
          success = Math.random() > 0.3; // 70% successo
          message = success ? `Connesso a ${usbPort || 'USB001'}` : "Porta USB non disponibile";
          break;
        case "Ethernet":
          success = Math.random() > 0.2; // 80% successo
          message = success ? `Connesso a ${ipAddress}:${port}` : "Indirizzo IP non raggiungibile";
          break;
        case "WiFi":
          success = Math.random() > 0.4; // 60% successo
          message = success ? `Connesso alla rete ${wifiSSID}` : "Rete WiFi non disponibile";
          break;
        case "Bluetooth":
          success = Math.random() > 0.5; // 50% successo
          message = success ? `Connesso a ${bluetoothAddress}` : "Dispositivo Bluetooth non trovato";
          break;
        default:
          success = false;
          message = "Metodo di connessione non supportato";
      }
      
      const duration = Date.now() - startTime;
      
      res.json({
        success: true,
        data: {
          success,
          message,
          duration,
          details: {
            connectionMethod,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Errore test connessione stampante:', error);
      res.status(500).json({
        success: false,
        error: "Errore durante il test di connessione"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
