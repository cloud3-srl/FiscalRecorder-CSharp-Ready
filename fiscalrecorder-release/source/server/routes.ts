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

  // Products routes
  app.get("/api/products", async (_req, res) => { const prods = await storage.getAllProducts(); res.json(prods); });

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
      if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
        return res.status(409).json({ error: "Codice di pagamento già esistente" });
      }
      res.status(500).json({ error: "Impossibile creare il codice di pagamento" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateReceiptNumber(): string {
  return `R${Date.now()}`;
}
