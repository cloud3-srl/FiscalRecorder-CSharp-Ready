import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertQuickButtonSchema } from "@shared/schema";
import { z } from "zod";
import { eq } from 'drizzle-orm';
import { db } from "./db";
import { products, quickButtons } from "@shared/schema";
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
              error: `Errore durante l'inserimento: ${error.message}`
            });
          }
        } else {
          errors.push({
            code: record.code,
            error: `Validazione fallita: ${result.error.message}`
          });
        }
      }

      res.json({ 
        imported: importedProducts.length,
        total: records.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      res.status(500).json({ error: "Errore durante l'importazione del file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateReceiptNumber(): string {
  return `R${Date.now()}`;
}