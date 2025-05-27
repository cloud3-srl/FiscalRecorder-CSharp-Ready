# 🗄️ FASE 2: INTEGRAZIONE DATABASE MSSQL (AD HOC REVOLUTION)

## 🎯 OBIETTIVO
Implementare connessione bidirezionale con database MSSQL esterno, importando prodotti, clienti, pagamenti e dati azienda con tutti i campi necessari.

## 🔗 CONFIGURAZIONE DATABASE

### 2.1 Tabelle Target MSSQL
```sql
-- Prodotti: C3EXPOS (nome configurabile)
-- Clienti: SCARLCONTI (pattern configurabile) 
-- Pagamenti: SCARLPAG_AMEN (nome configurabile)
-- Azienda: azienda (nome configurabile)
-- Codice Azienda: SCARL o CUTRERA (configurabile)
```

### 2.2 Credenziali Test
```typescript
// Password MSSQL: "Nuvola3" (senza punto esclamativo)
// Server: host configurabile
// Database: nome configurabile
```

## 📊 SCHEMA PRODOTTI ESTESO

### 2.3 Campi da Importare
```typescript
// File: server/mssql.ts - funzione importProductsFromExternalDb
interface ProductImport {
  // Campi esistenti (GIÀ IMPLEMENTATI)
  EACODART: string;     // code
  EADESART: string;     // name, description  
  EAPREZZO: number;     // price
  EACODLIS: string;     // listCode
  EA__DATA: Date;       // activationDate
  EAUNIMIS: string;     // unitOfMeasure
  cpccchk: string;      // controlFlag
  EASCONT1: number;     // discount1
  EASCONT2: number;     // discount2
  EASCONT3: number;     // discount3
  EASCONT4: number;     // discount4
  EACODFAM: string;     // category
  
  // Campi NUOVI da aggiungere
  EACODBAR: string;     // barcode
  EAPERIVA: number;     // vatRate
  EACODREP: string;     // departmentCode
  EADESFAM: string;     // familyDescription
  EACATOMO: string;     // homogeneousCategory
  EADESOMO: string;     // homogeneousCategoryDescription
  EAFLOTT: boolean;     // lotFlag (1=true, 0=false)
}
```

### 2.4 Schema Locale da Estendere
```sql
-- File: Nuova migrazione database
ALTER TABLE products ADD COLUMN barcode VARCHAR(255);
ALTER TABLE products ADD COLUMN vatRate DECIMAL(5,2);
ALTER TABLE products ADD COLUMN departmentCode VARCHAR(50);
ALTER TABLE products ADD COLUMN familyDescription VARCHAR(255);
ALTER TABLE products ADD COLUMN homogeneousCategory VARCHAR(50);
ALTER TABLE products ADD COLUMN homogeneousCategoryDescription VARCHAR(255);
ALTER TABLE products ADD COLUMN lotFlag BOOLEAN DEFAULT FALSE;
```

## 🔄 CONFIGURAZIONE DINAMICA

### 2.5 Nomi Tabelle Configurabili
```typescript
// File: server/mssql.ts
const tableNames = {
  products: config.productTableName || 'C3EXPOS',
  customers: config.customerTablePattern || 'SCARLCONTI', 
  payments: config.paymentTableName || 'SCARLPAG_AMEN',
  company: config.companyTableName || 'azienda'
};

const companyCode = config.companyCode || 'SCARL';
```

