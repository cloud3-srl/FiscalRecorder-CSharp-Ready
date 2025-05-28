# FiscalRecorder v1.0.0 - Release Package

Sistema completo di distribuzione e installazione per **FiscalRecorder**, il registratore di cassa professionale moderno.

## 📋 Contenuto Release

### 🌐 Landing Page
- **`index.html`** - Landing page professionale con download automatico
- Design responsive e moderno
- Modal di download interattiva
- Compatibile con tutti i browser

### 🚀 Script di Installazione

#### Windows
- **`install-windows.ps1`** - Installazione PowerShell completa
- **Funzionalità:**
  - Rilevamento automatico sistema
  - Installazione dipendenze (Node.js via Chocolatey)
  - Configurazione firewall Windows
  - Creazione collegamenti desktop e menu Start
  - Backup installazione precedente
  - Test post-installazione

#### Unix/Linux/macOS  
- **`install-express.sh`** - Installazione Bash automatica
- **Funzionalità:**
  - Supporto multi-piattaforma
  - Download via Git o ZIP fallback
  - Configurazione database SQLite
  - Creazione desktop entry (Linux)
  - Gestione permessi automatica
  - Verifica requisiti di sistema

### 🏗️ Build System
- **`build-installers.sh`** - Generatore automatico pacchetti
- **Genera:**
  - Pacchetto Windows (.zip)
  - Pacchetto Unix (.tar.gz)
  - Versione portable (.zip)
  - Codice sorgente (.tar.gz)
  - Checksum SHA256
  - Release notes automatiche

## 🎯 Modalità di Installazione

### 1. 🪟 Windows - Automatica (Consigliata)
```powershell
# Scarica e esegui in PowerShell (come Amministratore)
Set-ExecutionPolicy Bypass -Scope Process -Force
.\install-windows.ps1
```

**Caratteristiche:**
- ✅ Installazione guidata step-by-step
- ✅ Rilevamento automatico dipendenze
- ✅ Installazione Node.js se mancante
- ✅ Configurazione firewall automatica
- ✅ Collegamenti desktop e menu Start
- ✅ Backup versioni precedenti

### 2. 🐧 Unix/Linux/macOS - Express
```bash
# Rendi eseguibile e avvia
chmod +x install-express.sh
./install-express.sh
```

**Caratteristiche:**
- ✅ Rilevamento automatico OS
- ✅ Download intelligente (Git + ZIP fallback)
- ✅ Build automatico applicazione
- ✅ Configurazione database
- ✅ Script di avvio integrato
- ✅ Desktop entry (Linux)

### 3. 📦 Portable - Zero Installation
- Scarica versione portable
- Estrai in qualsiasi cartella
- Esegui senza modificare il sistema
- Ideale per USB o test

### 4. 👨‍💻 Developer - Codice Sorgente
```bash
# Build completo per sviluppatori
npm install
npm run build
npm start
```

## 🔧 Requisiti di Sistema

### Minimi
- **OS:** Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **Node.js:** 14.0+ (installato automaticamente se mancante)
- **RAM:** 4GB
- **Spazio:** 500MB
- **Browser:** Chrome, Firefox, Safari, Edge

### Consigliati
- **RAM:** 8GB
- **SSD:** Per prestazioni ottimali
- **Connessione Internet:** Per download iniziale

## 🚀 Quick Start

### Utente Finale
1. **Apri `index.html`** nel browser
2. **Clicca "Scarica Ora"** 
3. **Seleziona il tuo sistema** operativo
4. **Esegui lo script** di installazione
5. **Segui le istruzioni** a schermo

### Sistemista
```bash
# Build completo di tutti i pacchetti
chmod +x build-installers.sh
./build-installers.sh

# Verrà creata la cartella 'dist' con tutti i pacchetti
```

## 📁 Struttura Post-Installazione

