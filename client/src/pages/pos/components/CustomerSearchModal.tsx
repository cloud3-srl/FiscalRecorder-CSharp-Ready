import { useState, useEffect } from 'react';
// import { ExternalCustomer } from '@shared/schema'; // Rimosso, useremo schema.Customer
import * as schema from '@shared/schema'; // Aggiunto import per schema
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog'; // Aggiunto DialogFooter
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'; // Per la ricerca

interface CustomerSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerSelect: (customer: schema.Customer) => void; // Modificato per usare schema.Customer
  triggerButton?: React.ReactNode; // Opzionale, se vogliamo un trigger esterno
}

// Modificata per usare la nuova API e il tipo Customer locale
async function fetchLocalCustomers(): Promise<{ success: boolean; customers?: schema.Customer[]; error?: string }> { 
  const response = await fetch('/api/local/customers'); 
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Errore nel recupero dei clienti locali");
  }
  return response.json();
}

export default function CustomerSearchModal({ open, onOpenChange, onCustomerSelect, triggerButton }: CustomerSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modificato per usare fetchLocalCustomers e il tipo Customer locale
  const { data: customersData, isLoading, error } = useQuery<{ success: boolean; customers?: schema.Customer[]; error?: string }, Error>({
    queryKey: ['allLocalCustomersForSearch'], // Chiave query aggiornata
    queryFn: fetchLocalCustomers, // Funzione di fetch aggiornata
    enabled: open, 
  });

  // Modificato per filtrare i campi del tipo Customer locale
  const filteredCustomers = customersData?.customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || // Usa customer.name
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) || // Usa customer.code
    (customer.vatNumber && customer.vatNumber.toLowerCase().includes(searchTerm.toLowerCase())) || // Usa customer.vatNumber
    (customer.fiscalCode && customer.fiscalCode.toLowerCase().includes(searchTerm.toLowerCase())) // Usa customer.fiscalCode
  ) || [];

  const handleSelect = (customer: schema.Customer) => { // Modificato per usare schema.Customer
    onCustomerSelect(customer);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Ricerca Cliente</DialogTitle>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Cerca per nome, codice, P.IVA, Cod. Fiscale..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <ScrollArea className="h-[300px]">
            <CommandList>
              {isLoading && <CommandItem>Caricamento...</CommandItem>}
              {error && <CommandItem className="text-red-500">Errore: {error.message}</CommandItem>}
              {!isLoading && !error && filteredCustomers.length === 0 && (
                <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
              )}
              {!isLoading && !error && filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.code} // Usa customer.code
                  value={`${customer.name} ${customer.code}`} // Usa customer.name e customer.code
                  onSelect={() => handleSelect(customer)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span> {/* Usa customer.name */}
                    <span className="text-xs text-muted-foreground">
                      Cod: {customer.code} - P.IVA: {customer.vatNumber || 'N/D'} - CF: {customer.fiscalCode || 'N/D'} {/* Usa campi locali */}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </ScrollArea>
        </Command>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Chiudi
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
