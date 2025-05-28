import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Customer } from "@shared/schema";
import { User } from "lucide-react";

interface CustomerSelectProps {
  selectedCustomerId: number | null;
  onSelect: (customerId: number | null) => void;
}

export default function CustomerSelect({ selectedCustomerId, onSelect }: CustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: selectedCustomer } = useQuery<Customer>({
    queryKey: ['/api/customers', selectedCustomerId],
    enabled: !!selectedCustomerId,
  });

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.code && customer.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.fiscalCode && customer.fiscalCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <User className="h-4 w-4 mr-2" />
        {selectedCustomer ? selectedCustomer.name : "Seleziona Cliente"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Seleziona Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Cerca cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />

            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {filteredCustomers?.map(customer => (
                <Button
                  key={customer.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => {
                    onSelect(customer.id);
                    setIsOpen(false);
                  }}
                >
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.code} 
                      {customer.fiscalCode && ` - CF: ${customer.fiscalCode}`}
                    </div>
                    {customer.address && (
                      <div className="text-xs text-muted-foreground">
                        {customer.address}, {customer.city}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
