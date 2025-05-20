import { useQuery } from "@tanstack/react-query";
import * as schema from "@shared/schema"; // Importa tutto da schema
import CustomersTable from "./components/CustomersTable";
import { PageHeader, PageTitle } from "@/components/ui/layout"; 

// Funzione helper per recuperare i clienti locali
async function fetchLocalCustomers(): Promise<{ success: boolean; customers?: schema.Customer[]; error?: string }> {
  try {
    const response = await fetch('/api/local/customers'); 
    if (!response.ok) {
      // Se la risposta non è ok, prova a leggere come testo per vedere se è HTML
      const textResponse = await response.text();
      if (textResponse.trim().startsWith('<!DOCTYPE html') || textResponse.trim().startsWith('<html')) {
        throw new Error("Risposta API non valida (HTML ricevuto). L'applicazione potrebbe essere offline o c'è un errore sul server.");
      }
      // Prova a parsare come JSON se non è HTML, potrebbe essere un errore JSON strutturato
      try {
        const errorData = JSON.parse(textResponse);
        throw new Error(errorData.message || errorData.error || "Errore nel recupero dei clienti locali");
      } catch (e) {
        throw new Error(`Errore HTTP ${response.status}: ${response.statusText}. Risposta non JSON.`);
      }
    }
    // Controlla il content-type prima di parsare come JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    } else {
      console.error("Content-Type non JSON ricevuto (CustomersPage):", contentType); // Log aggiuntivo
      throw new Error(`Risposta API non valida (Content-Type: ${contentType || 'non specificato'}).`);
    }
  } catch (networkError) { // Cattura errori di fetch (es. server non raggiungibile)
    console.error("Errore di rete nel recupero dei clienti locali:", networkError);
    throw new Error(`Errore di rete: ${networkError instanceof Error ? networkError.message : String(networkError)}. Controlla la connessione.`);
  }
}

export default function CustomersPage() {
  const { data, isLoading, error } = useQuery<{ success: boolean; customers?: schema.Customer[]; error?: string }, Error>({
    queryKey: ['localCustomers'], // Aggiornata queryKey
    queryFn: fetchLocalCustomers, // Aggiornata funzione di fetch
  });

  if (isLoading) {
    return <div className="p-4">Caricamento clienti...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Errore: {error.message}</div>;
  }

  if (!data?.success || !data.customers) {
    return <div className="p-4 text-red-500">{data?.error || "Impossibile caricare i dati dei clienti."}</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader>
        <PageTitle>Anagrafica Clienti</PageTitle> {/* Titolo aggiornato */}
        {/* Qui potrebbero andare pulsanti azione come "Aggiungi Cliente" o filtri */}
      </PageHeader>
      <CustomersTable customers={data.customers} />
    </div>
  );
}
