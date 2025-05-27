import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Palette } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  id: number;
  descrizione: string;
  aliquotaIva: string;
  preferito: boolean;
  colore: string;
}

function DepartmentsSettings() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Mock data
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, descrizione: "Alimentari", aliquotaIva: "4%", preferito: true, colore: "#22c55e" },
    { id: 2, descrizione: "Bevande", aliquotaIva: "22%", preferito: false, colore: "#3b82f6" },
    { id: 3, descrizione: "Abbigliamento", aliquotaIva: "22%", preferito: false, colore: "#f59e0b" },
  ]);

  const handleOpenModal = (dept?: Department) => {
    setEditingDept(dept || null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    toast({
      title: editingDept ? "Reparto aggiornato" : "Reparto aggiunto",
      description: editingDept 
        ? "Il reparto è stato modificato con successo." 
        : "Il nuovo reparto è stato creato con successo.",
    });
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    toast({
      title: "Reparto eliminato",
      description: "Il reparto è stato rimosso con successo.",
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Reparti</h1>
        </div>
        <p className="text-sm text-gray-500 font-medium" style={{ 
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          Gestisci i reparti utilizzati per organizzare i prodotti
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista Reparti</CardTitle>
              <CardDescription style={{ 
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                Configura i reparti per categorizzare i tuoi prodotti
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Nuovo Reparto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrizione</TableHead>
                <TableHead>Aliquota IVA</TableHead>
                <TableHead>Preferito</TableHead>
                <TableHead>Colore</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.descrizione}</TableCell>
                  <TableCell>{dept.aliquotaIva}</TableCell>
                  <TableCell>
                    {dept.preferito && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  </TableCell>
                  <TableCell>
                    <div 
                      className="w-6 h-6 rounded" 
                      style={{ backgroundColor: dept.colore }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(dept)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dept.id)}
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

      {/* Modal per aggiungere/modificare reparto */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDept ? "Modifica Reparto" : "Nuovo Reparto"}
            </DialogTitle>
            <DialogDescription>
              {editingDept 
                ? "Modifica i dati del reparto" 
                : "Inserisci i dati per il nuovo reparto"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrizione *</Label>
              <Input placeholder="Nome del reparto" />
            </div>
            <div className="space-y-2">
              <Label>Descrizione sui bottoni *</Label>
              <Input placeholder="Testo sui pulsanti POS" />
            </div>
            <div className="space-y-2">
              <Label>Descrizione sullo scontrino *</Label>
              <Input placeholder="Testo che appare sullo scontrino" />
            </div>
            <div className="space-y-2">
              <Label>Aliquota IVA *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona aliquota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Esente (0%)</SelectItem>
                  <SelectItem value="4">Ridotta (4%)</SelectItem>
                  <SelectItem value="10">Ridotta (10%)</SelectItem>
                  <SelectItem value="22">Ordinaria (22%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Colore *</Label>
              <Input type="color" defaultValue="#3b82f6" />
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

export default DepartmentsSettings;
