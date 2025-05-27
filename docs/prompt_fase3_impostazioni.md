# ⚙️ FASE 3: SISTEMA IMPOSTAZIONI COMPLETO

## 🎯 OBIETTIVO
Implementare sistema di impostazioni completo con menu gerarchico, pagine dedicate e integrazione dati MSSQL per configurazione completa del POS.

## 📁 STRUTTURA MENU IMPOSTAZIONI

### 3.1 Architettura Principale
```typescript
// File: client/src/pages/settings/index.tsx
const navGroups = [
  {
    title: "Configurazione Base",
    items: [
      { id: "company", label: "1. Ragione Sociale", icon: "Building" },
      { id: "vat-rates", label: "2. % Aliquote IVA", icon: "Percent" },
      { id: "departments", label: "3. Reparti", icon: "Grid3X3" },
      { id: "products", label: "4. Prodotti", icon: "Package" },
      { id: "categories", label: "5. Categorie", icon: "Tags" },
      { id: "sales-modes", label: "6. Modalità di vendita", icon: "ShoppingCart" }
    ]
  },
  {
    title: "Hardware e Periferiche", 
    items: [
      { id: "printers", label: "7. Stampanti", icon: "Printer" },
      { id: "barcode-readers", label: "8. Lettori barcode", icon: "Scan" }, // SALTARE
      { id: "customer-display", label: "9. Display cliente", icon: "Monitor" }, // SALTARE
    ]
  },
  {
    title: "Gestione Operativa",
    items: [
      { id: "payments", label: "10. $ Pagamenti", icon: "CreditCard" },
      { id: "roles", label: "11. Ruoli", icon: "Shield" },
      { id: "operators", label: "12. Operatori", icon: "Users" },
      { id: "documents", label: "13. Documenti", icon: "FileText" },
    ]
  },
  {
    title: "Avanzate",
    items: [
      { id: "orders", label: "14. Ordini", icon: "ClipboardList" }, // SALTARE
      { id: "general", label: "15. Generali", icon: "Settings" }
    ]
  }
];
```

## 🏢 PAGINE SPECIFICHE

### 3.2 Ragione Sociale (PRIORITÀ ALTA)
```typescript
// File: client/src/pages/settings/company/index.tsx
// FONTE DATI: Query MSSQL azienda WHERE azcodazi = companyCode
interface CompanyData {
  businessName: string;    // AZRAGAZI
  address: string;         // AZINDAZI  
  city: string;           // AZLOCAZI
  zipCode: string;        // AZCAPAZI
  province: string;       // AZPROAZI
  countryCode: string;    // AZCODNAZ
  fiscalCode: string;     // AZCOFAZI
  vatNumber: string;      // AZIVAAZI
}

// API: GET/POST /api/settings/company
// Popolamento automatico da MSSQL + possibilità modifica locale
```

### 3.3 Reparti (IMPLEMENTARE)
```typescript
// File: client/src/pages/settings/departments/index.tsx  
interface Department {
  id: string;
  code: string;               // EACODREP da MSSQL
  name: string;              // Nome reparto
  description: string;       // Descrizione sui bottoni
  receiptDescription: string; // Descrizione sullo scontrino
  vatRateId: string;         // Aliquota IVA default
  salesType: string;         // Tipologia di vendita
  amountLimit: number;       // Limite importo
  color: string;             // Colore hex per UI
  isFavorite: boolean;       // Preferito checkbox
}

// UI: Form con tutti i campi + tabella esistenti
// Sincronizzazione: Import da EACODREP + gestione locale
```

### 3.4 Prodotti (RIUTILIZZA ESISTENTE)
```typescript
// File: Redirect a client/src/pages/admin/index.tsx
// NESSUNA MODIFICA: Riutilizzare pagina "Gestione Prodotti" esistente
// AGGIUNGERE: Link diretto da menu impostazioni
```

### 3.5 Ruoli (PREDEFINITI)
```typescript
// File: client/src/pages/settings/roles/index.tsx
const DEFAULT_ROLES = [
  {
    id: "admin",
    name: "Amministratore", 
    permissions: ["*"], // Tutti i permessi
    description: "Accesso completo a tutte le funzionalità"
  },
  {
    id: "operator", 
    name: "Operatore",
    permissions: ["pos", "customers"], // Solo POS e Clienti
    description: "Accesso limitato a POS e anagrafica clienti"
  }
];

// BLOCCARE: Accesso menu Impostazioni per ruolo Operatore
// LOGICA: Controllo permessi in navigation
```

