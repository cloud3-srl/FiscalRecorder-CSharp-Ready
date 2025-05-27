# FiscalRecorder - Sistema POS Completo

🧾 **Sistema completo per registratore fiscale con interfaccia React/TypeScript e backend Node.js**

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Descrizione

Sistema POS (Point of Sale) completo per registratori fiscali, sviluppato con tecnologie moderne e pronto per la conversione in C#. Include gestione completa di vendite, clienti, prodotti, pagamenti e reportistica.

## 🚀 Funzionalità Principali

### 💰 Punto Vendita (POS)
- ✅ Interfaccia touchscreen ottimizzata
- ✅ Griglia prodotti dinamica
- ✅ Carrello della spesa in tempo reale
- ✅ Gestione quantità e sconti
- ✅ Selezione cliente
- ✅ Tastierino numerico integrato
- ✅ Modalità pagamento multiple
- ✅ Stampa scontrini fiscali

### 👥 Gestione Clienti
- ✅ Anagrafe clienti completa
- ✅ Ricerca avanzata
- ✅ Storico acquisti
- ✅ Dati fiscali

### 📦 Gestione Prodotti
- ✅ Catalogo prodotti
- ✅ Categorie e sottocategorie
- ✅ Gestione prezzi e IVA
- ✅ Inventario e scorte
- ✅ Codici a barre

### ⚙️ Configurazioni
- ✅ Impostazioni azienda
- ✅ Configurazione IVA
- ✅ Metodi di pagamento
- ✅ Reparti e categorie
- ✅ Magazzini

### 📊 Reportistica
- ✅ Report vendite
- ✅ Analisi incassi
- ✅ Statistiche prodotti
- ✅ Export dati

### 🔧 Amministrazione
- ✅ Gestione database
- ✅ Sincronizzazione dati
- ✅ Backup e restore
- ✅ Configurazioni avanzate

## 🛠️ Stack Tecnologico

### Frontend
- **React 18** - Framework UI moderno
- **TypeScript** - Tipizzazione statica
- **Vite** - Build tool veloce
- **TailwindCSS** - Framework CSS utility-first
- **shadcn/ui** - Componenti UI eleganti
- **React Query** - Gestione stato server
- **React Hook Form** - Gestione form

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipizzazione backend
- **Drizzle ORM** - ORM type-safe
- **SQLite/PostgreSQL** - Database
- **JWT** - Autenticazione

### DevOps & Tools
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formattazione codice
- **Husky** - Git hooks
- **Docker** - Containerizzazione (ready)

## 📁 Struttura Progetto

```
FiscalRecorder-CSharp-Ready/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti riutilizzabili
│   │   ├── pages/         # Pagine dell'applicazione
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/          # Utilities e configurazioni
│   │   └── contexts/     # Context providers
│   └── public/           # Asset statici
├── server/               # Backend Node.js
│   ├── routes.ts         # Route API
│   ├── db.ts            # Configurazione database
│   ├── storage.ts       # Gestione storage
│   └── printer.ts       # Gestione stampa
├── shared/              # Codice condiviso
│   └── schema.ts        # Schema database
├── migrations/          # Migrazioni database
└── docs/               # Documentazione
```

## 🚀 Installazione e Avvio

### Prerequisiti
- Node.js 18.x o superiore
- npm o yarn
- Git

### Installazione

```bash
# Clona la repository
git clone https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready.git
cd FiscalRecorder-CSharp-Ready

# Installa dipendenze
npm install

# Configura variabili ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni

# Esegui migrazioni database
npm run db:migrate

# Avvia in modalità sviluppo
npm run dev
```

### Comandi Disponibili

```bash
# Sviluppo
npm run dev          # Avvia client e server in modalità dev
npm run dev:client   # Solo client
npm run dev:server   # Solo server

# Build
npm run build        # Build per produzione
npm run preview      # Preview build produzione

# Database
npm run db:generate  # Genera migrazioni
npm run db:migrate   # Esegui migrazioni
npm run db:studio    # Apri Drizzle Studio

# Linting
npm run lint         # Esegui ESLint
npm run lint:fix     # Fix automatico
```

## 🌐 Accesso all'Applicazione

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Database Studio:** http://localhost:4983

## 📱 Interfacce Principali

### POS (Point of Sale)
- URL: `/pos`
- Interfaccia touchscreen per vendite rapide
- Tastierini numerici integrati
- Gestione pagamenti

### Clienti
- URL: `/customers`
- Anagrafe completa clienti
- Ricerca e filtri avanzati

### Impostazioni
- URL: `/settings`
- Configurazioni sistema
- Gestione prodotti e categorie
- Impostazioni azienda

### Amministrazione
- URL: `/admin`
- Gestione database
- Strumenti avanzati

## 🔄 Conversione C# Ready

Il progetto è strutturato per facilitare la conversione in C#:

### Backend → .NET Core
- Structure mapping: Express routes → Controllers
- ORM: Drizzle → Entity Framework Core
- Authentication: JWT → ASP.NET Identity
- Database: Mantenimento schema esistente

### Frontend → Blazor (Opzionale)
- Componenti React → Blazor Components
- State management → Blazor state
- API calls → HttpClient

### File di Riferimento
- `NOTES_FOR_CSHARP_WINDOWS_CONVERSION.md` - Note dettagliate per conversione
- `shared/schema.ts` - Schema database da replicare
- `server/routes.ts` - API endpoints da convertire

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📦 Deploy

### Docker

```bash
# Build immagine
docker build -t fiscal-recorder .

# Run container
docker run -p 3000:3000 fiscal-recorder
```

### Produzione

```bash
# Build produzione
npm run build

# Start server produzione
npm start
```

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## 👨‍💻 Autori

- **Cloud3 SRL** - *Sviluppo iniziale* - [Cloud3](https://github.com/cloud3-srl)

## 🙏 Ringraziamenti

- React Team per l'eccellente framework
- Vercel per Vite e deployment tools
- shadcn per i componenti UI
- Drizzle team per l'ORM

---

<div align="center">

**[🌐 Demo Live](https://fiscal-recorder-demo.vercel.app)** • **[📚 Documentazione](https://docs.cloud3.srl)** • **[🐛 Report Bug](https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready/issues)**

</div>