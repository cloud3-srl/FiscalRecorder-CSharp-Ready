import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getOfflineProducts, 
  getPendingSales, 
  removePendingSale, 
  syncProducts 
} from '@/lib/indexedDB';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Monitor dello stato di connessione
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connessione ripristinata",
        description: "Sincronizzazione dati in corso..."
      });
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modalità offline",
        description: "Le vendite verranno sincronizzate quando la connessione sarà ripristinata",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincronizzazione dei dati quando si torna online
  const syncData = async () => {
    try {
      // Sincronizza i prodotti
      const response = await fetch('/api/products');
      if (response.ok) {
        const products = await response.json();
        await syncProducts(products);
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      }

      // Sincronizza le vendite in sospeso
      const pendingSales = await getPendingSales();
      for (const pendingSale of pendingSales) {
        try {
          const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...pendingSale.sale,
              items: pendingSale.items,
            }),
          });

          if (response.ok) {
            await removePendingSale(pendingSale.id);
            queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
          }
        } catch (error) {
          console.error('Errore sincronizzazione vendita:', error);
        }
      }

      toast({
        title: "Sincronizzazione completata",
        description: "Tutti i dati sono stati sincronizzati con successo"
      });
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      toast({
        title: "Errore sincronizzazione",
        description: "Impossibile sincronizzare alcuni dati",
        variant: "destructive"
      });
    }
  };

  // Query per i prodotti con fallback offline
  const useOfflineProducts = () => {
    return useQuery({
      queryKey: ['/api/products'],
      queryFn: async () => {
        try {
          if (!isOnline) {
            return getOfflineProducts();
          }
          const response = await fetch('/api/products');
          const products = await response.json();
          await syncProducts(products);
          return products;
        } catch (error) {
          const offlineProducts = await getOfflineProducts();
          if (offlineProducts.length) {
            return offlineProducts;
          }
          throw error;
        }
      }
    });
  };

  return {
    isOnline,
    useOfflineProducts,
    syncData
  };
};
