import { ExternalCustomer } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Per lo scroll orizzontale se necessario

interface CustomersTableProps {
  customers: ExternalCustomer[];
}

export default function CustomersTable({ customers }: CustomersTableProps) {
  if (!customers || customers.length === 0) {
    return <p>Nessun cliente da visualizzare.</p>;
  }

  // Definisci le colonne da visualizzare
  // Potremmo rendere queste colonne configurabili in futuro
  const columns = [
    { accessorKey: "ANCODICE", header: "Codice" },
    { accessorKey: "ANDESCRI", header: "Ragione Sociale" },
    { accessorKey: "ANPARIVA", header: "P.IVA" },
    { accessorKey: "ANCODFIS", header: "Cod. Fiscale" },
    { accessorKey: "ANLOCALI", header: "Città" },
    { accessorKey: "ANPROVIN", header: "Prov." },
    { accessorKey: "ANINDIRI", header: "Indirizzo" },
    { accessorKey: "ANCODEST", header: "SDI/PEC" },
    { accessorKey: "ANCODPAG", header: "Cod. Pag." },
  ];

  return (
    <ScrollArea className="whitespace-nowrap rounded-md border" style={{ height: 'calc(100vh - 200px)' }}> {/* Altezza esempio, da aggiustare */}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer, index) => (
            // Usare ANCODICE come key se è unico, altrimenti index o un uuid generato
            <TableRow key={customer.ANCODICE || index}> 
              {columns.map((column) => (
                <TableCell key={column.accessorKey}>
                  {customer[column.accessorKey as keyof ExternalCustomer] || '-'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