### 2.6 Query Dinamiche  
```sql
-- Query Prodotti (con TUTTI i nuovi campi)
SELECT 
  EACODART, EADESART, EAPREZZO, EACODLIS, EA__DATA, EAUNIMIS,
  cpccchk, EASCONT1, EASCONT2, EASCONT3, EASCONT4, EACODFAM,
  EACODBAR, EAPERIVA, EACODREP, EADESFAM, EACATOMO, EADESOMO, EAFLOTT,
  EACODAZI, EAIMPPOS
FROM ${tableNames.products}
WHERE EACODAZI = '${companyCode}' 
  AND EAIMPPOS = 1
  AND EACODART IS NOT NULL
  AND TRIM(EACODART) != ''
ORDER BY EACODART;

-- Query Clienti
SELECT ANCODICE, ANDESCRI, ANPARIVA, ANCODFIS, ANCODEST, 
       ANINDIRI, ANLOCALI, ANPROVIN, ANNAZION, ANCODPAG
FROM ${tableNames.customers} 
WHERE ANTIPCON = 'C'
ORDER BY ANCODICE;

-- Query Pagamenti  
SELECT PACODICE, PADESCRI  -- NOTA: PACODICE non PACOD
FROM ${tableNames.payments}
ORDER BY PACODICE;

-- Query Azienda
SELECT AZRAGAZI, AZINDAZI, AZLOCAZI, AZCAPAZI, AZPROAZI,
       AZCODNAZ, AZCOFAZI, AZIVAAZI
FROM ${tableNames.company} 
WHERE azcodazi = '${companyCode}';
```

## 🔧 IMPLEMENTAZIONE BACKEND

### 2.7 Mapping Funzioni
```typescript
// File: server/mssql.ts
function mapProductFields(row: any): Product {
  return {
    // Mapping esistenti...
    code: row.EACODART?.trim() || '',
    name: row.EADESART?.trim() || '',
    price: parseFloat(row.EAPREZZO) || 0,
    // ... altri campi esistenti
    
    // NUOVI mapping
    barcode: row.EACODBAR?.trim() || null,
    vatRate: parseFloat(row.EAPERIVA) || null,
    departmentCode: row.EACODREP?.trim() || null,
    familyDescription: row.EADESFAM?.trim() || null,
    homogeneousCategory: row.EACATOMO?.trim() || null,
    homogeneousCategoryDescription: row.EADESOMO?.trim() || null,
    lotFlag: Boolean(row.EAFLOTT) || false  // Gestire 1/0 → true/false
  };
}
```

## 🌐 API ENDPOINTS

### 2.8 Sincronizzazione
```typescript
// Endpoint esistenti da verificare/estendere
POST /api/admin/sync/products-now
POST /api/admin/sync/customers-now  
POST /api/admin/sync/payments-now
POST /api/admin/sync/company-now    // Nuovo

// Parametri body
{
  companyCode: string,
  tableNames?: {
    products: string,
    customers: string,
    payments: string,
    company: string
  }
}
```

## 🔍 RICERCA BARCODE

### 2.9 Implementazione Frontend
```typescript
// File: client/src/pages/admin/index.tsx (Gestione Prodotti)
// File: client/src/pages/pos/index.tsx (Ricerca POS)
// AGGIUNGERE: Ricerca per barcode in tutti i campi di ricerca articoli
// LOGICA: Controllare campo 'barcode' oltre a 'code' e 'name'
```

## 📋 VALIDAZIONE

### 2.10 Test Critici
- [ ] Tutti i nuovi campi importati correttamente
- [ ] Campo lotFlag = true quando EAFLOTT = 1
- [ ] Ricerca barcode funzionante
- [ ] Configurazione tabelle dinamica
- [ ] Gestione errori connessione MSSQL
- [ ] Fallback offline robusto

## 🚨 PROBLEMI NOTI DA RISOLVERE
1. **EAFLOTT Mapping**: Assicurarsi che 1 → true, 0 → false
2. **Nome Colonna**: PACODICE non PACOD per pagamenti  
3. **NULL Handling**: Gestire campi vuoti appropriatamente
4. **Encoding**: Caratteri speciali in nomi/descrizioni

## 🔄 ORDINE IMPLEMENTAZIONE
1. ✅ Schema database locale (migrazione)
2. ✅ Mapping funzioni backend  
3. ✅ Query MSSQL estese
4. ✅ Test import con dati reali
5. ✅ Frontend ricerca barcode
6. ✅ Validazione campi lotto