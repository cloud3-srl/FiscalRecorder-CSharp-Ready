# FiscalRecorder - Sistema POS Completo

Un sistema Point of Sale (POS) completo sviluppato con React + TypeScript (frontend) e Node.js + Express (backend), progettato per registratori fiscali e gestione delle vendite.

## 🚀 Caratteristiche Principali

### 📱 Interfaccia POS
- **Gestione vendite** con interfaccia touch-friendly
- **Carrello dinamico** con calcolo automatico totali
- **Keypad numerico** per inserimento quantità e prezzi
- **Gestione clienti** con ricerca e selezione rapida
- **Modalità pagamento** multiple (contanti, carta, etc.)
- **Gestione lotti** per prodotti con scadenza

### ⚙️ Gestione Amministrativa
- **Impostazioni azienda** complete
- **Gestione prodotti** con categorie e IVA
- **Configurazione magazzini** multipli
- **Gestione clienti** con anagrafica completa
- **Impostazioni pagamenti** personalizzabili
- **Sincronizzazione database** con backup

### 🗄️ Database e Storage
- **SQLite** per sviluppo locale
- **SQL Server** per produzione
- **IndexedDB** per cache offline
- **Migrazioni automatiche** del database
- **Backup e ripristino** dati

### 🖨️ Integrazione Hardware
- **Stampanti fiscali** (supporto in sviluppo)
- **Lettori codici a barre**
- **Registratori di cassa**

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** + **TypeScript**
- **Vite** per il bundling
- **Tailwind CSS** per lo styling
- **Shadcn/ui** per i componenti UI
- **React Query** per state management
- **React Router** per la navigazione

### Backend
- **Node.js** + **Express**
- **TypeScript** per type safety
- **Drizzle ORM** per database queries
- **SQLite** / **SQL Server** support
- **CORS** e middleware di sicurezza

### Tools & Build
- **ESLint** + **Prettier** per code quality
- **PostCSS** per CSS processing
- **Drizzle Kit** per database migrations

## 📋 Prerequisiti

- **Node.js** 18+ 
- **npm** o **yarn**
- **SQL Server** (per produzione) o **SQLite** (per sviluppo)

## 🚀 Installazione e Setup

### 1. Clona il repository
```bash
git clone <url-repository>
cd FiscalRecorder_CSharp_Ready
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Configurazione database
```bash
# Per SQLite (sviluppo)
npm run db:generate
npm run db:migrate

# Per SQL Server (produzione)
# Configura le variabili d'ambiente nel file .env
```

### 4. Avvia l'applicazione
```bash
# Sviluppo (client + server)
npm run dev

# Solo client
npm run dev:client

# Solo server  
npm run dev:server
```

## 📁 Struttura del Progetto

```
FiscalRecorder/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti UI riutilizzabili
│   │   ├── pages/         # Pagine dell'applicazione
│   │   ├── contexts/      # React Contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities e configurazioni
├── server/                # Backend Node.js
│   ├── db.ts             # Configurazione database
│   ├── routes.ts         # API routes
│   ├── mssql.ts          # SQL Server connection
│   └── index.ts          # Server entry point
├── shared/               # Codice condiviso
│   └── schema.ts         # Schema database
└── migrations/           # Database migrations
```

## 🔧 Configurazione

### Variabili d'Ambiente
Crea un file `.env` nella root del progetto:

```env
# Database
DB_TYPE=sqlite  # o 'mssql' per SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=your_password
DB_DATABASE=FiscalRecorder

# Server
PORT=3001
NODE_ENV=development
```

## 📱 Utilizzo

### Interfaccia POS
1. Naviga su `http://localhost:5173`
2. Seleziona prodotti dalla griglia
3. Gestisci quantità e prezzi
4. Aggiungi clienti se necessario
5. Procedi al pagamento

### Amministrazione
- **Impostazioni** → Configura azienda, prodotti, IVA
- **Magazzini** → Gestisci inventario multi-magazzino
- **Database** → Backup, ripristino, sincronizzazione

## 🔄 API Endpoints

### Prodotti
- `GET /api/products` - Lista prodotti
- `POST /api/products` - Crea prodotto
- `PUT /api/products/:id` - Aggiorna prodotto
- `DELETE /api/products/:id` - Elimina prodotto

### Vendite
- `POST /api/sales` - Registra vendita
- `GET /api/sales` - Lista vendite
- `GET /api/sales/:id` - Dettaglio vendita

### Clienti
- `GET /api/customers` - Lista clienti
- `POST /api/customers` - Crea cliente

## 🚧 Roadmap

- [ ] Integrazione stampanti fiscali
- [ ] App mobile con React Native
- [ ] Dashboard analytics avanzate
- [ ] Integrazione pagamenti online
- [ ] Sistema di loyalty clienti
- [ ] Reportistica avanzata
- [ ] Multi-tenancy

## 🤝 Contribuire

1. Fork del progetto
2. Crea un feature branch (`git checkout -b feature/nuova-funzionalita`)
3. Commit delle modifiche (`git commit -am 'Aggiungi nuova funzionalità'`)
4. Push del branch (`git push origin feature/nuova-funzionalita`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per dettagli.

## 📞 Supporto

Per domande o supporto:
- Apri un issue su GitHub
- Contatta il team di sviluppo

---

**FiscalRecorder** - Semplificando la gestione delle vendite 🛒
