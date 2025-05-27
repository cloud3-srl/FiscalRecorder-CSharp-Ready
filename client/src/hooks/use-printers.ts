import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface Printer {
  id: number;
  name: string;
  type: 'thermal' | 'inkjet' | 'laser' | 'dotmatrix';
  connectionMethod: 'usb' | 'network' | 'bluetooth' | 'wifi';
  ipAddress?: string;
  port?: number;
  devicePath?: string;
  isActive: boolean;
  isDefault: boolean;
  connectionStatus: 'online' | 'offline' | 'unknown';
  description?: string;
  driverInfo?: string;
  capabilities?: string[];
}

export interface SystemPrinter {
  name: string;
  status: 'ready' | 'busy' | 'offline' | 'error';
  isDefault: boolean;
  driverName: string;
  location?: string;
  comment?: string;
}

export interface PrinterOption {
  value: string;
  label: string;
  description?: string;
}

export function usePrinters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per stampanti configurate
  const printersQuery = useQuery<Printer[]>({
    queryKey: ['printers'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/printers');
        if (!response.ok) throw new Error('Errore nel caricamento delle stampanti');
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        // Fallback per dati mock durante sviluppo
        return [
          {
            id: 1,
            name: "Stampante Termica POS",
            type: 'thermal' as const,
            connectionMethod: 'usb' as const,
            isActive: true,
            isDefault: true,
            connectionStatus: 'online' as const,
            description: "Stampante termica per scontrini",
            capabilities: ['receipt', 'barcode']
          },
          {
            id: 2,
            name: "HP LaserJet Pro",
            type: 'laser' as const,
            connectionMethod: 'network' as const,
            ipAddress: "192.168.1.100",
            port: 9100,
            isActive: true,
            isDefault: false,
            connectionStatus: 'online' as const,
            description: "Stampante laser per fatture",
            capabilities: ['document', 'duplex']
          }
        ];
      }
    },
  });

  // Query per stampanti di sistema (Windows/Mac)
  const systemPrintersQuery = useQuery<SystemPrinter[]>({
    queryKey: ['system-printers'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/printers/system');
        if (!response.ok) throw new Error('Errore nel caricamento delle stampanti di sistema');
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        // Fallback per dati mock durante sviluppo
        return [
          {
            name: "Microsoft Print to PDF",
            status: 'ready' as const,
            isDefault: false,
            driverName: "Microsoft Print To PDF",
            location: "Local"
          },
          {
            name: "HP DeskJet 2600 series",
            status: 'offline' as const,
            isDefault: true,
            driverName: "HP DeskJet 2600 series",
            location: "USB001"
          }
        ];
      }
    },
  });

  // Mutation per aggiungere stampante di sistema
  const addSystemPrinterMutation = useMutation({
    mutationFn: async (systemPrinter: SystemPrinter) => {
      const response = await fetch('/api/printers/import-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemPrinter),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'importazione');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      toast({
        title: "Stampante importata",
        description: "La stampante è stata aggiunta alle configurazioni.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation per test stampa
  const testPrintMutation = useMutation({
    mutationFn: async (printerId: number) => {
      const response = await fetch(`/api/printers/${printerId}/test`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante il test di stampa');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test completato",
        description: "La pagina di test è stata inviata alla stampante.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore test stampa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    printers: printersQuery.data || [],
    systemPrinters: systemPrintersQuery.data || [],
    isLoading: printersQuery.isLoading || systemPrintersQuery.isLoading,
    addSystemPrinter: addSystemPrinterMutation.mutateAsync,
    testPrint: testPrintMutation.mutateAsync,
    refreshPrinters: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      queryClient.invalidateQueries({ queryKey: ['system-printers'] });
    }
  };
}

// Hook specifico per dropdown stampanti
export function usePrintersDropdown() {
  const { printers } = usePrinters();
  
  const activePrinters = printers.filter(p => p.isActive);
  
  const options: PrinterOption[] = [
    { value: '', label: 'Nessuna' },
    ...activePrinters.map(printer => ({
      value: printer.id.toString(),
      label: printer.name,
      description: `${printer.type} • ${printer.connectionStatus === 'online' ? 'Online' : 'Offline'}`
    }))
  ];

  return { options, printers: activePrinters };
}
