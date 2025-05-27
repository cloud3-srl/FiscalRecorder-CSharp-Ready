import { useState, useEffect } from "react"; // Aggiunto useEffect
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as schema from "@shared/schema";
import { z } from "zod";

// Schema per la validazione del form del magazzino
const warehouseFormSchema = schema.insertWarehouseSchema.extend({
  id: z.number().optional(), // Per la modifica
});
type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export default function WarehousesSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<schema.Warehouse | null>(null);

  const { data: warehouses = [], isLoading, error } = useQuery<schema.Warehouse[], Error>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/settings/warehouses');
      if (!response.ok) throw new Error('Errore nel recupero dei magazzini');
      return response.json();
    },
  });

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      code: "",
      name: "",
      address: "",
    },
  });

  // Effetto per popolare il form quando si modifica un magazzino esistente
  // Usa useEffect per effetti collaterali e reset del form
  useEffect(() => {
    if (editingWarehouse) {
      form.reset({
        id: editingWarehouse.id,
        code: editingWarehouse.code,
        name: editingWarehouse.name,
        address: editingWarehouse.address || "",
      });
    } else {
      form.reset({
        code: "",
        name: "",
        address: "",
      });
    }
  }, [editingWarehouse, form]); // Aggiunto 'form' alle dipendenze

  const { mutate: saveWarehouse, isPending: isSaving } = useMutation<schema.Warehouse, Error, WarehouseFormValues>({
    mutationFn: async (data) => {
      const method = data.id ? 'PATCH' : 'POST';
      const endpoint = data.id ? `/api/settings/warehouses/${data.id}` : '/api/settings/warehouses';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
        throw new Error(errorData.message || errorData.error || 'Impossibile salvare il magazzino');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: `Magazzino ${editingWarehouse ? 'aggiornato' : 'creato'} con successo.` });
      setIsFormDialogOpen(false);
      setEditingWarehouse(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Errore salvataggio magazzino", description: error.message, variant: "destructive" });
    },
  });

  const { mutate: deleteWarehouse, isPending: isDeleting } = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/settings/warehouses/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Errore sconosciuto' }));
        throw new Error(errorData.message || errorData.error || 'Impossibile eliminare il magazzino');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: "Magazzino eliminato con successo." });
    },
    onError: (error: Error) => {
      toast({ title: "Errore eliminazione magazzino", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenForm = (warehouse?: schema.Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      form.reset({
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address || "",
      });
    } else {
      setEditingWarehouse(null);
      form.reset({
        code: "",
        name: "",
        address: "",
      });
    }
    setIsFormDialogOpen(true);
  };

  const onSubmit = (data: WarehouseFormValues) => {
    saveWarehouse(data);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Sei sicuro di voler eliminare questo magazzino?")) {
      deleteWarehouse(id);
    }
  };

  if (isLoading) return <div className="p-6 flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" />Caricamento magazzini...</div>;
  if (error) return <div className="p-6 text-red-500">Errore nel caricamento dei magazzini: {error.message}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Gestione Magazzini</h1>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="h-4 w-4 mr-2" /> Aggiungi Magazzino
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Indirizzo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length > 0 ? (
              warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell>{warehouse.code}</TableCell>
                  <TableCell>{warehouse.name}</TableCell>
                  <TableCell>{warehouse.address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(warehouse)} title="Modifica">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(warehouse.id)} title="Elimina">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Nessun magazzino trovato.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setEditingWarehouse(null);
          form.reset();
        }
        setIsFormDialogOpen(isOpen);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Modifica Magazzino" : "Nuovo Magazzino"}</DialogTitle>
            <DialogDescription>
              {editingWarehouse ? "Modifica i dettagli del magazzino." : "Inserisci i dettagli per il nuovo magazzino."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Codice *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Indirizzo</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Annulla</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingWarehouse ? "Salva Modifiche" : "Crea Magazzino"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
