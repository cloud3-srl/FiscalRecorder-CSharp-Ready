import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertQuickButtonSchema, insertDatabaseConfigSchema } from "@shared/schema";
import { z } from "zod";
import { eq, sql } from 'drizzle-orm';
import { db } from "./db";
import { products, quickButtons, databaseConfigs } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";

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
      // TODO: Implementare il test della connessione MSSQL
      // Per ora restituiamo sempre successo
      res.json({ success: true });
    } catch (error) {
      console.error('Errore nel test della connessione:', error);
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

  const httpServer = createServer(app);
  return httpServer;
}

function generateReceiptNumber(): string {
  return `R${Date.now()}`;
}