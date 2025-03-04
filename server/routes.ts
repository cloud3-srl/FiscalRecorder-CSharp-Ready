import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { printer } from "./printer";
import { insertProductSchema, insertQuickButtonSchema } from "@shared/schema";
import { z } from "zod";

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
    const buttons = await storage.getQuickButtons();
    res.json(buttons);
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

      // Stampa ricevuta
      await printer.printReceipt(sale, saleItems);

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