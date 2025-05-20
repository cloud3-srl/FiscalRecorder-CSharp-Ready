import { useQuery } from "@tanstack/react-query";
import { ExternalCustomer } from "@shared/schema";
import CustomersTable from "./components/CustomersTable";
import { PageHeader, PageTitle } from "@/components/ui/layout"; // Assumendo che questi esistano e siano utili

// Funzione helper per recuperare i clienti
async function fetchCustomers(): Promise<{ success: boolean; customers?: ExternalCustomer[]; error?: string }> {
  const response = await fetch('/api/customers?companyCode=SCARL'); // Aggiunto companyCode per coerenza, anche se il backend lo usa di default
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Errore nel recupero dei clienti");
  }
  return response.json();
}

export default function CustomersPage() {
  const { data, isLoading, error } = useQuery<{ success: boolean; customers?: ExternalCustomer[]; error?: string }, Error>({
    queryKey: ['externalCustomers'],
    queryFn: fetchCustomers,
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
        <PageTitle>Anagrafica Clienti Esterna</PageTitle>
        {/* Qui potrebbero andare pulsanti azione come "Aggiungi Cliente" o filtri */}
      </PageHeader>
      <CustomersTable customers={data.customers} />
    </div>
  );
}
