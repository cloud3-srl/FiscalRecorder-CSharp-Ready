import { useState, useEffect } from 'react';
import * as schema from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';

interface CustomerSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerSelect: (customer: schema.Customer) => void;
  triggerButton?: React.ReactNode;
}

// Corretto per usare l'API esistente
async function fetchLocalCustomers(): Promise<schema.Customer[]> { 
  try {
    const response = await fetch('/api/customers'); 
    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (networkError) {
    console.error("Errore di rete nel recupero dei clienti:", networkError);
    throw new Error(`Errore di rete: ${networkError instanceof Error ? networkError.message : String(networkError)}`);
  }
}

export default function CustomerSearchModal({ open, onOpenChange, onCustomerSelect, triggerButton }: CustomerSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Corretto per usare l'API semplificata
  const { data: customers, isLoading, error } = useQuery<schema.Customer[], Error>({
    queryKey: ['allCustomersForSearch'],
    queryFn: fetchLocalCustomers,
    enabled: open, 
  });

  // Filtro sui clienti con controlli null safety
  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.code && customer.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.vatNumber && customer.vatNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.fiscalCode && customer.fiscalCode.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleSelect = (customer: schema.Customer) => {
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
                  key={customer.code || customer.id || customer.name}
                  value={`${customer.name} ${customer.code || ''}`}
                  onSelect={() => handleSelect(customer)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Cod: {customer.code || 'N/D'} - P.IVA: {customer.vatNumber || 'N/D'} - CF: {customer.fiscalCode || 'N/D'}
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
