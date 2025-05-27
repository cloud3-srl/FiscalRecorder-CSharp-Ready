import { useQuery } from "@tanstack/react-query";
import * as schema from "@shared/schema";
import CustomersTable from "./components/CustomersTable";
import { PageHeader, PageTitle } from "@/components/ui/layout"; 

export default function CustomersPage() {
  const { data: customers, isLoading, error } = useQuery<schema.Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }
  });

  if (isLoading) {
    return <div className="p-4">Caricamento clienti...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Errore: {error.message}</div>;
  }

  if (!customers) {
    return <div className="p-4 text-red-500">Impossibile caricare i dati dei clienti.</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader>
        <PageTitle>Anagrafica Clienti</PageTitle>
      </PageHeader>
      <CustomersTable customers={customers} />
    </div>
  );
}
