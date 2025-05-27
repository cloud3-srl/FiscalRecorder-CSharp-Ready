import { openDB, DBSchema } from 'idb';
import { Product, Sale, SaleItem } from '@shared/schema';

interface OfflineDB extends DBSchema {
  products: {
    key: number;
    value: Product;
    indexes: { 'by-code': string };
  };
  pendingSales: {
    key: number;
    value: {
      sale: Omit<Sale, 'id' | 'receiptNumber'>;
      items: Omit<SaleItem, 'id' | 'saleId'>[];
      createdAt: Date;
    };
  };
}

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store dei prodotti
      const productStore = db.createObjectStore('products', {
        keyPath: 'id',
      });
      productStore.createIndex('by-code', 'code');

      // Store delle vendite in attesa
      db.createObjectStore('pendingSales', {
        keyPath: 'id',
        autoIncrement: true,
      });
    },
  });

  return db;
};

// Singleton per l'istanza del database
let dbPromise: Promise<ReturnType<typeof initDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = initDB();
  }
  return dbPromise;
};

// Funzioni helper per la gestione dei prodotti
export const syncProducts = async (products: Product[]) => {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  await Promise.all([
    ...products.map(product => tx.store.put(product)),
    tx.done,
  ]);
};

export const getOfflineProducts = async () => {
  const db = await getDB();
  return db.getAll('products');
};

// Funzioni helper per la gestione delle vendite offline
export const savePendingSale = async (
  sale: Omit<Sale, 'id' | 'receiptNumber'>,
  items: Omit<SaleItem, 'id' | 'saleId'>[],
) => {
  const db = await getDB();
  await db.add('pendingSales', {
    sale,
    items,
    createdAt: new Date(),
  });
};

export const getPendingSales = async () => {
  const db = await getDB();
  return db.getAll('pendingSales');
};

export const removePendingSale = async (id: number) => {
  const db = await getDB();
  await db.delete('pendingSales', id);
};
