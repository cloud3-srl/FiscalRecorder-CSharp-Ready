import React, { useState, useMemo } from 'react';
import * as schema from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ColumnSelector, { ColumnConfig } from "@/components/DataTable/ColumnSelector";
import CustomerForm from "./CustomerForm";
import { DevFeature } from "@/contexts/DevModeContext";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CustomersTableProps {
  customers: schema.Customer[];
}

export default function CustomersTable({ customers }: CustomersTableProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<schema.Customer | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Configurazione colonne iniziale
  const defaultColumns: ColumnConfig[] = [
    { key: "code", label: "Codice", visible: true, sortable: true, width: 100 },
    { key: "name", label: "Ragione Sociale", visible: true, sortable: true, width: 200, required: true },
    { key: "fiscalCode", label: "Cod. Fiscale", visible: true, sortable: true, width: 120 },
    { key: "vatNumber", label: "P.IVA", visible: true, sortable: true, width: 120 },
    { key: "city", label: "Città", visible: true, sortable: true, width: 120 },
    { key: "province", label: "Prov.", visible: true, sortable: true, width: 80 },
    { key: "address", label: "Indirizzo", visible: false, sortable: true, width: 200 },
    { key: "sdiCode", label: "SDI/PEC", visible: false, sortable: true, width: 100 },
    { key: "paymentCode", label: "Cod. Pag.", visible: false, sortable: true, width: 100 },
    { key: "email", label: "Email", visible: true, sortable: true, width: 180 },
    { key: "phone", label: "Telefono", visible: true, sortable: true, width: 140 },
    { key: "notes", label: "Note", visible: false, sortable: false, width: 200 },
    { key: "points", label: "Punti", visible: true, sortable: true, width: 80 },
    { key: "lastSyncedFromExternalAt", label: "Ultima Sync", visible: false, sortable: true, width: 150 },
    { key: "updatedAt", label: "Modificato", visible: false, sortable: true, width: 150 },
  ];

  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);

  // Mutation per eliminazione
  const deleteMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    },
  });

  // Filtro clienti in base alla ricerca
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter(customer => 
      customer.name?.toLowerCase().includes(query) ||
      customer.code?.toLowerCase().includes(query) ||
      customer.fiscalCode?.toLowerCase().includes(query) ||
      customer.vatNumber?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.city?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  // Colonne visibili
  const visibleColumns = columns.filter(col => col.visible);

  const handleEdit = (customer: schema.Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = (customer: schema.Customer) => {
    if (confirm(`Confermi l'eliminazione del cliente "${customer.name}"?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(undefined);
    setIsFormOpen(true);
  };

  const formatFieldValue = (customer: schema.Customer, field: string) => {
    const value = customer[field as keyof schema.Customer];
    
    if (field === "lastSyncedFromExternalAt" || field === "updatedAt") {
      return value ? new Date(value as string | number | Date).toLocaleString() : '-';
    }
    
    if (field === "points") {
      return value ? `${value} pt` : '0 pt';
    }
    
    if (field === "fiscalCode" && value) {
      return (value as string).toUpperCase();
    }
    
    return String(value || '-');
  };

  const handleExport = () => {
    // Implementazione export CSV/Excel
    const csvContent = [
      visibleColumns.map(col => col.label).join(','),
      ...filteredCustomers.map(customer => 
        visibleColumns.map(col => formatFieldValue(customer, col.key)).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clienti-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!customers || customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-gray-500">Nessun cliente da visualizzare.</p>
        <Button onClick={handleNewCustomer}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Cliente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca clienti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">
            {filteredCustomers.length} clienti
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <ColumnSelector
            columns={columns}
            onColumnsChange={setColumns}
            tableName="customers-table"
          />
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          
          <DevFeature featureKey="customers.import">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-100 text-gray-500 border-gray-300 opacity-60"
              disabled
            >
              <Upload className="mr-2 h-4 w-4" />
              Importa
            </Button>
          </DevFeature>
          
          <DevFeature featureKey="customers.mssql_sync">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-100 text-gray-500 border-gray-300 opacity-60"
              disabled
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync MSSQL
            </Button>
          </DevFeature>
          
          <Button onClick={handleNewCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Cliente
          </Button>
        </div>
      </div>

      {/* Tabella */}
      <ScrollArea className="whitespace-nowrap rounded-md border" style={{ height: 'calc(100vh - 300px)' }}>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key} 
                  style={{ width: column.width }}
                  className="font-medium"
                >
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="w-[50px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-gray-50">
                {visibleColumns.map((column) => (
                  <TableCell key={column.key} className="py-2">
                    {formatFieldValue(customer, column.key)}
                  </TableCell>
                ))}
                <TableCell className="py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(customer)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(customer)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Form modale */}
      <CustomerForm
        customer={selectedCustomer}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setSelectedCustomer(undefined);
        }}
      />
    </div>
  );
}
