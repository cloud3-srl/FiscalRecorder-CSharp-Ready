import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import * as schema from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateCustomer } from "@/lib/validation";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useOffline } from "@/hooks/use-offline";

interface CustomerFormProps {
  customer?: schema.Customer;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  code: string;
  name: string;
  fiscalCode: string;
  vatNumber: string;
  address: string;
  city: string;
  province: string;
  country: string;
  sdiCode: string;
  paymentCode: string;
  email: string;
  phone: string;
  notes: string;
  points: number;
}

interface DuplicateCheck {
  field: string;
  value: string;
  existingCustomer: schema.Customer;
}

const ITALIAN_PROVINCES = [
  'AG', 'AL', 'AN', 'AO', 'AR', 'AP', 'AT', 'AV', 'BA', 'BT', 'BL', 'BN', 'BG', 'BI', 'BO', 'BZ', 'BS', 'BR', 'CA', 'CL', 'CB', 'CI', 'CE', 'CT', 'CZ', 'CH', 'CO', 'CS', 'CR', 'KR', 'CN', 'EN', 'FM', 'FE', 'FI', 'FG', 'FC', 'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'SP', 'AQ', 'LT', 'LE', 'LC', 'LI', 'LO', 'LU', 'MC', 'MN', 'MS', 'MT', 'VS', 'ME', 'MI', 'MO', 'MB', 'NA', 'NO', 'NU', 'OG', 'OT', 'OR', 'PD', 'PA', 'PR', 'PV', 'PG', 'PU', 'PE', 'PC', 'PI', 'PT', 'PN', 'PZ', 'PO', 'RG', 'RA', 'RC', 'RE', 'RI', 'RN', 'RM', 'RO', 'SA', 'SS', 'SV', 'SI', 'SR', 'SO', 'TA', 'TE', 'TR', 'TO', 'TP', 'TN', 'TV', 'TS', 'UD', 'VA', 'VE', 'VB', 'VC', 'VR', 'VV', 'VI', 'VT'
];

