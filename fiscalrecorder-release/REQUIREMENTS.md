# ⚙️ Prerequisiti di Sistema - FiscalRecorder

Questo documento elenca tutti i requisiti hardware, software e di rete necessari per l'installazione e il funzionamento di FiscalRecorder.

## 🖥️ Requisiti Hardware

### Configurazione Minima
- **CPU:** 2 core @ 2.0 GHz
- **RAM:** 4 GB
- **Storage:** 20 GB disponibili
- **Rete:** Connessione internet stabile

### Configurazione Consigliata
- **CPU:** 4+ core @ 2.5+ GHz
- **RAM:** 8+ GB
- **Storage:** 50+ GB SSD
- **Rete:** Banda larga (>10 Mbps)

### Configurazione Produzione
- **CPU:** 8+ core @ 3.0+ GHz
- **RAM:** 16+ GB
- **Storage:** 100+ GB SSD NVMe
- **Rete:** Connessione dedicata/enterprise

## 💻 Sistemi Operativi Supportati

### Linux (Raccomandato)
- ✅ **Ubuntu 20.04 LTS** o superiore
- ✅ **Debian 11** o superiore
- ✅ **CentOS 8** o superiore
- ✅ **RHEL 8** o superiore
- ✅ **Amazon Linux 2**

### macOS
- ✅ **macOS 11 Big Sur** o superiore
- ✅ **macOS 12 Monterey**
- ✅ **macOS 13 Ventura**
- ✅ **macOS 14 Sonoma**

### Windows
- ✅ **Windows 10** (build 1903+)
- ✅ **Windows 11**
- ✅ **Windows Server 2019**
- ✅ **Windows Server 2022**

## 🔧 Software Richiesto

### Runtime Environment

#### Node.js
- **Versione:** 18.x.x o superiore
- **Versione Testata:** 18.19.0
- **NPM:** 9.x.x o superiore
- **Download:** https://nodejs.org/

#### PostgreSQL
- **Versione:** 14.x o superiore
- **Versione Testata:** 14.10
- **Estensioni:** Standard (uuid-ossp, pgcrypto)
- **Download:** https://www.postgresql.org/

### Dipendenze di Sistema

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install -y curl wget gnupg lsb-release build-essential
```

#### CentOS/RHEL
```bash
sudo yum update
sudo yum groupinstall -y "Development Tools"
sudo yum install -y curl wget
```

#### macOS
```bash
# Installa Xcode Command Line Tools
xcode-select --install

# Installa Homebrew (se non presente)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Windows
- **Visual Studio Build Tools** o **Visual Studio Community**
- **Git for Windows**
- **PowerShell 7+** (raccomandato)

## 🌐 Requisiti di Rete

### Porte
- **5001** - Applicazione principale (default)
- **5432** - PostgreSQL (database)
- **80** - HTTP (se Nginx configurato)
- **443** - HTTPS (se SSL configurato)

### Connettività Esterna
- **GitHub/NPM:** Per download dipendenze
- **PostgreSQL Mirror:** Per installazione database
- **Sistema Operativo:** Per aggiornamenti sicurezza

### Firewall
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5001  # Applicazione (se no proxy)

# CentOS/RHEL (FirewallD)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=5001/tcp
sudo firewall-cmd --reload
```

## 🗄️ Requisiti Database

### PostgreSQL
- **Versione minima:** 14.0
- **Charset:** UTF-8
- **Timezone:** UTC (raccomandato)
- **Max Connections:** 100+ (configurabile)

### Configurazioni Consigliate
```sql
-- postgresql.conf
shared_buffers = 256MB              # 25% della RAM disponibile
effective_cache_size = 1GB          # 75% della RAM disponibile
work_mem = 4MB                      # Per query complesse
maintenance_work_mem = 64MB         # Per maintenance
max_connections = 200               # Connessioni simultanee
```

### Spazio Disco
- **Database minimo:** 1 GB
- **Database produzione:** 10+ GB
- **Backup spazio:** 2x dimensione database
- **Log retention:** 7-30 giorni

## 🔐 Sicurezza

### Certificati SSL
- **Let's Encrypt** (gratuito, raccomandato)
- **Certificato commerciale** (per produzione)
- **Self-signed** (solo sviluppo/test)

### Backup
- **Storage:** Locale + remoto
- **Frequenza:** Giornaliera (minimo)
- **Retention:** 30 giorni (consigliato)
- **Test restore:** Settimanale

### Utenti Sistema
```bash
# Crea utente dedicato (produzione)
sudo useradd -m -s /bin/bash fiscalapp
sudo usermod -aG sudo fiscalapp  # Solo se necessario

