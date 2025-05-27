import * as schema from "@shared/schema"; // Importa tutto da schema
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
  customers: schema.Customer[]; // Modificato per usare schema.Customer
}

export default function CustomersTable({ customers }: CustomersTableProps) {
  if (!customers || customers.length === 0) {
    return <p>Nessun cliente da visualizzare.</p>;
  }

  // Definisci le colonne da visualizzare
  // Aggiornato per usare i campi di schema.Customer
  const columns = [
    { accessorKey: "code", header: "Codice" },
    { accessorKey: "name", header: "Ragione Sociale" },
    { accessorKey: "vatNumber", header: "P.IVA" },
    { accessorKey: "fiscalCode", header: "Cod. Fiscale" },
    { accessorKey: "city", header: "Città" },
    { accessorKey: "province", header: "Prov." },
    { accessorKey: "address", header: "Indirizzo" },
    { accessorKey: "sdiCode", header: "SDI/PEC" },
    { accessorKey: "paymentCode", header: "Cod. Pag." },
    { accessorKey: "email", header: "Email"},
    { accessorKey: "phone", header: "Telefono"},
    { accessorKey: "notes", header: "Note"},
    { accessorKey: "points", header: "Punti"},
    { accessorKey: "lastSyncedFromExternalAt", header: "Ultima Sync Esterna"},
    { accessorKey: "updatedAt", header: "Ult. Modifica Locale"},
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
          {customers.map((customer) => (
            <TableRow key={customer.id}> {/* Usa customer.id come key */}
              {columns.map((column) => (
                <TableCell key={column.accessorKey}>
                  {/* Gestione per i campi data e altri tipi se necessario */}
                  {column.accessorKey === "lastSyncedFromExternalAt" || column.accessorKey === "updatedAt"
                    ? customer[column.accessorKey as keyof schema.Customer] 
                      ? new Date(customer[column.accessorKey as keyof schema.Customer] as string | number | Date).toLocaleString() 
                      : '-'
                    : String(customer[column.accessorKey as keyof schema.Customer] ?? '-')}
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
