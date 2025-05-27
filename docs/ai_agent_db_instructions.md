# Istruzioni per Agente AI - Importazione Dati Database MSSQL

## Obiettivo
Implementare un sistema di importazione dati da database MSSQL esterno per applicazione POS, con configurazione dinamica dei nomi delle tabelle.

## Configurazione Dinamica delle Tabelle

### 1. Variabili di Configurazione
Crea le seguenti variabili che dovranno essere lette dalla configurazione attiva del database:

```typescript
// Variabili da leggere dalla configurazione attiva
const tableNames = {
  products: config.productTableName || 'C3EXPOS',
  customers: config.customerTablePattern || 'SCARLCONTI', 
  payments: config.paymentTableName || 'SCARLPAG_AMEN',
  company: config.companyTableName || 'azienda'
};

const companyCode = config.companyCode || 'SCARL';
```

### 2. Costruzione Query Dinamiche
Utilizza template string per costruire le query con i nomi delle tabelle dinamici:

## Query da Implementare

### A. Query Prodotti
```sql
SELECT 
    -- Campi già mappati nella funzione esistente
    EACODART,           -- code
    EADESART,           -- name, description
    EAPREZZO,           -- price
    EACODLIS,           -- listCode
    EA__DATA,           -- activationDate
    EAUNIMIS,           -- unitOfMeasure
    cpccchk,            -- controlFlag
    EASCONT1,           -- discount1
    EASCONT2,           -- discount2
    EASCONT3,           -- discount3
    EASCONT4,           -- discount4
    EACODFAM,           -- category
    
    -- Campi aggiuntivi non attualmente mappati
    EACODBAR,           -- Codice a barre (barcode)
    EAPERIVA,           -- Aliquota IVA (VAT rate)
    EACODREP,           -- Codice Reparto (department code)
    EADESFAM,           -- Descrizione Famiglia (family description)
    EACATOMO,           -- Categoria Omogenea (homogeneous category)
    EADESOMO,           -- Descrizione Categoria Omogenea (homogeneous category description)
    EAFLOTT,            -- Flag Lotto (lot flag)
    
    -- Campi usati per filtri
    EACODAZI,           -- Codice Azienda (company code)
    EAIMPPOS            -- Flag POS (POS flag)

FROM ${tableNames.products}
WHERE 
    EACODAZI = '${companyCode}' 
    AND EAIMPPOS = 1
    AND EACODART IS NOT NULL
    AND TRIM(EACODART) != ''
ORDER BY EACODART;
```

### B. Query Clienti
```sql
SELECT 
    ANCODICE,           -- Codice cliente
    ANDESCRI,           -- Descrizione/Nome cliente
    ANPARIVA,           -- Partita IVA
    ANCODFIS,           -- Codice Fiscale
    ANCODEST,           -- Codice Estero
    ANINDIRI,           -- Indirizzo
    ANLOCALI,           -- Località
    ANPROVIN,           -- Provincia
    ANNAZION,           -- Nazione
    ANCODPAG            -- Codice Pagamento

FROM ${tableNames.customers} 
WHERE ANTIPCON = 'C'
ORDER BY ANCODICE;
```

### C. Query Metodi di Pagamento
```sql
SELECT 
    PACOD,              -- Codice pagamento
    PADESCRI            -- Descrizione pagamento

FROM ${tableNames.payments}
ORDER BY PACOD;
```

### D. Query Dati Azienda
```sql
SELECT 
    AZRAGAZI,           -- Ragione Sociale
    AZINDAZI,           -- Indirizzo
    AZLOCAZI,           -- Località
    AZCAPAZI,           -- CAP
    AZPROAZI,           -- Provincia
    AZCODNAZ,           -- Codice Nazione
    AZCOFAZI,           -- Codice Fiscale
    AZIVAAZI            -- Partita IVA

FROM ${tableNames.company} 
WHERE azcodazi = '${companyCode}';
```

## Implementazione Funzioni di Importazione

### 1. Funzione Base per Configurazione
```typescript
async function getActiveTableConfiguration(): Promise<TableConfig> {
  // Recupera configurazione attiva dal database
  const config = await getActiveDatabaseConfig();
  
  return {
    productTableName: config.productTableName || 'C3EXPOS',
    customerTablePattern: config.customerTablePattern || 'SCARLCONTI',
    paymentTableName: config.paymentTableName || 'SCARLPAG_AMEN',
    companyTableName: config.companyTableName || 'azienda',
    companyCode: config.companyCode || 'SCARL'
  };
}
```

