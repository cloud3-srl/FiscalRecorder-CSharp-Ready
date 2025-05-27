import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MasterDetailLayout } from "../shared/MasterDetailLayout";
import { PrintersList, PrintersListFilters } from "./PrintersList";
import { PrinterForm } from "./PrinterForm";
import { 
  PrinterConfig, 
  PrinterFormData, 
  DEFAULT_PRINTER_CONFIG, 
  ConnectionTestResult,
  CONNECTION_STATUS 
} from "./types";

export function PrintersSettings() {
  const [selectedPrinterId, setSelectedPrinterId] = useState<number>();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<"all" | "active" | "online" | "offline">("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per caricare le stampanti
  const { data: printers = [], isLoading } = useQuery<PrinterConfig[]>({
    queryKey: ['printers'],
    queryFn: async () => {
      const response = await fetch('/api/printers');
      if (!response.ok) throw new Error('Errore nel caricamento delle stampanti');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Mutation per salvare stampante
  const savePrinterMutation = useMutation({
    mutationFn: async (data: { printer: PrinterFormData; isNew: boolean }) => {
      const url = data.isNew ? '/api/printers' : `/api/printers/${selectedPrinterId}`;
      const method = data.isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.printer),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante il salvataggio');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      
      if (variables.isNew) {
        setIsCreatingNew(false);
        setSelectedPrinterId(data.data.id);
        toast({
          title: "Stampante creata",
          description: "La nuova stampante è stata configurata con successo.",
        });
      } else {
        toast({
          title: "Stampante aggiornata", 
          description: "Le modifiche sono state salvate con successo.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation per eliminare stampante
  const deletePrinterMutation = useMutation({
    mutationFn: async (printerId: number) => {
      const response = await fetch(`/api/printers/${printerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'eliminazione');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] });
      setSelectedPrinterId(undefined);
      setIsCreatingNew(false);
      
      toast({
        title: "Stampante eliminata",
        description: "La stampante è stata rimossa dal sistema.",
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

  // Test connessione stampante
  const testConnection = async (printerData: PrinterFormData): Promise<ConnectionTestResult> => {
    try {
      const response = await fetch('/api/printers/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Errore durante il test');
      }
      
      return result.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Errore durante il test di connessione'
      };
    }
  };

  // Filtri e ricerca
  const filteredPrinters = useMemo(() => {
    let filtered = printers;

    // Filtro per ricerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(printer =>
        printer.name?.toLowerCase().includes(query) ||
        printer.type?.toLowerCase().includes(query) ||
        printer.description?.toLowerCase().includes(query)
      );
    }

    // Filtro per stato
    switch (currentFilter) {
      case "active":
        filtered = filtered.filter(p => p.isActive);
        break;
      case "online":
        filtered = filtered.filter(p => p.connectionStatus === CONNECTION_STATUS.ONLINE);
        break;
      case "offline":
        filtered = filtered.filter(p => p.connectionStatus === CONNECTION_STATUS.OFFLINE);
        break;
    }

    return filtered;
  }, [printers, searchQuery, currentFilter]);

  // Statistiche per i filtri
  const stats = useMemo(() => {
    const total = printers.length;
    const active = printers.filter(p => p.isActive).length;
    const online = printers.filter(p => p.connectionStatus === CONNECTION_STATUS.ONLINE).length;
    
    return { total, active, online };
  }, [printers]);

  // Stampante selezionata
  const selectedPrinter = useMemo(() => {
    if (isCreatingNew) return undefined;
    return printers.find(p => p.id === selectedPrinterId);
  }, [printers, selectedPrinterId, isCreatingNew]);

  // Handlers
  const handleSelectPrinter = (printer: PrinterConfig) => {
    setSelectedPrinterId(printer.id);
    setIsCreatingNew(false);
  };

  const handleAddNew = () => {
    setIsCreatingNew(true);
    setSelectedPrinterId(undefined);
  };

  const handleSave = async (data: PrinterFormData) => {
    await savePrinterMutation.mutateAsync({
      printer: data,
      isNew: isCreatingNew
    });
  };

  const handleDelete = async () => {
    if (!selectedPrinterId) return;
    
    if (window.confirm('Sei sicuro di voler eliminare questa stampante? L\'operazione non può essere annullata.')) {
      await deletePrinterMutation.mutateAsync(selectedPrinterId);
    }
  };

  // Contenuto master (lista)
  const masterContent = (
    <>
      <PrintersListFilters
        totalCount={stats.total}
        activeCount={stats.active}
        onlineCount={stats.online}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
      />
      <PrintersList
        printers={filteredPrinters}
        selectedPrinterId={selectedPrinterId}
        onSelectPrinter={handleSelectPrinter}
        onEditPrinter={handleSelectPrinter}
        onDeletePrinter={(printer) => {
          setSelectedPrinterId(printer.id);
          setTimeout(() => handleDelete(), 100);
        }}
        isLoading={isLoading}
      />
    </>
  );

  // Contenuto detail (form)
  const detailContent = (() => {
    if (isCreatingNew) {
      return (
        <PrinterForm
          printer={DEFAULT_PRINTER_CONFIG}
          onSave={handleSave}
          onTestConnection={testConnection}
          isLoading={savePrinterMutation.isPending}
          isNew={true}
        />
      );
    }

    if (selectedPrinter) {
      return (
        <PrinterForm
          printer={selectedPrinter}
          onSave={handleSave}
          onDelete={handleDelete}
          onTestConnection={testConnection}
          isLoading={savePrinterMutation.isPending || deletePrinterMutation.isPending}
          isNew={false}
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-center">
        <div className="space-y-4">
          <div className="text-6xl">🖨️</div>
          <div>
            <h3 className="text-lg font-medium mb-2">Seleziona una stampante</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scegli una stampante dalla lista per modificarne la configurazione
            </p>
            <button
              onClick={handleAddNew}
              className="text-sm text-cassanova-primary hover:underline"
            >
              oppure aggiungi una nuova stampante
            </button>
          </div>
        </div>
      </div>
    );
  })();

  const getDetailTitle = () => {
    if (isCreatingNew) return "Nuova Stampante";
    if (selectedPrinter) return `Modifica: ${selectedPrinter.name}`;
    return undefined;
  };

  const getDetailSubtitle = () => {
    if (isCreatingNew) return "Configura una nuova stampante per il sistema";
    if (selectedPrinter) return `Tipo: ${selectedPrinter.type} • ${selectedPrinter.connectionMethod}`;
    return undefined;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <MasterDetailLayout
        // Master panel
        masterTitle="Stampanti Configurate"
        masterSearch={true}
        masterSearchPlaceholder="Cerca stampanti..."
        masterSearchValue={searchQuery}
        onMasterSearchChange={setSearchQuery}
        masterAddButton={true}
        masterAddButtonText="Aggiungi Stampante"
        onMasterAdd={handleAddNew}
        masterContent={masterContent}
        masterWidth="normal"
        
        // Detail panel
        detailTitle={getDetailTitle()}
        detailSubtitle={getDetailSubtitle()}
        detailContent={detailContent}
        
        className="h-[calc(100vh-12rem)]"
      />
    </div>
  );
}
