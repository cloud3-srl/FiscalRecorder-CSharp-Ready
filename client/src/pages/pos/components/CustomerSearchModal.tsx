import { useState, useEffect } from 'react';
import { ExternalCustomer } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog'; // Aggiunto DialogFooter
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'; // Per la ricerca

interface CustomerSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerSelect: (customer: ExternalCustomer) => void;
  triggerButton?: React.ReactNode; // Opzionale, se vogliamo un trigger esterno
}

async function fetchAllCustomers(): Promise<{ success: boolean; customers?: ExternalCustomer[]; error?: string }> {
  const response = await fetch('/api/customers?companyCode=SCARL'); // Assumiamo companyCode fisso per ora
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Errore nel recupero dei clienti");
  }
  return response.json();
}

export default function CustomerSearchModal({ open, onOpenChange, onCustomerSelect, triggerButton }: CustomerSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: customersData, isLoading, error } = useQuery<{ success: boolean; customers?: ExternalCustomer[]; error?: string }, Error>({
    queryKey: ['allExternalCustomersForSearch'],
    queryFn: fetchAllCustomers,
    enabled: open, // Carica i clienti solo quando il modale è aperto (o sta per aprirsi)
  });

  const filteredCustomers = customersData?.customers?.filter(customer =>
    customer.ANDESCRI.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.ANCODICE.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.ANPARIVA && customer.ANPARIVA.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.ANCODFIS && customer.ANCODFIS.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleSelect = (customer: ExternalCustomer) => {
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
                  key={customer.ANCODICE}
                  value={`${customer.ANDESCRI} ${customer.ANCODICE}`} // Valore per la ricerca interna di Command
                  onSelect={() => handleSelect(customer)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.ANDESCRI}</span>
                    <span className="text-xs text-muted-foreground">
                      Cod: {customer.ANCODICE} - P.IVA: {customer.ANPARIVA || 'N/D'} - CF: {customer.ANCODFIS || 'N/D'}
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