export default function CustomerForm({ customer, isOpen, onOpenChange, onSuccess }: CustomerFormProps) {
  const { isOffline } = useOffline();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    fiscalCode: '',
    vatNumber: '',
    address: '',
    city: '',
    province: '',
    country: 'Italia',
    sdiCode: '',
    paymentCode: '',
    email: '',
    phone: '',
    notes: '',
    points: 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [duplicates, setDuplicates] = useState<DuplicateCheck[]>([]);

  // Carica dati del cliente per la modifica
  useEffect(() => {
    if (customer) {
      setFormData({
        code: customer.code || '',
        name: customer.name || '',
        fiscalCode: customer.fiscalCode || '',
        vatNumber: customer.vatNumber || '',
        address: customer.address || '',
        city: customer.city || '',
        province: customer.province || '',
        country: customer.country || 'Italia',
        sdiCode: customer.sdiCode || '',
        paymentCode: customer.paymentCode || '',
        email: customer.email || '',
        phone: customer.phone || '',
        notes: customer.notes || '',
        points: customer.points || 0,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        fiscalCode: '',
        vatNumber: '',
        address: '',
        city: '',
        province: '',
        country: 'Italia',
        sdiCode: '',
        paymentCode: '',
        email: '',
        phone: '',
        notes: '',
        points: 0,
      });
    }
    setErrors({});
    setDuplicates([]);
  }, [customer, isOpen]);

  // Controllo duplicati
  const { data: existingCustomers } = useQuery<schema.Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      return response.json();
    },
    enabled: isOpen,
  });

  // Mutation per creazione/aggiornamento
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Rimuovi errore se presente
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const checkForDuplicates = () => {
    if (!existingCustomers) return [];
    
    const duplicateChecks: DuplicateCheck[] = [];
    
    existingCustomers.forEach(existing => {
      // Escludi il cliente corrente se in modifica
      if (customer && existing.id === customer.id) return;
      
      // Controllo codice cliente
      if (formData.code && existing.code === formData.code) {
        duplicateChecks.push({
          field: 'code',
          value: formData.code,
          existingCustomer: existing
        });
      }
      
      // Controllo codice fiscale
      if (formData.fiscalCode && existing.fiscalCode === formData.fiscalCode.toUpperCase()) {
        duplicateChecks.push({
          field: 'fiscalCode',
          value: formData.fiscalCode,
          existingCustomer: existing
        });
      }
      
      // Controllo partita IVA
      if (formData.vatNumber && existing.vatNumber === formData.vatNumber) {
        duplicateChecks.push({
          field: 'vatNumber',
          value: formData.vatNumber,
          existingCustomer: existing
        });
      }
      
      // Controllo email
      if (formData.email && existing.email === formData.email.toLowerCase()) {
        duplicateChecks.push({
          field: 'email',
          value: formData.email,
          existingCustomer: existing
        });
      }
    });
    
    return duplicateChecks;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione campi
    const validationErrors = validateCustomer(formData);
    
    // Controllo duplicati
    const duplicateChecks = checkForDuplicates();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    if (duplicateChecks.length > 0) {
      setDuplicates(duplicateChecks);
      return;
    }
    
    // Procedi con il salvataggio
    mutation.mutate(formData);
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      code: 'Codice Cliente',
      fiscalCode: 'Codice Fiscale',
      vatNumber: 'Partita IVA',
      email: 'Email'
    };
    return labels[field] || field;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {customer 
              ? 'Modifica i dati del cliente selezionato' 
              : 'Inserisci i dati del nuovo cliente'
            }
            {isOffline && (
              <div className="mt-2 text-orange-600 text-sm">
                ⚠️ Modalità offline: le modifiche saranno sincronizzate alla riconnessione
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Avvisi duplicati */}
        {duplicates.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-2">Attenzione: Duplicati rilevati</div>
              {duplicates.map((duplicate, index) => (
                <div key={index} className="text-sm">
                  • {getFieldLabel(duplicate.field)}: "{duplicate.value}" già assegnato a "{duplicate.existingCustomer.name}"
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Codice Cliente */}
            <div>
              <Label htmlFor="code">Codice Cliente</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Opzionale"
              />
              {errors.code && <div className="text-red-500 text-sm mt-1">{errors.code}</div>}
            </div>

            {/* Ragione Sociale */}
            <div>
              <Label htmlFor="name">Ragione Sociale *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome o ragione sociale"
                required
              />
              {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Codice Fiscale */}
            <div>
              <Label htmlFor="fiscalCode">Codice Fiscale</Label>
              <Input
                id="fiscalCode"
                value={formData.fiscalCode}
                onChange={(e) => handleInputChange('fiscalCode', e.target.value.toUpperCase())}
                placeholder="16 caratteri"
                maxLength={16}
              />
              {errors.fiscalCode && <div className="text-red-500 text-sm mt-1">{errors.fiscalCode}</div>}
            </div>

            {/* Partita IVA */}
            <div>
              <Label htmlFor="vatNumber">Partita IVA</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="11 cifre"
                maxLength={11}
              />
              {errors.vatNumber && <div className="text-red-500 text-sm mt-1">{errors.vatNumber}</div>}
            </div>
          </div>

          {/* Indirizzo */}
          <div>
            <Label htmlFor="address">Indirizzo</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Via, numero civico"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Città */}
            <div>
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Città"
              />
            </div>

            {/* Provincia */}
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  {ITALIAN_PROVINCES.map(prov => (
                    <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paese */}
            <div>
              <Label htmlFor="country">Paese</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Italia"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Codice SDI */}
            <div>
              <Label htmlFor="sdiCode">Codice SDI/PEC</Label>
              <Input
                id="sdiCode"
                value={formData.sdiCode}
                onChange={(e) => handleInputChange('sdiCode', e.target.value.toUpperCase())}
                placeholder="7 caratteri"
                maxLength={7}
              />
              {errors.sdiCode && <div className="text-red-500 text-sm mt-1">{errors.sdiCode}</div>}
            </div>

            {/* Codice Pagamento */}
            <div>
              <Label htmlFor="paymentCode">Codice Pagamento</Label>
              <Input
                id="paymentCode"
                value={formData.paymentCode}
                onChange={(e) => handleInputChange('paymentCode', e.target.value)}
                placeholder="Codice metodo pagamento"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                placeholder="email@esempio.it"
              />
              {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
            </div>

            {/* Telefono */}
            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+39 123 456 7890"
              />
              {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
            </div>
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Note aggiuntive..."
              rows={3}
            />
          </div>

          {/* Punti fedeltà */}
          <div>
            <Label htmlFor="points">Punti Fedeltà</Label>
            <Input
              id="points"
              type="number"
              value={formData.points}
              onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || duplicates.length > 0}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customer ? 'Aggiorna' : 'Crea'} Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
