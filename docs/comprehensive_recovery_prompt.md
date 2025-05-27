# 🚀 PROMPT RIEPILOGATIVO COMPLETO - Recupero Dashboard POS "CLOUD3pOS"

## 📋 CONTESTO GENERALE
Ricrea completamente un dashboard POS (Point of Sale) chiamato **"CLOUD3pOS"** (precedentemente "Cassa in Cloud") con integrazione completa a database MSSQL esterno (Ad Hoc Revolution) e funzionalità avanzate offline.

---

## 🎨 FASE 1: RESTYLING INTERFACCIA CON TEMPLATE WOWDASH

### 1.1 Integrazione Template
- **Fonte**: Cartella `asset_design/wowDashBundle/Bootstrap_Html/`
- **Target**: Applicare stile WowDash a tutta l'interfaccia esistente
- **Priorità**: Menu laterali, header, componenti form, tabelle

### 1.2 Modifica Layout Principale
- **Logo**: Cambiare nome app da "Cassa in Cloud" a **"CLOUD3pOS"**
- **Header POS**: Rimuovere header superiore per ottimizzare spazio
- **Menu Laterale**: Rimuovere voce "Aziende", mantenere POS, Clienti, Impostazioni, Admin
- **Spazi**: Ridurre padding/margin per maximizzare area di lavoro

### 1.3 Pagina POS Ottimizzata
- **Rimuovere**: Barra tab superiore ("Preferiti", "Reparti", etc.)
- **Mantenere**: Solo pulsantiera prodotti e tastierino numerico fisso in basso
- **CSS Personalizzato**: Applicare regole specifiche solo alla pagina POS
- **Quick Buttons**: Grid responsiva che si ridimensiona automaticamente

---

## 🗄️ FASE 2: INTEGRAZIONE DATABASE MSSQL (AD HOC REVOLUTION)

### 2.1 Configurazione Database
- **Sistema**: MSSQL Server con connessione configurabile
- **Tabelle Target**:
  - `C3EXPOS` (Prodotti)
  - `SCARLCONTI` (Clienti) 
  - `SCARLPAG_AMEN` (Metodi Pagamento)
  - `azienda` (Dati Azienda)

### 2.2 Schema Prodotti Esteso
**Campi da importare dal database MSSQL:**
```sql
-- Campi esistenti
EACODART (code), EADESART (name/description), EAPREZZO (price)
EACODLIS (listCode), EA__DATA (activationDate), EAUNIMIS (unitOfMeasure)
cpccchk (controlFlag), EASCONT1-4 (discount1-4), EACODFAM (category)

-- Nuovi campi da aggiungere
EACODBAR (barcode), EAPERIVA (vatRate), EACODREP (departmentCode)
EADESFAM (familyDescription), EACATOMO (homogeneousCategory)
EADESOMO (homogeneousCategoryDescription), EAFLOTT (lotFlag)
```

### 2.3 Sincronizzazione Automatica
- **API Endpoint**: `/api/admin/sync/[entity]-now`
- **Entità**: products, customers, payments, company
- **Parametri Configurabili**: Nomi tabelle, codice azienda
- **Gestione Offline**: Cache locale con fallback automatico

---

## ⚙️ FASE 3: SISTEMA IMPOSTAZIONI COMPLETO

### 3.1 Struttura Menu Impostazioni
```
📁 Impostazioni Generali
├── 1. Ragione Sociale (con dati da MSSQL)
├── 2. % Aliquote IVA (import da MSSQL)
├── 3. Reparti (gestione locale + import)
├── 4. Prodotti (riutilizza pagina admin esistente)
├── 5. Categorie
├── 6. Modalità di vendita
├── 7. Stampanti
├── 8. Lettori barcode (saltare)
├── 9. Display cliente (saltare)
├── 10. $ Pagamenti (import da MSSQL)
├── 11. Ruoli (Amministratore/Operatore predefiniti)
├── 12. Operatori
└── 13. Documenti (toggle per configurazioni stampa)
```

### 3.2 Implementazione Pagine
- **Ogni sezione**: Componente React dedicato con API backend
- **Validazione**: Frontend + backend per ogni form
- **Persistenza**: Database locale PostgreSQL
- **Stile**: Consistente con template WowDash

---

## 🔄 FASE 4: GESTIONE OFFLINE E SINCRONIZZAZIONE

### 4.1 Funzionalità Offline
- **Service Worker**: Cache automatica delle risorse
- **Local Storage**: Backup dati critici (clienti, prodotti)
- **Fallback API**: Gestione quando server non disponibile
- **Sync Status**: Indicatori visivi stato connessione

### 4.2 Pagina Sincronizzazione DB
**Tab multiple:**
- **Configurazione**: Gestione connessioni MSSQL multiple
- **Sincronizzazione**: Trigger manuali per ogni entità
- **Gestione Database**: Tool debug con:
  - Box esecuzione query SQL dirette
  - Log connessioni e errori in tempo reale
  - Scheduler import/export automatici

---

## 👥 FASE 5: GESTIONE CLIENTI E PRODOTTI

### 5.1 Anagrafica Clienti
- **Import MSSQL**: Sincronizzazione automatica da tabella clienti
- **Gestione Locale**: Inserimento nuovi clienti (codice assegnato da gestionale)
- **Ricerca Avanzata**: Per nome, codice, partita IVA
- **Selettore Colonne**: Personalizzazione vista tabella

