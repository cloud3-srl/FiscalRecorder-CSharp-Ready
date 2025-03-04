import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { printer } from "./printer";
import { insertProductSchema, insertSaleSchema } from "@shared/schema";
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

  // Sales routes
  app.get("/api/sales", async (_req, res) => {
    const sales = await storage.getAllSales();
    res.json(sales);
  });

  app.post("/api/sales", async (req, res) => {
    const saleSchema = z.object({
      total: z.number(),
      paymentMethod: z.string(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number(),
        price: z.number()
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

      await Promise.all(result.data.items.map(item =>
        storage.createSaleItem({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })
      ));

      // Print receipt
      await printer.printReceipt(sale, result.data.items);

      res.json(sale);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete sale" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateReceiptNumber(): string {
  return `R${Date.now()}`;
}
