import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface VatRate {
  id: number;
  descrizione: string;
  valore: number;
}

function VatSettings() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVat, setEditingVat] = useState<VatRate | null>(null);
  const [descrizione, setDescrizione] = useState("");
  const [valore, setValore] = useState("");

  // Mock data
  const [vatRates, setVatRates] = useState<VatRate[]>([
    { id: 1, descrizione: "Esente", valore: 0 },
    { id: 2, descrizione: "Ridotta", valore: 4 },
    { id: 3, descrizione: "Ridotta", valore: 10 },
    { id: 4, descrizione: "Ordinaria", valore: 22 },
  ]);

  const handleOpenModal = (vat?: VatRate) => {
    if (vat) {
      setEditingVat(vat);
      setDescrizione(vat.descrizione);
      setValore(vat.valore.toString());
    } else {
      setEditingVat(null);
      setDescrizione("");
      setValore("");
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!descrizione || !valore) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    const newVat: VatRate = {
      id: editingVat?.id || Date.now(),
      descrizione,
      valore: parseFloat(valore),
    };

    if (editingVat) {
      setVatRates(prev => prev.map(v => v.id === editingVat.id ? newVat : v));
      toast({
        title: "Aliquota aggiornata",
        description: "L'aliquota IVA è stata modificata con successo.",
      });
    } else {
      setVatRates(prev => [...prev, newVat]);
      toast({
        title: "Aliquota aggiunta",
        description: "La nuova aliquota IVA è stata creata con successo.",
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    setVatRates(prev => prev.filter(v => v.id !== id));
    toast({
      title: "Aliquota eliminata",
      description: "L'aliquota IVA è stata rimossa con successo.",
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Aliquote IVA</h1>
        <p className="text-muted-foreground">
          Gestisci le aliquote IVA utilizzate nei prodotti
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista Aliquote IVA</CardTitle>
              <CardDescription>
                Configura le aliquote IVA disponibili per i tuoi prodotti
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Nuova Aliquota IVA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrizione</TableHead>
                <TableHead>Valore %</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vatRates.map((vat) => (
                <TableRow key={vat.id}>
                  <TableCell className="font-medium">{vat.descrizione}</TableCell>
                  <TableCell>{vat.valore}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(vat)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(vat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal per aggiungere/modificare aliquota */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVat ? "Modifica Aliquota IVA" : "Nuova Aliquota IVA"}
            </DialogTitle>
            <DialogDescription>
              {editingVat 
                ? "Modifica i dati dell'aliquota IVA" 
                : "Inserisci i dati per la nuova aliquota IVA"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione *</Label>
              <Input
                id="descrizione"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Es. Ordinaria, Ridotta, Esente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valore">Valore % *</Label>
              <Input
                id="valore"
                type="number"
                value={valore}
                onChange={(e) => setValore(e.target.value)}
                placeholder="Es. 22"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VatSettings;