### 3.6 Operatori
```typescript
// File: client/src/pages/settings/operators/index.tsx
interface Operator {
  id: string;
  username: string;
  name: string;
  email: string;
  roleId: string;        // Link a ruoli
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

// RISOLVERE: Errori API esistenti
// "Errore: Impossibile recuperare gli operatori"
// "Errore: Impossibile recuperare i ruoli"
```

### 3.7 Documenti (TOGGLE CONFIGURATION)
```typescript
// File: client/src/pages/settings/documents/index.tsx
// UI: Serie di toggle per configurazioni stampa
interface DocumentSettings {
  // Scontrino
  defaultPrinter: string;
  printVatDetails: boolean;
  printDeferredPaymentReceipt: boolean; 
  courtesyPhrase: string;
  
  // Fattura  
  invoiceDefaultPrinter: string;
  invoiceCourtesyPhrase: string;
  
  // Conto
  enableCardPayments: boolean;
  accountDefaultPrinter: string;
  printHeader: boolean;
  accountCourtesyPhrase: string;
  
  // Altri toggle vari per configurazioni stampa
}

// RIFERIMENTO: Screenshot forniti dall'utente con layout toggle
```

## 🎨 STYLING E LAYOUT

### 3.8 Consistency con Template
```typescript
// APPLICARE: Stile WowDash a tutte le pagine impostazioni
// UNIFORMARE: Menu laterale identico a menu principale
// LOGO: Dimensioni uguali tra main e settings
// RIMUOVERE: "Banda sopra linea rosa" in header
// RIMUOVERE: Divider orizzontale superfluo
```

### 3.9 Navigazione  
```typescript
// File: client/src/pages/settings/index.tsx
// LAYOUT: Sidebar sinistra + contenuto principale
// EVIDENZIAZIONE: Item attivo nel menu
// BREADCRUMB: Indicatore posizione corrente
// RESPONSIVE: Comportamento mobile-friendly
```

## 🔗 INTEGRAZIONI API

### 3.10 Endpoint Backend
```typescript
// Schema API per ogni sezione
GET/POST /api/settings/company      // Ragione sociale
GET/POST /api/settings/departments  // Reparti
GET/POST /api/settings/roles        // Ruoli  
GET/POST /api/settings/operators    // Operatori
GET/POST /api/settings/documents    // Configurazioni documenti
GET/POST /api/settings/general      // Impostazioni generali

// Import da MSSQL
POST /api/settings/sync/departments  // Sincronizza reparti
POST /api/settings/sync/vat-rates   // Sincronizza aliquote IVA
```

### 3.11 Persistenza Database
```sql
-- Nuove tabelle necessarie
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  receipt_description TEXT,
  vat_rate_id UUID REFERENCES vat_rates(id),
  sales_type VARCHAR(100),
  amount_limit DECIMAL(10,2),
  color VARCHAR(7), -- Hex color
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_settings (
  id UUID PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estendere tabelle esistenti se necessario
```

## 📋 SEZIONI DA SALTARE (TEMPORANEAMENTE)

### 3.12 Non Implementare Ora
- **% Aliquote IVA**: Importazione da MSSQL in seguito
- **Lettori barcode**: Hardware specifico
- **Display cliente**: Periferica esterna  
- **$ Pagamenti**: Già implementato in import MSSQL
- **Ordini**: Funzionalità avanzata per dopo

## 🔧 ORDINE IMPLEMENTAZIONE

### 3.13 Sprint Consigliato
1. ✅ **Menu Navigation**: Struttura base e routing
2. ✅ **Ragione Sociale**: Prima pagina con dati MSSQL
3. ✅ **Reparti**: Form completo + gestione locale
4. ✅ **Ruoli**: Sistema predefinito Admin/Operatore
5. ✅ **Operatori**: Fix errori API esistenti
6. ✅ **Documenti**: Toggle configurations layout
7. ✅ **Styling**: Applicazione WowDash consistente

## 📋 VALIDAZIONE

### 3.14 Test Checklist
- [ ] Menu navigazione fluida
- [ ] Ragione sociale popolata da MSSQL
- [ ] Reparti creazione/modifica/eliminazione
- [ ] Ruoli predefiniti funzionanti
- [ ] Operatori senza errori API
- [ ] Documenti toggle persistenti
- [ ] Stile consistente con template
- [ ] Responsive su mobile/tablet

## 🚨 NOTE CRITICHE
- **Logo Issue**: Problema salvataggio logo noto, sospendere per ora
- **Permission Logic**: Implementare controllo accessi per Operatori
- **Data Migration**: Schema changes require careful migration
- **MSSQL Sync**: Alcuni dati da import, altri gestione locale