# Limita privilegi PostgreSQL
# Non usare utente postgres per l'applicazione
```

## 📊 Monitoraggio

### Tools Raccomandati
- **PM2** - Process management
- **Nginx** - Reverse proxy + load balancer
- **Fail2Ban** - Protezione SSH/HTTP
- **Logrotate** - Gestione log
- **Cron** - Backup automatico

### Metriche da Monitorare
- **CPU Usage** (< 80% normale)
- **Memory Usage** (< 80% normale)
- **Disk Space** (< 85% critico)
- **Network I/O**
- **Database Connections**
- **Response Time** (< 2s target)

## 🧪 Test Environment

### Sviluppo Locale
- **CPU:** 2+ core
- **RAM:** 4+ GB
- **Node.js:** Ultima versione LTS
- **PostgreSQL:** Locale o Docker

### Staging/Test
- **Configurazione:** Simile a produzione
- **Database:** Copia sanitizzata produzione
- **SSL:** Certificato test
- **Backup:** Non critico

### Produzione
- **Alta disponibilità:** Load balancer
- **Database:** Master/slave setup
- **Backup:** Automatizzato + offsite
- **Monitoring:** 24/7

## 📱 Client Requirements

### Browser Supportati
- ✅ **Chrome 90+** (raccomandato)
- ✅ **Firefox 88+**
- ✅ **Safari 14+**
- ✅ **Edge 90+**
- ⚠️ **Internet Explorer** (non supportato)

### Dispositivi Mobili
- ✅ **iOS 14+** (Safari)
- ✅ **Android 8+** (Chrome)
- ✅ **Tablet** (tutti i sistemi)

### PWA Support
- **Service Worker:** Abilitato
- **Offline Mode:** Cache essenziale
- **Install Prompt:** Configurabile

## 🔄 Integrazione Esterna

### Database Esterni
- **SQL Server 2016+**
- **Connettività:** Rete/VPN sicura
- **Credenziali:** Utente dedicato
- **Permessi:** Solo lettura (consigliato)

### API Esterne
- **Timeout:** 30s default
- **Retry:** 3 tentativi
- **Rate Limiting:** Rispettare limiti provider

## ✅ Verifica Prerequisiti

### Script di Verifica
```bash
#!/bin/bash
echo "=== Verifica Prerequisiti FiscalRecorder ==="

# Node.js
node_version=$(node --version 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Node.js: $node_version"
else
    echo "❌ Node.js non installato"
fi

# PostgreSQL
pg_version=$(psql --version 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ PostgreSQL: $pg_version"
else
    echo "❌ PostgreSQL non installato"
fi

# Spazio disco
disk_space=$(df -h . | tail -1 | awk '{print $4}')
echo "💾 Spazio disponibile: $disk_space"

# RAM
ram_total=$(free -h | grep Mem | awk '{print $2}')
echo "🧠 RAM totale: $ram_total"

echo "=== Fine Verifica ==="
```

## 📋 Checklist Pre-Installazione

### Sistema
- [ ] Sistema operativo supportato
- [ ] Hardware requisiti soddisfatti
- [ ] Accesso root/amministratore
- [ ] Connessione internet attiva

### Software
- [ ] Node.js 18+ installato
- [ ] PostgreSQL 14+ installato
- [ ] NPM funzionante
- [ ] Git installato (opzionale)

### Rete
- [ ] Porte necessarie aperte
- [ ] Firewall configurato
- [ ] DNS risoluzione
- [ ] SSL certificato (produzione)

### Sicurezza
- [ ] Utente dedicato creato
- [ ] Password forti
- [ ] Backup strategy pianificata
- [ ] Update policy definita

---

**⚡ Pronto per l'Installazione!** Se tutti i prerequisiti sono soddisfatti, puoi procedere con [INSTALL.md](INSTALL.md).