### 2. Mappatura Campi Prodotti
```typescript
function mapProductFields(row: any): Product {
  return {
    // Campi esistenti
    code: row.EACODART?.trim() || '',
    name: row.EADESART?.trim() || '',
    description: row.EADESART?.trim() || '',
    price: parseFloat(row.EAPREZZO) || 0,
    listCode: row.EACODLIS?.trim() || '',
    activationDate: row.EA__DATA || new Date(),
    unitOfMeasure: row.EAUNIMIS?.trim() || '',
    controlFlag: row.cpccchk?.trim() || '',
    discount1: parseFloat(row.EASCONT1) || 0,
    discount2: parseFloat(row.EASCONT2) || 0,
    discount3: parseFloat(row.EASCONT3) || 0,
    discount4: parseFloat(row.EASCONT4) || 0,
    category: row.EACODFAM?.trim() || '',
    
    // Nuovi campi
    barcode: row.EACODBAR?.trim() || null,
    vatRate: parseFloat(row.EAPERIVA) || null,
    departmentCode: row.EACODREP?.trim() || null,
    familyDescription: row.EADESFAM?.trim() || null,
    homogeneousCategory: row.EACATOMO?.trim() || null,
    homogeneousCategoryDescription: row.EADESOMO?.trim() || null,
    lotFlag: Boolean(row.EAFLOTT) || false
  };
}
```

### 3. Mappatura Campi Clienti
```typescript
function mapCustomerFields(row: any): Customer {
  return {
    code: row.ANCODICE?.trim() || '',
    name: row.ANDESCRI?.trim() || '',
    vatNumber: row.ANPARIVA?.trim() || null,
    fiscalCode: row.ANCODFIS?.trim() || null,
    foreignCode: row.ANCODEST?.trim() || null,
    address: row.ANINDIRI?.trim() || null,
    city: row.ANLOCALI?.trim() || null,
    province: row.ANPROVIN?.trim() || null,
    country: row.ANNAZION?.trim() || null,
    paymentCode: row.ANCODPAG?.trim() || null
  };
}
```

### 4. Mappatura Metodi di Pagamento
```typescript
function mapPaymentFields(row: any): PaymentMethod {
  return {
    code: row.PACOD?.trim() || '',
    description: row.PADESCRI?.trim() || ''
  };
}
```

### 5. Mappatura Dati Azienda
```typescript
function mapCompanyFields(row: any): Company {
  return {
    businessName: row.AZRAGAZI?.trim() || '',
    address: row.AZINDAZI?.trim() || '',
    city: row.AZLOCAZI?.trim() || '',
    zipCode: row.AZCAPAZI?.trim() || '',
    province: row.AZPROAZI?.trim() || '',
    countryCode: row.AZCODNAZ?.trim() || '',
    fiscalCode: row.AZCOFAZI?.trim() || '',
    vatNumber: row.AZIVAAZI?.trim() || ''
  };
}
```

## Gestione Errori e Validazione

### 1. Validazione Configurazione
```typescript
function validateTableConfiguration(config: TableConfig): boolean {
  const requiredFields = ['productTableName', 'customerTablePattern', 'paymentTableName', 'companyTableName', 'companyCode'];
  
  return requiredFields.every(field => 
    config[field] && config[field].trim().length > 0
  );
}
```

### 2. Gestione Errori Query
```typescript
async function executeQueryWithErrorHandling(query: string, tableName: string): Promise<any[]> {
  try {
    const result = await executeMssqlQuery(query);
    console.log(`Successfully imported from ${tableName}: ${result.length} records`);
    return result;
  } catch (error) {
    console.error(`Error importing from ${tableName}:`, error);
    throw new Error(`Failed to import data from table ${tableName}: ${error.message}`);
  }
}
```

## Schema Database Locale da Aggiornare

### Tabella Products - Nuove Colonne
```sql
ALTER TABLE products ADD COLUMN barcode VARCHAR(255);
ALTER TABLE products ADD COLUMN vatRate DECIMAL(5,2);
ALTER TABLE products ADD COLUMN departmentCode VARCHAR(50);
ALTER TABLE products ADD COLUMN familyDescription VARCHAR(255);
ALTER TABLE products ADD COLUMN homogeneousCategory VARCHAR(50);
ALTER TABLE products ADD COLUMN homogeneousCategoryDescription VARCHAR(255);
ALTER TABLE products ADD COLUMN lotFlag BOOLEAN DEFAULT FALSE;
```

## Test e Validazione

### 1. Query di Test per Verificare Struttura
```sql
-- Verifica struttura tabella prodotti
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = '${tableNames.products}'
ORDER BY ORDINAL_POSITION;
```

### 2. Query di Controllo Dati
```sql
-- Conteggio record per validazione
SELECT 
    COUNT(*) AS TotalProducts,
    COUNT(CASE WHEN EACODBAR IS NOT NULL AND TRIM(EACODBAR) != '' THEN 1 END) AS ProductsWithBarcode,
    COUNT(CASE WHEN EAPERIVA IS NOT NULL THEN 1 END) AS ProductsWithVAT,
    COUNT(CASE WHEN EAFLOTT = 1 THEN 1 END) AS ProductsWithLotManagement
FROM ${tableNames.products}
WHERE EACODAZI = '${companyCode}' AND EAIMPPOS = 1;
```

## Note Implementative

1. **Configurazione Flessibile**: I nomi delle tabelle devono essere configurabili tramite interfaccia admin
2. **Gestione NULL**: Tutti i campi devono gestire valori NULL/vuoti appropriatamente
3. **Validazione Dati**: Implementare controlli sui dati importati prima del salvataggio
4. **Log Dettagliati**: Registrare tutte le operazioni di importazione per debug
5. **Transazioni**: Utilizzare transazioni per garantire consistenza dei dati
6. **Performance**: Considerare import in batch per grandi volumi di dati