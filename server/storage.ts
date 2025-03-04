import { products, sales, saleItems, quickButtons } from "@shared/schema";
import type { Product, Sale, SaleItem, QuickButton, InsertProduct, InsertSale, InsertSaleItem, InsertQuickButton } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  getAllSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  createSaleItem(item: InsertSaleItem): Promise<SaleItem>;
  getQuickButtons(): Promise<QuickButton[]>;
  createQuickButton(button: InsertQuickButton): Promise<QuickButton>;
  deleteQuickButton(id: number): Promise<void>;
  updateQuickButton(id: number, button: Partial<InsertQuickButton>): Promise<QuickButton>;
}

export class DatabaseStorage implements IStorage {
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async getAllSales(): Promise<Sale[]> {
    return await db.select().from(sales);
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale;
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [created] = await db.insert(sales).values(sale).returning();
    return created;
  }

  async createSaleItem(item: InsertSaleItem): Promise<SaleItem> {
    const [created] = await db.insert(saleItems).values(item).returning();
    return created;
  }

  async getQuickButtons(): Promise<QuickButton[]> {
    return await db.select().from(quickButtons).where(eq(quickButtons.active, true));
  }

  async createQuickButton(button: InsertQuickButton): Promise<QuickButton> {
    const [created] = await db.insert(quickButtons).values(button).returning();
    return created;
  }

  async deleteQuickButton(id: number): Promise<void> {
    await db
      .update(quickButtons)
      .set({ active: false })
      .where(eq(quickButtons.id, id));
  }

  async updateQuickButton(id: number, button: Partial<InsertQuickButton>): Promise<QuickButton> {
    const [updated] = await db
      .update(quickButtons)
      .set(button)
      .where(eq(quickButtons.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();