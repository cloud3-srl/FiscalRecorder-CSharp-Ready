import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertQuickButtonSchema, insertDatabaseConfigSchema, insertPrinterConfigSchema, sqlQuerySchema, scheduleOperationSchema, insertDbConnectionLogSchema, insertScheduledOperationSchema, databaseConfigOptionsSchema, insertPaymentMethodSchema, insertFavoriteGroupSchema, insertFavoriteSlotSchema, insertCompanyProfileSchema } from "@shared/schema";
import { z } from "zod";
import { eq, sql, desc, and, like } from 'drizzle-orm';
import { db } from "./db";
import * as schema from "@shared/schema";
import { products, quickButtons, databaseConfigs, printerConfigs, dbConnectionLogs, scheduledOperations, sqlQueryHistory, customers as customersTable, paymentMethods, favoriteGroups, favoriteSlots, departments, companyProfile } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { exec } from "child_process";
import { promisify } from "util";
import { 
  testMssqlConnection, 
  executeMssqlQuery, 
  queryC3EXPPOS, 
  importProductsFromExternalDb,
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

// Funzione di validazione Codice Fiscale (semplificata)
function validateCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false;
  const regex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
  return regex.test(cf.toUpperCase());
}

// Funzione di validazione Partita IVA italiana
function validatePartitaIva(pi: string): boolean {
  if (!pi || pi.length !== 11) return false;
  const regex = /^\d{11}$/;
  if (!regex.test(pi)) return false;
  
  // Algoritmo di controllo P.IVA
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(pi[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10);
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(pi[10]);
}

export async function registerRoutes(app: Express) {
  // API per Company Profile (Impostazioni Azienda)
  app.get("/api/settings/company-profile", async (_req, res) => {
    try {
      const [profile] = await db.select().from(companyProfile).limit(1);
      res.json(profile || {});
    } catch (error) {
      console.error('Errore nel recupero profilo azienda:', error);
      res.status(500).json({ error: "Impossibile recuperare il profilo azienda" });
    }
  });

  // API per stato database locale
  app.get("/api/admin/local-db-status", async (_req, res) => {
    try {
      // Verifica connessione database locale
      const startTime = Date.now();
      
      // Test query semplice per verificare la connessione
      const testResult = await db.select().from(products).limit(1);
      const duration = Date.now() - startTime;
      
      // Ottieni statistiche database
      const stats = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(products);
      
      const productCount = stats[0]?.count || 0;
      
      // Simula informazioni database locale SQLite
      const dbInfo = {
        status: 'online',
        type: 'SQLite',
        host: 'localhost',
        port: 'N/A',
        dbName: 'fiscal_recorder.db',
        user: 'local',
        size: '2.4 MB', // Placeholder - in produzione calcolare dimensione reale
        uptime: '24h 15m',
        version: 'SQLite 3.45.0',
        connections: 1,
        responseTime: `${duration}ms`,
        recordCount: productCount,
        lastBackup: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: dbInfo
      });
    } catch (error) {
      console.error('Errore stato database locale:', error);
      res.json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        data: {
          status: 'offline',
          type: 'SQLite',
          error: true
        }
      });
    }
  });

  // API per log connessioni database
  app.get("/api/admin/connection-logs", async (_req, res) => {
    try {
      const logs = await db.select()
        .from(dbConnectionLogs)
        .orderBy(desc(dbConnectionLogs.timestamp))
        .limit(100);
      
      const formattedLogs = logs.map(log => ({
        id: log.id,
        configId: log.configId,
        timestamp: log.timestamp,
        status: log.status,
        message: log.message,
        duration: log.duration
      }));
      
      res.json(formattedLogs);
    } catch (error) {
      console.error('Errore recupero log connessioni:', error);
      res.status(500).json({ error: "Impossibile recuperare i log delle connessioni" });
    }
  });

  // API per toggle attivazione configurazione database
  app.post("/api/admin/database-configs/:id/toggle-active", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    
    try {
      // Disattiva tutte le altre configurazioni
      await db.update(databaseConfigs).set({ isActive: false }).where(sql`1=1`);
      
      // Attiva la configurazione selezionata
      const [config] = await db.update(databaseConfigs)
        .set({ isActive: true })
        .where(eq(databaseConfigs.id, id))
        .returning();
      
      if (!config) {
        return res.status(404).json({ error: "Configurazione non trovata" });
      }
      
      res.json(config);
    } catch (error) {
      console.error('Errore attivazione configurazione:', error);
      res.status(500).json({ error: "Impossibile attivare la configurazione" });
    }
  });

  app.post("/api/settings/company-profile", async (req, res) => {
    const result = insertCompanyProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      // Verifica se esiste già un profilo
      const [existing] = await db.select().from(companyProfile).limit(1);
      
      if (existing) {
        // Aggiorna il profilo esistente
        const [updated] = await db.update(companyProfile)
          .set({ ...result.data, updatedAt: new Date() })
          .where(eq(companyProfile.id, existing.id))
          .returning();
        res.json(updated);
      } else {
        // Crea nuovo profilo
        const [created] = await db.insert(companyProfile)
          .values(result.data)
          .returning();
        res.status(201).json(created);
      }
    } catch (error) {
      console.error('Errore salvataggio profilo azienda:', error);
      res.status(500).json({ error: "Impossibile salvare il profilo azienda" });
    }
  });

  // API per importazione dati azienda da DB remoto
  app.post("/api/settings/import-company-data", async (_req, res) => {
    try {
      const activeConfig = await db.select()
        .from(databaseConfigs)
        .where(eq(databaseConfigs.isActive, true))
        .limit(1);

      if (activeConfig.length === 0) {
        return res.status(400).json({
          error: "Nessuna configurazione database attiva trovata"
        });
      }

      const config = activeConfig[0];
      
      // Query per importare dati azienda dalla tabella AZIENDA
      const importQuery = `
        SELECT AZRAGAZI, AZINDAZI, AZLOCAZI, AZCAPAZI, AZPROAZI, AZCODNAZ, AZCOFAZI, AZIVAAZI 
        FROM azienda 
        WHERE azcodazi = 'scarl'
      `;
      
      const queryResult = await executeMssqlQuery(config, importQuery);
      
      if (!Array.isArray(queryResult) || queryResult.length === 0) {
        return res.status(404).json({
          error: "Nessun dato azienda trovato nel gestionale"
        });
      }

      const companyData = queryResult[0];
      
      // Mapping dei campi da DB esterno a schema locale
      const mappedData = {
        companyName: companyData.AZRAGAZI || '',
        addressStreet: companyData.AZINDAZI || '',
        addressCity: companyData.AZLOCAZI || '',
        addressZip: companyData.AZCAPAZI || '',
        addressProvince: companyData.AZPROAZI || '',
        addressCountry: companyData.AZCODNAZ || 'Italia',
        fiscalCode: companyData.AZCOFAZI || '',
        vatNumber: companyData.AZIVAAZI || ''
      };

      // Salva i dati importati localmente
      const [existing] = await db.select().from(companyProfile).limit(1);
      
      if (existing) {
        const [updated] = await db.update(companyProfile)
          .set({ ...mappedData, updatedAt: new Date() })
          .where(eq(companyProfile.id, existing.id))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db.insert(companyProfile)
          .values(mappedData)
          .returning();
        res.json(created);
      }

    } catch (error) {
      console.error('Errore importazione dati azienda:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Errore durante l'importazione dei dati azienda"
      });
    }
  });

  // API per Clienti con validazione italiana
  app.get("/api/customers", async (req, res) => {
    try {
      const { search } = req.query;
      
      if (search && typeof search === 'string') {
        const customersList = await db.select().from(customersTable)
          .where(
            sql`${customersTable.name} ILIKE ${'%' + search + '%'} OR 
                ${customersTable.email} ILIKE ${'%' + search + '%'} OR 
                ${customersTable.code} ILIKE ${'%' + search + '%'}`
          )
          .orderBy(customersTable.name);
        res.json(customersList);
      } else {
        const customersList = await db.select().from(customersTable).orderBy(customersTable.name);
        res.json(customersList);
      }
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

    // Validazione italiana specifica
    const data = result.data;
    const errors: string[] = [];

    if (data.fiscalCode && !validateCodiceFiscale(data.fiscalCode)) {
      errors.push("Codice fiscale non valido");
    }

    if (data.vatNumber && !validatePartitaIva(data.vatNumber)) {
      errors.push("Partita IVA italiana non valida");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(", ") });
    }

    try {
      // Controllo duplicati su codice fiscale e partita IVA
      if (data.fiscalCode) {
        const existingCF = await db.select().from(customersTable)
          .where(eq(customersTable.fiscalCode, data.fiscalCode))
          .limit(1);
        if (existingCF.length > 0) {
          return res.status(409).json({ error: "Cliente con questo codice fiscale già esistente" });
        }
      }

      if (data.vatNumber) {
        const existingPI = await db.select().from(customersTable)
          .where(eq(customersTable.vatNumber, data.vatNumber))
          .limit(1);
        if (existingPI.length > 0) {
          return res.status(409).json({ error: "Cliente con questa partita IVA già esistente" });
        }
      }

      const [customer] = await db.insert(customersTable).values(data).returning();
      res.status(201).json(customer);
    } catch (error) {
      console.error('Errore creazione cliente:', error);
      res.status(500).json({ error: "Impossibile creare il cliente" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }

    const result = schema.insertCustomerSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Validazione italiana specifica se presenti
    const data = result.data;
    const errors: string[] = [];

    if (data.fiscalCode && !validateCodiceFiscale(data.fiscalCode)) {
      errors.push("Codice fiscale non valido");
    }

    if (data.vatNumber && !validatePartitaIva(data.vatNumber)) {
      errors.push("Partita IVA italiana non valida");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(", ") });
    }

    try {
      const [customer] = await db.update(customersTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(customersTable.id, id))
        .returning();
      
      if (!customer) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Errore aggiornamento cliente:', error);
      res.status(500).json({ error: "Impossibile aggiornare il cliente" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }

    try {
      const [deleted] = await db.delete(customersTable)
        .where(eq(customersTable.id, id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Errore eliminazione cliente:', error);
      res.status(500).json({ error: "Impossibile eliminare il cliente" });
    }
  });

  // API per Payment Methods
  app.get("/api/payment-methods", async (_req, res) => {
    try {
      const methods = await db.select().from(paymentMethods).orderBy(paymentMethods.description);
      res.json(methods);
    } catch (error) {
      console.error('Errore nel recupero metodi di pagamento:', error);
      res.status(500).json({ error: "Impossibile recuperare i metodi di pagamento" });
    }
  });

  app.post("/api/payment-methods", async (req, res) => {
    const result = insertPaymentMethodSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const [method] = await db.insert(paymentMethods).values(result.data).returning();
      res.status(201).json(method);
    } catch (error) {
      console.error('Errore creazione metodo di pagamento:', error);
      res.status(500).json({ error: "Impossibile creare il metodo di pagamento" });
    }
  });

  app.put("/api/payment-methods/:id", async (req, res) => {
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
        return res.status(404).json({ error: "Metodo di pagamento non trovato" });
      }
      
      res.json(method);
    } catch (error) {
      console.error('Errore aggiornamento metodo di pagamento:', error);
      res.status(500).json({ error: "Impossibile aggiornare il metodo di pagamento" });
    }
  });

  app.delete("/api/payment-methods/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }

    try {
      const [deleted] = await db.delete(paymentMethods)
        .where(eq(paymentMethods.id, id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ error: "Metodo di pagamento non trovato" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Errore eliminazione metodo di pagamento:', error);
      res.status(500).json({ error: "Impossibile eliminare il metodo di pagamento" });
    }
  });

  // Products routes
  app.get("/api/products", async (_req, res) => { 
    const prods = await storage.getAllProducts();
    res.json(prods);
  });

  app.post("/api/products", async (req, res) => {
    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const product = await storage.createProduct(result.data);
      res.status(201).json(product);
    } catch (error) {
      console.error('Errore creazione prodotto:', error);
      res.status(500).json({ error: "Impossibile creare il prodotto" });
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
      const result = await importExternalCustomersToLocalDb(config, 'DEFAULT');
      
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
      const result = await importPaymentMethodsFromExternalDb(config, 'DEFAULT');
      
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
          message: error instanceof Error ? error.message : String(error), 
          duration: 0, 
          details: { config: configToTest as any, error: String(error) } 
        });
      } catch (logError) { 
        console.error('Errore salvataggio log errore test connessione:', logError); 
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Errore sconosciuto durante il test della connessione" 
      });
    }
  });

  app.post("/api/admin/execute-query", async (req, res) => {
    const result = z.object({
      query: z.string().min(1, "Query richiesta")
    }).safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
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
        console.warn('Errore salvataggio cronologia query in errore:', historyError);
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Errore durante l'esecuzione della query"
      });
    }
  });

  // Printer configuration routes
  app.get("/api/admin/printer-configs", async (_req, res) => {
    try {
      const configs = await db.select().from(printerConfigs).orderBy(printerConfigs.createdAt);
      res.json(configs);
    } catch (error) {
      console.error('Errore recupero config stampanti:', error);
      res.status(500).json({ error: "Errore recupero config stampanti" });
    }
  });

  app.post("/api/admin/printer-configs", async (req, res) => {
    const result = insertPrinterConfigSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [config] = await db.insert(printerConfigs).values(result.data).returning();
      res.json(config);
    } catch (error) {
      console.error('Errore salvataggio config stampante:', error);
      res.status(500).json({ error: "Errore salvataggio config stampante" });
    }
  });

  // Favorite Groups routes
  app.get("/api/favorite-groups", async (_req, res) => {
    try {
      const groups = await db.select().from(favoriteGroups).orderBy(favoriteGroups.name);
      res.json(groups);
    } catch (error) {
      console.error('Errore recupero gruppi preferiti:', error);
      res.status(500).json({ error: "Errore recupero gruppi preferiti" });
    }
  });

  app.post("/api/favorite-groups", async (req, res) => {
    const result = insertFavoriteGroupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [group] = await db.insert(favoriteGroups).values(result.data).returning();
      res.json(group);
    } catch (error) {
      console.error('Errore creazione gruppo preferiti:', error);
      res.status(500).json({ error: "Errore creazione gruppo preferiti" });
    }
  });

  // Favorite Slots routes
  app.get("/api/favorite-slots", async (_req, res) => {
    try {
      const slots = await db.select().from(favoriteSlots)
        .leftJoin(products, eq(favoriteSlots.productId, products.id))
        .leftJoin(favoriteGroups, eq(favoriteSlots.groupId, favoriteGroups.id))
        .orderBy(favoriteSlots.id);
      res.json(slots);
    } catch (error) {
      console.error('Errore recupero slot preferiti:', error);
      res.status(500).json({ error: "Errore recupero slot preferiti" });
    }
  });

  app.post("/api/favorite-slots", async (req, res) => {
    const result = insertFavoriteSlotSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    try {
      const [slot] = await db.insert(favoriteSlots).values(result.data).returning();
      res.json(slot);
    } catch (error) {
      console.error('Errore creazione slot preferiti:', error);
      res.status(500).json({ error: "Errore creazione slot preferiti" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
