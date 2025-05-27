# 🧾 FiscalRecorder - Sistema di Registrazione Fiscale

**Versione:** 1.0.0  
**Data Release:** 27 Maggio 2025  
**Tecnologie:** React + TypeScript + Node.js + PostgreSQL

## 📋 Panoramica

FiscalRecorder è un sistema completo di Point of Sale (POS) e registrazione fiscale progettato per gestire vendite, inventario, clienti e reporting fiscale con supporto multi-database.

### ✨ Caratteristiche Principali

- **🛒 Point of Sale Moderno** - Interfaccia touch-friendly per vendite rapide
- **📊 Gestione Inventario** - Tracciamento prodotti, categorie e lotti
- **👥 Gestione Clienti** - Anagrafica clienti completa
- **🔄 Multi-Database** - Supporto PostgreSQL e SQL Server
- **📱 PWA Ready** - Installabile su dispositivi mobili
- **🔐 Sicurezza** - Autenticazione JWT e controllo accessi
- **📈 Reporting** - Dashboard e report analitici
- **🌐 Web-Based** - Accessibile da browser

## 📦 Contenuto Archivio

```
FiscalRecorder/
├── 📁 source/              # Codice sorgente completo
├── 📁 database/            # Schema e setup database
├── 📁 docs/               # Documentazione dettagliata
├── 📁 scripts/            # Script di installazione
├── 📄 README.md           # Questo file
├── 📄 INSTALL.md          # Guida installazione
├── 📄 REQUIREMENTS.md     # Prerequisiti sistema
└── 📄 CONFIGURATION.md    # Guida configurazione
```

## 🚀 Installazione Rapida

### 1. Prerequisiti
```bash
# Installa Node.js 18+ e PostgreSQL 14+
node --version  # >= 18.0.0
psql --version  # >= 14.0
```

### 2. Setup Database
```bash
# Crea database PostgreSQL
sudo -u postgres createdb fiscalrecorder
sudo -u postgres psql -d fiscalrecorder -f database/schema.sql
```

### 3. Installazione Applicazione
```bash
cd source/
npm install
npm run build
npm start
```

### 4. Accesso
- **URL:** http://localhost:5001
- **Demo Login:** Configurabile nel sistema

## 📚 Documentazione Completa

Per l'installazione dettagliata step-by-step:
- 📖 [**INSTALL.md**](INSTALL.md) - Guida installazione completa
- ⚙️ [**REQUIREMENTS.md**](REQUIREMENTS.md) - Prerequisiti di sistema
- 🔧 [**CONFIGURATION.md**](CONFIGURATION.md) - Configurazione avanzata

## 🏗️ Architettura Tecnica

### Frontend
- **React 18** + TypeScript
- **Vite** per bundling e sviluppo
- **Tailwind CSS** + Shadcn/ui
- **React Query** per state management
- **PWA** con service worker

### Backend
- **Node.js** + Express
- **Drizzle ORM** per database
- **JWT** per autenticazione
- **PM2** per process management

### Database
- **PostgreSQL** (primario)
- **SQL Server** (connessione esterna)
- **Migrazioni** automatiche Drizzle

## 🛡️ Sicurezza e Produzione

- ✅ Autenticazione JWT sicura
- ✅ Headers di sicurezza configurati
- ✅ HTTPS SSL/TLS
- ✅ Backup automatico database
- ✅ Logging centralizzato
- ✅ Rate limiting API

## 🔧 Supporto e Manutenzione

### Backup Database
```bash
# Backup automatico configurato via cron
PGPASSWORD="password" pg_dump -h localhost -U fiscalapp fiscalrecorder > backup.sql
```

### Monitoraggio
```bash
# Status applicazione
pm2 status
pm2 logs fiscalrecorder
```

### Aggiornamenti
```bash
cd source/
git pull origin main  # Se connesso a repository
npm install
npm run build
pm2 reload fiscalrecorder
```

## 📄 Licenza

Questo software è rilasciato sotto licenza proprietaria.  
© 2025 - Tutti i diritti riservati.

## 🆘 Supporto

Per supporto tecnico o domande:
- 📧 Email: support@example.com
- 📖 Documentazione: Consultare i file nella cartella `docs/`
- 🐛 Issue: Segnalare problemi tecnici

---

**🎯 Ready to Deploy!** Segui la guida INSTALL.md per iniziare.
