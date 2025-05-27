# 🔄 FASE 4: GESTIONE OFFLINE E SINCRONIZZAZIONE

## 🎯 OBIETTIVO
Implementare sistema robusto per funzionamento offline, sincronizzazione automatica e strumenti avanzati di gestione database per amministratori.

## 🌐 GESTIONE OFFLINE

### 4.1 Service Worker Setup
```typescript
// File: client/public/sw.js (da creare)
// CACHE STRATEGY: Cache-first per risorse statiche
// NETWORK-FIRST: Per API calls con fallback cache
// OFFLINE DETECTION: Navigator.onLine event listeners

const CACHE_NAME = 'cloud3pos-v1';
const CRITICAL_RESOURCES = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/api/products',      // Cache prodotti
  '/api/customers',     // Cache clienti  
  '/api/payments'       // Cache metodi pagamento
];

// Background sync per dati modificati offline
```

### 4.2 Offline Store Management
```typescript
// File: client/src/lib/offline-store.ts
interface OfflineStore {
  products: Product[];
  customers: Customer[];
  payments: PaymentMethod[];
  lastSync: {
    products: Date;
    customers: Date; 
    payments: Date;
  };
  pendingChanges: {
    sales: Sale[];           // Vendite offline da sincronizzare
    customers: Customer[];   // Clienti creati offline
  };
}

// LOCAL STORAGE FALLBACK: Quando IndexedDB non disponibile
// ENCRYPTION: Dati sensibili clienti criptati localmente
```

### 4.3 Fallback API Handler  
```typescript
// File: client/src/lib/api-client.ts
class APIClient {
  async get(endpoint: string) {
    try {
      // Tentativo chiamata normale
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Network error');
      return response.json();
    } catch (error) {
      // Fallback a cache locale
      return this.getFromOfflineStore(endpoint);
    }
  }
  
  // GESTIONE ERRORI: "Unexpected token '<', \"<!DOCTYPE" 
  // CAUSA: Server ritorna HTML invece di JSON quando offline
  // SOLUZIONE: Detect HTML response e fallback automatico
}
```

## 🔧 STRUMENTI AMMINISTRAZIONE AVANZATI

### 4.4 Pagina Admin Database
```typescript
// File: client/src/pages/admin/database.tsx
// ESTENDERE con nuovi strumenti richiesti

// Tab 1: Configurazione (ESISTENTE)
// Tab 2: Sincronizzazione (ESISTENTE) 
// Tab 3: Gestione Database (NUOVO)
// Tab 4: Strumenti Debug (NUOVO)
```

### 4.5 Box Esecuzione Query SQL
```typescript
// Componente: SQLQueryExecutor
interface QueryExecutor {
  query: string;          // Textarea per SQL
  database: 'local' | 'mssql';  // Target database
  results: any[];         // Risultati query
  isLoading: boolean;     // Stato esecuzione
  error?: string;         // Errori query
}

// SICUREZZA: Solo SELECT queries, bloccare DML pericolose
// TIMEOUT: Limitare durata esecuzione (30s max)
// FORMAT: Tabella risultati con export CSV/JSON
```

### 4.6 Log Real-time Manager
```typescript
// Componente: DatabaseLogMonitor  
interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  source: 'mssql' | 'postgres' | 'api';
  message: string;
  details?: object;
}

// FEATURES:
// - Stream real-time via WebSocket
// - Filtri per level/source/timerange  
// - Auto-scroll e pausa
// - Export log file
// - Clear log buffer
```

### 4.7 Scheduler Import/Export
```typescript
// Componente: DataScheduler
interface ScheduleJob {
  id: string;
  name: string;           // Nome del job
  type: 'import' | 'export';
  entity: 'products' | 'customers' | 'payments' | 'all';
  schedule: string;       // Cron expression
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'pending' | 'running' | 'success' | 'error';
}

// CRON EXAMPLES:
// "0 2 * * *"     = Ogni giorno alle 2:00
// "0 */4 * * *"   = Ogni 4 ore  
// "0 0 * * 1"     = Ogni Lunedì a mezzanotte

// BACKEND: Node-cron o agenda.js per scheduling
```

## 📊 STATO CONNESSIONE E SYNC

### 4.8 Connection Status Indicator
```typescript
// Componente: ConnectionStatus
interface ConnectionState {
  isOnline: boolean;           // Navigator.onLine
  serverReachable: boolean;    // Ping server API
  mssqlConnected: boolean;     // Test connessione MSSQL
  lastSync: Date;             // Ultima sincronizzazione
  pendingChanges: number;     // Modifiche da sincronizzare
}

// UI: Indicatori colorati + tooltip dettagli
// 🟢 Online | 🟡 Offline con cache | 🔴 Errore connessione
```