### 5.2 Gestione Prodotti
- **Import Completo**: Tutti i campi da C3EXPOS inclusi barcode, IVA, lotti
- **Ricerca Barcode**: Integrata in tutti i campi di ricerca
- **Gestione Lotti**: Flag e logica per prodotti con lotto obbligatorio
- **Categorie/Reparti**: Associazione e gestione gerarchica

---

## 🔧 FASE 6: FUNZIONALITÀ POS AVANZATE

### 6.1 Bottoni Azione POS
```
💾 Salva Conto → Salva per richiamo successivo
🗑️ Svuota Carrello → Conferma e reset
📋 Conti Salvati → Lista conti salvati richiamabili
🧾 Stampa → Scontrino/fattura
💳 Pagamento → Modale pagamenti multi-metodo
```

### 6.2 Sistema Pagamenti
- **Metodi**: Import da MSSQL + gestione locale
- **Multi-pagamento**: Supporto pagamenti misti
- **Documenti**: Scontrino, Fattura, Conto con dati cliente

---

## 🔐 FASE 7: AUTENTICAZIONE E RUOLI

### 7.1 Sistema Login
- **UI**: Stile da `sign-in.html` del template WowDash  
- **Ruoli Predefiniti**:
  - **Amministratore**: Accesso completo a tutte le sezioni
  - **Operatore**: Solo POS e Clienti, NO Impostazioni/Admin

### 7.2 Protezione Route
- **ProtectedArea**: Wrapper per route che richiedono auth
- **Redirect Logic**: Login automatico se non autenticato
- **Gestione Sessione**: Persistenza login locale

---

## 🛠️ FASE 8: STRUMENTI AMMINISTRAZIONE

### 8.1 Pagina Admin Avanzata
- **Database Configs**: Gestione multiple configurazioni MSSQL
- **Tool Debug**: Query executor con risultati in tempo reale
- **Monitoraggio**: Log connessioni, errori, performance
- **Maintenance**: Backup, restore, pulizia cache

### 8.2 Selettori Colonne
- **Implementare per**: Tabelle prodotti, clienti, altre entità
- **Persistenza**: Salvataggio preferenze utente
- **UI**: Modal con checkbox per show/hide colonne

---

## 📱 FASE 9: DISTRIBUZIONE WINDOWS

### 9.1 Electron App
- **Setup**: Configurazione Electron per packaging desktop
- **Features**: Funzionalità native Windows
- **Installer**: MSI/EXE per distribuzione aziendale
- **Auto-update**: Sistema aggiornamenti automatici

---

## 🔄 FASE 10: OTTIMIZZAZIONI FINALI

### 10.1 Performance
- **Lazy Loading**: Componenti e route ottimizzate
- **Cache Strategy**: Gestione cache intelligente
- **Bundle Optimization**: Splitting e tree-shaking

### 10.2 UX/UI Refinement
- **Responsive**: Adattamento mobile/tablet
- **Accessibility**: WCAG compliance
- **Error Handling**: Gestione errori user-friendly

---

## 📋 SCHEMA IMPLEMENTAZIONE CONSIGLIATO

### SPRINT 1-2: Base Infrastructure
1. Setup template WowDash
2. Database schema e connessioni MSSQL
3. Layout principale e navigazione

### SPRINT 3-4: Core POS
1. Interfaccia POS ottimizzata
2. Gestione prodotti con import MSSQL
3. Sistema pagamenti base

### SPRINT 5-6: Gestione Dati  
1. Anagrafica clienti completa
2. Sincronizzazione offline
3. Sistema impostazioni

### SPRINT 7-8: Advanced Features
1. Autenticazione e ruoli
2. Tool amministrazione avanzati
3. Funzionalità POS complete

### SPRINT 9-10: Deployment & Polish
1. Packaging Electron
2. Testing e debugging
3. Ottimizzazioni finali

---

## 🚨 NOTE CRITICHE

### Password Database Test
- **MSSQL**: `Nuvola3` (senza punto esclamativo)
- **Codice Azienda**: `SCARL` o `CUTRERA` a seconda dell'ambiente

### Gestione Errori Comuni
- **JSON Parsing**: Gestire risposte HTML quando server offline
- **CORS**: Configurazione per chiamate MSSQL cross-origin  
- **Type Safety**: TypeScript strict per tutti i componenti

### File Structure Mantained
```
client/src/
├── pages/
│   ├── pos/ (interfaccia cassa)
│   ├── customers/ (anagrafica clienti) 
│   ├── admin/ (gestione database)
│   └── settings/ (impostazioni complete)
├── components/ (componenti riutilizzabili)
└── lib/ (utilities e API calls)

server/
├── routes.ts (API endpoints)
├── mssql.ts (connessioni database esterno)
└── database.ts (gestione PostgreSQL locale)
```

---

## ✅ RISULTATO ATTESO

Un dashboard POS completo, moderno e professionale con:
- ✅ Interfaccia utente elegante (WowDash styling)
- ✅ Integrazione database MSSQL bidirezionale  
- ✅ Funzionalità offline robuste
- ✅ Sistema di gestione completo (clienti, prodotti, impostazioni)
- ✅ Strumenti amministrazione avanzati
- ✅ Distribuzione desktop Windows pronta
- ✅ Architettura scalabile e manutenibile

**Questo prompt contiene tutto il necessario per ricreare completamente il sistema perduto seguendo l'esatta progressione di sviluppo originale.**