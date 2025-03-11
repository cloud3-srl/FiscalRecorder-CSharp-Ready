# Sistema POS Fiscale

Sistema POS fiscale avanzato per gestione vendite al dettaglio, ottimizzato per performance e usabilità.

## Caratteristiche Principali

- 🛍️ Gestione vendite al dettaglio 
- 🖨️ Integrazione stampante fiscale Epson
- 📱 Interfaccia responsive e intuitiva
- 💾 Supporto database PostgreSQL e MSSQL
- 🔄 Modalità offline con sincronizzazione
- 📊 Reportistica avanzata

## Stack Tecnologico

- Frontend: React + TypeScript
- Backend: Express.js
- Database: PostgreSQL, MSSQL
- UI: Tailwind CSS + shadcn/ui
- Stato: TanStack Query

## Funzionalità

- ✅ Caricamento CSV prodotti
- ✅ Gestione listini e varianti 
- ✅ Configurazione database
- ✅ Configurazione stampante
- ✅ Modalità offline PWA
- ✅ Pannello amministrativo
- ✅ Gestione sconti
- ✅ Multi-reparto

## Configurazione Sviluppo

```bash
# Installazione dipendenze
npm install

# Avvio ambiente sviluppo
npm run dev

# Build produzione
npm run build
```

## Struttura Progetto

```
.
├── client/             # Frontend React
├── server/             # Backend Express
├── shared/             # Tipi e schemi condivisi
└── docs/              # Documentazione
```

## Processo di Sviluppo

### Branch

- `main`: Codice stabile e testato
- `develop`: Branch di sviluppo principale
- `feature/*`: Branch per nuove funzionalità
- `hotfix/*`: Branch per correzioni urgenti

### Workflow

1. Creare un nuovo branch da `develop` per ogni feature
2. Sviluppare e testare la feature nel branch dedicato
3. Fare merge in `develop` dopo il completamento
4. Release periodiche da `develop` a `main`

## Note Aggiuntive

- Configurare sempre il file `.env` seguendo l'esempio in `.env.example`
- Testare la modalità offline prima del deploy
- Verificare la compatibilità stampante
- Aggiornare la documentazione per ogni nuova feature

## Licenza

Proprietario - Tutti i diritti riservati