```
FiscalRecorder/
├── client/                 # Frontend React
├── server/                 # Backend Node.js  
├── data/                   # Database SQLite
├── docs/                   # Documentazione
├── .env                    # Configurazione
├── start-fiscalrecorder.*  # Script di avvio
└── README.md              # Guida utente
```

## 🎨 Personalizzazione Installazione

### Windows PowerShell
```powershell
# Installazione personalizzata
.\install-windows.ps1 -InstallPath "C:\MioPos" -Unattended
```

**Parametri disponibili:**
- `-InstallPath` - Directory di installazione
- `-Unattended` - Modalità silenziosa
- `-CreateDesktopShortcut:$false` - Disabilita collegamento desktop
- `-CreateStartMenuShortcut:$false` - Disabilita collegamento menu

### Unix/Linux/macOS
```bash
# Personalizzazione tramite variabili ambiente
export INSTALL_DIR="$HOME/MyPOS"
export FISCAL_RECORDER_VERSION="1.0.0"
./install-express.sh
```

## 🔒 Sicurezza

### Verifiche Automatiche
- ✅ Controllo integrità file
- ✅ Verifica dipendenze sicure
- ✅ Isolamento installazione
- ✅ Backup prima aggiornamenti

### Checksum
Tutti i pacchetti includono checksum SHA256 per verificare l'integrità:
```bash
# Verifica integrità
sha256sum -c checksums.sha256
```

## 🐛 Troubleshooting

### Problemi Comuni

#### Windows
```
Errore: Execution Policy
Soluzione: Set-ExecutionPolicy Bypass -Scope Process -Force
```

```
Errore: Node.js non trovato
Soluzione: L'installer lo installerà automaticamente
```

#### Unix/Linux
```
Errore: Permission denied
Soluzione: chmod +x install-express.sh
```

```
Errore: curl non trovato
Soluzione: sudo apt-get install curl (Ubuntu/Debian)
```

#### Generale
```
Porta 3000 già in uso
Soluzione: Modifica PORT=3001 nel file .env
```

### Log di Installazione
- **Windows:** `%TEMP%\fiscalrecorder-install.log`
- **Unix:** `/tmp/fiscalrecorder-install.log`

## 📞 Supporto

### Documentazione
- [README principale](../README.md) - Guida sviluppatore completa
- [Documentazione API](../docs/) - Reference tecnico
- [FAQ](../docs/FAQ.md) - Domande frequenti

### Community
- **Issues:** [GitHub Issues](https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready/issues)
- **Discussions:** [GitHub Discussions](https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready/discussions)

### Commerciale
- **Email:** support@fiscalrecorder.it
- **Telefono:** +39 xxx xxx xxxx
- **Sito:** https://fiscalrecorder.it

## 📄 Licenza

FiscalRecorder è software libero distribuito sotto **licenza Open Source**.

- ✅ **Uso commerciale** permesso
- ✅ **Modifiche** permesse  
- ✅ **Distribuzione** permessa
- ✅ **Uso privato** permesso

Vedere file [LICENSE](../LICENSE) per dettagli completi.

## 🏷️ Versioning

FiscalRecorder segue [Semantic Versioning](https://semver.org/):

- **MAJOR:** Cambiamenti incompatibili API
- **MINOR:** Nuove funzionalità compatibili
- **PATCH:** Bug fix compatibili

**Versione attuale:** `1.0.0`

## 🚀 Roadmap

### v1.1.0 (Q2 2025)
- [ ] Interfaccia mobile nativa
- [ ] Integrazione pagamenti POS
- [ ] Sincronizzazione cloud

### v1.2.0 (Q3 2025)
- [ ] Multi-negozio
- [ ] Analytics avanzate
- [ ] Plugin system

### v2.0.0 (Q4 2025)
- [ ] Architettura microservizi
- [ ] API GraphQL
- [ ] White-label support

---

**Sviluppato con ❤️ per i commercianti italiani**

*Questo progetto è mantenuto da [Cloud3 S.r.l.](https://cloud3.srl) e la community Open Source.*
