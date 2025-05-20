import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertQuickButtonSchema, insertDatabaseConfigSchema, insertPrinterConfigSchema, sqlQuerySchema, scheduleOperationSchema, insertDbConnectionLogSchema, insertScheduledOperationSchema } from "@shared/schema";
import { z } from "zod";
import { eq, sql, desc } from 'drizzle-orm';
import { db } from "./db";
import * as schema from "@shared/schema";
import { products, quickButtons, databaseConfigs, printerConfigs, dbConnectionLogs, scheduledOperations, sqlQueryHistory } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { exec } from "child_process";
import { promisify } from "util";
import { testMssqlConnection, executeMssqlQuery, queryC3EXPPOS, importProductsFromC3EXPPOS, getCustomers } from "./mssql"; // Aggiunto getCustomers
import { ExternalCustomer } from "@shared/schema"; // Aggiunto ExternalCustomer

const execAsync = promisify(exec);

// Configurazione multer per l'upload dei file
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limite
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
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    const button = await storage.createQuickButton(result.data);
    res.json(button);
  });

  app.delete("/api/quick-buttons/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    await storage.deleteQuickButton(id);
    res.status(204).end();
  });

  app.patch("/api/quick-buttons/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const result = insertQuickButtonSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    const button = await storage.updateQuickButton(id, result.data);
    res.json(button);
  });


  // Admin routes
  app.get("/api/admin/stats", async (_req, res) => {
    try {
      const totalProducts = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .then(result => result[0].count);

      // TODO: Implementare la logica per la cache e la sincronizzazione
      const lastSync = null;
      const cacheStatus = 'valid';

      res.json({
        totalProducts,
        lastSync,
        cacheStatus
      });
    } catch (error) {
      console.error('Errore nel recupero delle statistiche:', error);
      res.status(500).json({ error: "Impossibile recuperare le statistiche" });
    }
  });

  app.post("/api/admin/clear-products", async (_req, res) => {
    try {
      await db.delete(products);
      res.status(204).end();
    } catch (error) {
      console.error('Errore durante la pulizia dell\'archivio:', error);
      res.status(500).json({ error: "Impossibile svuotare l'archivio" });
    }
  });

  // Nuove route per la configurazione del database
  app.get("/api/admin/database-configs", async (_req, res) => {
    try {
      const configs = await db
        .select()
        .from(databaseConfigs)
        .orderBy(databaseConfigs.createdAt);

      res.json(configs);
    } catch (error) {
      console.error('Errore nel recupero delle configurazioni:', error);
      res.status(500).json({ error: "Impossibile recuperare le configurazioni" });
    }
  });

  app.post("/api/admin/database-configs", async (req, res) => {
    const result = insertDatabaseConfigSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      // Se la nuova configurazione è attiva, disattiva tutte le altre
      if (result.data.isActive) {
        await db
          .update(databaseConfigs)
          .set({ isActive: false });
      }

      const [config] = await db
        .insert(databaseConfigs)
        .values(result.data)
        .returning();

      res.json(config);
    } catch (error) {
      console.error('Errore nel salvataggio della configurazione:', error);
      res.status(500).json({ error: "Impossibile salvare la configurazione" });
    }
  });

  app.post("/api/admin/test-connection", async (req, res) => {
    const result = insertDatabaseConfigSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      const startTime = Date.now();
      
      // Test della connessione MSSQL
      const success = await testMssqlConnection(req.body);
      const message = "Connessione stabilita con successo";
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Registra il log di connessione
      try {
        await db.insert(dbConnectionLogs).values({
          configId: req.body.id || 0, // 0 per configurazioni non ancora salvate
          status: success ? 'success' : 'error',
          message,
          duration,
          details: { config: req.body }
        });
      } catch (logError) {
        console.error('Errore nel salvataggio del log:', logError);
      }
      
      res.json({ success, message });
    } catch (error) {
      console.error('Errore nel test della connessione:', error);
      
      // Registra il log di errore
      try {
        await db.insert(dbConnectionLogs).values({
          configId: req.body.id || 0,
          status: 'error',
          message: error instanceof Error ? error.message : 'Errore sconosciuto',
          details: { error: String(error), config: req.body }
        });
      } catch (logError) {
        console.error('Errore nel salvataggio del log:', logError);
      }
      
      res.status(500).json({ error: "Impossibile testare la connessione" });
    }
  });

  app.patch("/api/admin/database-configs/:id/toggle", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    try {
      // Prima disattiva tutte le configurazioni
      await db
        .update(databaseConfigs)
        .set({ isActive: false });

      // Poi attiva quella selezionata
      const [config] = await db
        .update(databaseConfigs)
        .set({ isActive: true })
        .where(eq(databaseConfigs.id, id))
        .returning();

      if (!config) {
        res.status(404).json({ error: "Configurazione non trovata" });
        return;
      }

      res.json(config);
    } catch (error) {
      console.error('Errore nell\'aggiornamento della configurazione:', error);
      res.status(500).json({ error: "Impossibile aggiornare la configurazione" });
    }
  });

  // Products routes
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getAllProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    const product = await storage.createProduct(result.data);
    res.json(product);
  });

  app.patch("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const result = insertProductSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      const updatedProduct = await db
        .update(products)
        .set(result.data)
        .where(eq(products.id, id))
        .returning()
        .then(res => res[0]);

      if (!updatedProduct) {
        res.status(404).json({ error: "Prodotto non trovato" });
        return;
      }

      res.json(updatedProduct);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del prodotto:', error);
      res.status(500).json({ error: "Impossibile aggiornare il prodotto" });
    }
  });

  // Nuova route per l'importazione CSV
  app.post("/api/admin/import-products", upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nessun file caricato" });
    }

    try {
      const fileContent = req.file.buffer.toString();
      const records: any[] = [];

      // Parse CSV
      const parser = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ';',
        quote: '"',
        relax_quotes: true,
        relax_column_count: true
      });

      // Leggi tutti i record
      for await (const record of parser) {
        records.push({
          code: record.ARCODART,
          name: record.ARDESART,
          price: record.LIPREZZO,
          listCode: record.LICODLIS,
          activationDate: record.LIDATATT ? new Date(record.LIDATATT) : null,
          deactivationDate: record.LIDATDIS ? new Date(record.LIDATDIS) : null,
          unitOfMeasure: record.LIUNIMIS,
          controlFlag: record.cpccchk,
          discount1: record.LISCONT1 || null,
          discount2: record.LISCONT2 || null,
          discount3: record.LISCONT3 || null,
          discount4: record.LISCONT4 || null
        });
      }

      // Valida e importa i prodotti
      const importedProducts = [];
      const errors = [];

      for (const record of records) {
        const result = insertProductSchema.safeParse(record);
        if (result.success) {
          try {
            const product = await storage.createProduct(result.data);
            importedProducts.push(product);
          } catch (error) {
            errors.push({
              code: record.code,
              error: `Errore durante l'inserimento: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
              record: JSON.stringify(record)
            });
          }
        } else {
          errors.push({
            code: record.code,
            error: `Validazione fallita: ${result.error.message}`,
            record: JSON.stringify(record)
          });
        }
      }

      // Se ci sono errori, genera un CSV di log
      const errorLogId = errors.length > 0 ? Date.now().toString() : null;
      if (errorLogId) {
        const errorLog = `Codice,Errore,Dati Record\n${errors.map(e => 
          `"${e.code}","${e.error}","${e.record}"`
        ).join('\n')}`;

        // Salva temporaneamente il log degli errori
        app.locals.errorLogs = app.locals.errorLogs || {};
        app.locals.errorLogs[errorLogId] = errorLog;
      }

      res.json({ 
        imported: importedProducts.length,
        total: records.length,
        errors: errors.length > 0 ? errors : undefined,
        errorLogId
      });
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      res.status(500).json({ error: "Errore durante l'importazione del file" });
    }
  });

  // Nuova route per scaricare il log degli errori
  app.get("/api/admin/import-errors/:id", (req, res) => {
    const errorLogId = req.params.id;
    const errorLog = app.locals.errorLogs?.[errorLogId];

    if (!errorLog) {
      return res.status(404).json({ error: "Log degli errori non trovato" });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=errori_importazione_${errorLogId}.csv`);
    res.send(errorLog);

    // Rimuovi il log dopo il download
    delete app.locals.errorLogs[errorLogId];
  });

  // Sales routes
  app.get("/api/sales", async (_req, res) => {
    const sales = await storage.getAllSales();
    res.json(sales);
  });

  app.post("/api/sales", async (req, res) => {
    const saleSchema = z.object({
      total: z.string(),
      paymentMethod: z.string(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number(),
        price: z.string()
      }))
    });

    const result = saleSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      const sale = await storage.createSale({
        total: result.data.total,
        paymentMethod: result.data.paymentMethod,
        receiptNumber: generateReceiptNumber()
      });

      // Creare gli elementi della vendita
      const saleItems = await Promise.all(result.data.items.map(item =>
        storage.createSaleItem({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })
      ));

      // TODO: Implementare la stampa della ricevuta
      // await printer.printReceipt(sale, saleItems);

      res.json(sale);
    } catch (error) {
      console.error('Errore durante la creazione della vendita:', error);
      res.status(500).json({ error: "Impossibile completare la vendita" });
    }
  });

  // Nuove route per la configurazione della stampante
  app.get("/api/admin/printer-config", async (_req, res) => {
    try {
      const [config] = await db
        .select()
        .from(printerConfigs)
        .orderBy(printerConfigs.updatedAt)
        .limit(1);

      res.json(config || null);
    } catch (error) {
      console.error('Errore nel recupero della configurazione stampante:', error);
      res.status(500).json({ error: "Impossibile recuperare la configurazione" });
    }
  });

  app.post("/api/admin/printer-config", async (req, res) => {
    const result = insertPrinterConfigSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      // Rimuovi tutte le configurazioni esistenti
      await db.delete(printerConfigs);

      // Inserisci la nuova configurazione
      const [config] = await db
        .insert(printerConfigs)
        .values(result.data)
        .returning();

      res.json(config);
    } catch (error) {
      console.error('Errore nel salvataggio della configurazione:', error);
      res.status(500).json({ error: "Impossibile salvare la configurazione" });
    }
  });

  app.get("/api/admin/available-printers", async (_req, res) => {
    try {
      // In Windows, possiamo usare il comando "wmic printer get name"
      const { stdout } = await execAsync('wmic printer get name');

      // Pulisci l'output e ottieni la lista delle stampanti
      const printers = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line !== 'Name')
        .sort();

      res.json(printers);
    } catch (error) {
      console.error('Errore nel recupero delle stampanti:', error);
      res.status(500).json({ error: "Impossibile recuperare le stampanti" });
    }
  });

  // Nuove route per l'esecuzione di query SQL
  app.post("/api/admin/execute-query", async (req, res) => {
    const result = sqlQuerySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      // Ottieni la configurazione del database attiva
      const [activeConfig] = await db
        .select()
        .from(databaseConfigs)
        .where(eq(databaseConfigs.isActive, true))
        .limit(1);

      if (!activeConfig) {
        return res.status(400).json({ 
          success: false,
          error: "Nessuna configurazione di database attiva"
        });
      }

      const startTime = Date.now();
      
      // Esegui la query sul database MSSQL
      const queryResult = await executeMssqlQuery(
        activeConfig, 
        result.data.query, 
        result.data.parameters || []
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Registra la query nella cronologia
      await db.insert(sqlQueryHistory).values({
        configId: result.data.configId,
        query: result.data.query,
        duration,
        status: 'success',
        message: 'Query eseguita con successo',
        rowsAffected: queryResult.rowCount
      });
      
      res.json({
        success: true,
        result: queryResult,
        duration
      });
    } catch (error) {
      console.error('Errore nell\'esecuzione della query:', error);
      
      // Registra l'errore nella cronologia
      try {
        await db.insert(sqlQueryHistory).values({
          configId: result.data.configId,
          query: result.data.query,
          status: 'error',
          message: error instanceof Error ? error.message : 'Errore sconosciuto',
          rowsAffected: 0
        });
      } catch (logError) {
        console.error('Errore nel salvataggio della cronologia:', logError);
      }
      
      res.status(500).json({ 
        success: false,
        error: "Errore nell'esecuzione della query",
        message: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });

  // Route per ottenere la cronologia delle query
  app.get("/api/admin/query-history", async (req, res) => {
    try {
      const history = await db
        .select()
        .from(sqlQueryHistory)
        .orderBy(desc(sqlQueryHistory.timestamp))
        .limit(100);

      res.json(history);
    } catch (error) {
      console.error('Errore nel recupero della cronologia delle query:', error);
      res.status(500).json({ error: "Impossibile recuperare la cronologia" });
    }
  });

  // Nuova route per interrogare la tabella C3EXPPOS
  app.get("/api/c3exppos", async (req, res) => {
    try {
      // Ottieni la configurazione del database attiva
      const [activeConfig] = await db
        .select()
        .from(databaseConfigs)
        .where(eq(databaseConfigs.isActive, true))
        .limit(1);

      if (!activeConfig) {
        return res.status(400).json({ 
          success: false,
          error: "Nessuna configurazione di database attiva"
        });
      }

      // Ottieni il codice azienda dalla query string o usa il default 'SCARL'
      const codiceAzienda = req.query.codiceAzienda as string || 'SCARL';
      
      // Esegui la query sulla tabella C3EXPPOS
      const result = await queryC3EXPPOS(activeConfig, codiceAzienda);
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error('Errore nell\'interrogazione della tabella C3EXPPOS:', error);
      res.status(500).json({ 
        success: false,
        error: "Errore nell'interrogazione della tabella C3EXPPOS",
        message: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });

  // Nuova route per importare i prodotti dalla tabella C3EXPPOS
  app.post("/api/import-products-from-c3exppos", async (req, res) => {
    try {
      // Ottieni la configurazione del database attiva
      const [activeConfig] = await db
        .select()
        .from(databaseConfigs)
        .where(eq(databaseConfigs.isActive, true))
        .limit(1);

      if (!activeConfig) {
        return res.status(400).json({ 
          success: false,
          error: "Nessuna configurazione di database attiva"
        });
      }

      // Ottieni il codice azienda dalla query string o usa il default 'SCARL'
      const codiceAzienda = req.body.codiceAzienda || 'SCARL';
      
      // Importa i prodotti dalla tabella C3EXPPOS
      const products = await importProductsFromC3EXPPOS(activeConfig, codiceAzienda);
      
      // Salva i prodotti nel database interno
      const importedProducts = [];
      const errors = [];
      
      for (const product of products) {
        try {
          const existingProduct = await db
            .select()
            .from(schema.products)
            .where(eq(schema.products.code, product.code))
            .limit(1)
            .then(res => res[0]);
          
          if (existingProduct) {
            // Aggiorna il prodotto esistente
            const [updatedProduct] = await db
              .update(schema.products)
              .set(product)
              .where(eq(schema.products.code, product.code))
              .returning();
            
            importedProducts.push(updatedProduct);
          } else {
            // Crea un nuovo prodotto
            const [newProduct] = await db
              .insert(schema.products)
              .values(product)
              .returning();
            
            importedProducts.push(newProduct);
          }
        } catch (err) {
          console.error(`Errore nell'importazione del prodotto ${product.code}:`, err);
          errors.push({
            code: product.code,
            error: err instanceof Error ? err.message : 'Errore sconosciuto'
          });
        }
      }
      
      res.json({
        success: true,
        imported: importedProducts.length,
        total: products.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Errore nell\'importazione dei prodotti da C3EXPPOS:', error);
      res.status(500).json({ 
        success: false,
        error: "Errore nell'importazione dei prodotti da C3EXPPOS",
        message: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });

  // Route per ottenere i log di connessione
  app.get("/api/admin/connection-logs", async (req, res) => {
    try {
      const logs = await db
        .select()
        .from(dbConnectionLogs)
        .orderBy(desc(dbConnectionLogs.timestamp))
        .limit(100);

      res.json(logs);
    } catch (error) {
      console.error('Errore nel recupero dei log di connessione:', error);
      res.status(500).json({ error: "Impossibile recuperare i log" });
    }
  });

  // Route per le operazioni pianificate
  app.post("/api/admin/scheduled-operations", async (req, res) => {
    const result = scheduleOperationSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    try {
      // Calcola la prossima esecuzione in base alla pianificazione cron
      // Per semplicità, impostiamo la prossima esecuzione a domani
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
      
      const [operation] = await db
        .insert(scheduledOperations)
        .values({
          name: result.data.name,
          type: result.data.type,
          configId: result.data.configId,
          schedule: result.data.schedule,
          nextRun,
          options: result.data.options || {},
          status: 'pending'
        })
        .returning();

      res.json(operation);
    } catch (error) {
      console.error('Errore nella creazione dell\'operazione pianificata:', error);
      res.status(500).json({ error: "Impossibile creare l'operazione pianificata" });
    }
  });

  app.get("/api/admin/scheduled-operations", async (_req, res) => {
    try {
      const operations = await db
        .select()
        .from(scheduledOperations)
        .orderBy(scheduledOperations.nextRun);

      res.json(operations);
    } catch (error) {
      console.error('Errore nel recupero delle operazioni pianificate:', error);
      res.status(500).json({ error: "Impossibile recuperare le operazioni pianificate" });
    }
  });

  app.delete("/api/admin/scheduled-operations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    try {
      await db
        .delete(scheduledOperations)
        .where(eq(scheduledOperations.id, id));

      res.status(204).end();
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'operazione pianificata:', error);
      res.status(500).json({ error: "Impossibile eliminare l'operazione pianificata" });
    }
  });

  // Nuova rotta per recuperare i clienti
  app.get("/api/customers", async (req, res) => {
    try {
      const [activeConfig] = await db
        .select()
        .from(databaseConfigs)
        .where(eq(databaseConfigs.isActive, true))
        .limit(1);

      if (!activeConfig) {
        return res.status(400).json({ 
          success: false,
          error: "Nessuna configurazione di database attiva"
        });
      }
      
      // Il codice azienda potrebbe essere passato come query param o preso da una configurazione
      // Per ora, usiamo 'SCARL' come specificato.
      const companyCode = (req.query.companyCode as string) || 'SCARL'; 
      
      const customersList: ExternalCustomer[] = await getCustomers(activeConfig, companyCode);
      
      res.json({
        success: true,
        customers: customersList
      });

    } catch (error) {
      console.error('Errore nel recupero dei clienti:', error);
      res.status(500).json({ 
        success: false,
        error: "Impossibile recuperare i clienti",
        message: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateReceiptNumber(): string {
  return `R${Date.now()}`;
}