### 4.9 Auto-Sync Manager
```typescript
// File: client/src/lib/sync-manager.ts
class SyncManager {
  private syncInterval: number = 5 * 60 * 1000; // 5 minuti
  
  async startAutoSync() {
    setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingChanges();
        this.refreshCriticalData();
      }
    }, this.syncInterval);
  }
  
  async syncPendingChanges() {
    // Invia vendite offline al server
    // Sincronizza clienti creati offline  
    // Gestisce conflitti merge
  }
}
```

## 🔄 SINCRONIZZAZIONE AVANZATA

### 4.10 Conflict Resolution
```typescript
// Gestione conflitti quando stesso record modificato online/offline
interface ConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'manual';
  mergeRules: {
    [field: string]: 'newest' | 'merge' | 'prompt';
  };
}

// ESEMPIO: Cliente modificato offline e online contemporaneamente
// STRATEGIA: Prompt utente per risoluzione manuale
```

### 4.11 Delta Sync Optimization  
```typescript
// Sincronizzare solo record modificati dall'ultimo sync
interface SyncDelta {
  lastSyncTimestamp: Date;
  modifiedRecords: {
    products: string[];    // Array di ID modificati
    customers: string[];   
    payments: string[];
  };
  deletedRecords: {
    products: string[];    // Array di ID eliminati
    customers: string[];
    payments: string[];
  };
}

// PERFORMANCE: Riduce traffico di rete significativamente
// METADATA: Tracking last_modified su ogni record
```

## 📋 CONFIGURAZIONI AVANZATE

### 4.12 Configurazione Multi-Database
```typescript
// Supporto multiple configurazioni MSSQL attive
interface DatabaseConfig {
  id: string;
  name: string;           // Nome descrittivo  
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;       // Encrypted storage
  isActive: boolean;      // Solo una attiva per volta
  tableMapping: {         // Mapping nomi tabelle personalizzato
    products: string;
    customers: string;
    payments: string; 
    company: string;
  };
  companyCode: string;    // Codice azienda per filtri
}

// UI: Lista configurazioni + switch attivazione
// SICUREZZA: Password encrypt in local storage
```

### 4.13 Backup & Restore
```typescript
// Strumenti backup/restore database locale
interface BackupManager {
  createBackup(): Promise<Blob>;     // Export completo DB
  restoreBackup(file: File): Promise<void>;  // Import da file
  autoBackup: boolean;               // Backup automatico
  backupSchedule: string;            // Cron per auto-backup
  retentionDays: number;             // Giorni mantenimento
}

// FORMATI: JSON, SQL dump, CSV per singole tabelle
// CLOUD SYNC: Optional backup su cloud storage
```

## 📋 VALIDAZIONE

### 4.14 Test Offline Scenarios
- [ ] Disconnessione rete durante vendita
- [ ] Sincronizzazione alla riconnessione  
- [ ] Cache prodotti/clienti disponibile offline
- [ ] Creazione clienti offline e sync
- [ ] Errori gestiti gracefully
- [ ] Indicatori stato connessione accurati

### 4.15 Test Admin Tools
- [ ] Query SQL eseguite correttamente
- [ ] Log real-time funzionanti
- [ ] Scheduler jobs configurabili
- [ ] Multiple config DB gestibili
- [ ] Backup/restore operativo

## 🚨 PROBLEMI NOTI DA RISOLVERE

### 4.16 Error Handling Specifici
```typescript
// ERRORE: "Unexpected token '<', \"<!DOCTYPE"
// CAUSA: Server ritorna HTML error page invece JSON
// SOLUZIONE: Content-Type detection + fallback

async function handleAPIResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    // Server in errore, usa cache locale
    throw new NetworkError('Server returned non-JSON response');
  }
  return response.json();
}
```

### 4.17 Performance Optimization
- **IndexedDB**: Per storage offline robusto vs localStorage  
- **Service Worker**: Background sync per dati critici
- **Compression**: Gzip dati sincronizzazione  
- **Pagination**: API calls per dataset grandi
- **Debouncing**: Rate limiting per auto-sync

## 🔧 ORDINE IMPLEMENTAZIONE
1. ✅ **Service Worker**: Base offline functionality
2. ✅ **API Fallback**: Error handling + cache
3. ✅ **Admin Tools**: Query executor + log monitor  
4. ✅ **Sync Manager**: Auto-sync + conflict resolution
5. ✅ **Multi-DB Config**: Multiple MSSQL support
6. ✅ **Backup Tools**: Database backup/restore