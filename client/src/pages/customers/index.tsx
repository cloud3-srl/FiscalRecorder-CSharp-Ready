import { useQuery } from "@tanstack/react-query";
import * as schema from "@shared/schema"; // Importa tutto da schema
import CustomersTable from "./components/CustomersTable";
import { PageHeader, PageTitle } from "@/components/ui/layout"; 

// Funzione helper per recuperare i clienti locali
async function fetchLocalCustomers(): Promise<{ success: boolean; customers?: schema.Customer[]; error?: string }> {
  const response = await fetch('/api/local/customers'); 
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Errore nel recupero dei clienti locali");
  }
  return response.json();
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
