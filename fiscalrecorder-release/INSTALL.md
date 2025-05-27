# 📖 Guida di Installazione - FiscalRecorder

Questa guida ti accompagnerà passo-passo nell'installazione di FiscalRecorder sul tuo sistema.

## 📋 Indice

1. [Prerequisiti Sistema](#-prerequisiti-sistema)
2. [Installazione Database](#-installazione-database)
3. [Setup Applicazione](#-setup-applicazione)
4. [Configurazione](#-configurazione)
5. [Primo Avvio](#-primo-avvio)
6. [Produzione](#-deploy-produzione)
7. [Troubleshooting](#-troubleshooting)

## 🔧 Prerequisiti Sistema

### Sistema Operativo Supportati
- ✅ **Ubuntu 20.04+** / Debian 11+
- ✅ **CentOS 8+** / RHEL 8+
- ✅ **macOS 11+**
- ✅ **Windows 10+** / Windows Server 2019+

### Software Richiesto

#### 1. Node.js (versione 18+)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (con Homebrew)
brew install node@18

# Windows (Scaricare da nodejs.org)
# Installare dalla pagina ufficiale: https://nodejs.org/
```

#### 2. PostgreSQL (versione 14+)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# Scaricare da: https://www.postgresql.org/download/windows/
```

#### 3. Git (opzionale)
```bash
# Ubuntu/Debian
sudo apt install git

# macOS
xcode-select --install

# Windows
# Scaricare da: https://git-scm.com/download/win
```

## 🗄️ Installazione Database

### 1. Configura PostgreSQL

```bash
# Accedi come utente postgres
sudo -u postgres psql

# Crea utente per l'applicazione
CREATE USER fiscalapp WITH PASSWORD 'FiscalApp2025!';

# Crea database
CREATE DATABASE fiscalrecorder OWNER fiscalapp;

# Assegna privilegi
GRANT ALL PRIVILEGES ON DATABASE fiscalrecorder TO fiscalapp;
GRANT ALL ON SCHEMA public TO fiscalapp;

# Esci da PostgreSQL
\q
```

### 2. Importa Schema Database

```bash
# Naviga nella directory database
cd database/

# Importa lo schema
PGPASSWORD="FiscalApp2025!" psql -h localhost -U fiscalapp -d fiscalrecorder -f schema.sql

# Verifica importazione
PGPASSWORD="FiscalApp2025!" psql -h localhost -U fiscalapp -d fiscalrecorder -c "\dt"
```

## 🚀 Setup Applicazione

### 1. Installa Dipendenze

```bash
# Naviga nella directory source
cd source/

# Installa dipendenze Node.js
npm install

# Se hai problemi con npm, prova con cache pulita
npm cache clean --force
npm install
```

### 2. Configura Variabili Ambiente

```bash
# Copia il file di esempio
cp .env.example .env

# Modifica le configurazioni
nano .env
```

Configura il file `.env`:
```env
# Database Configuration
DATABASE_URL="postgresql://fiscalapp:FiscalApp2025!@localhost:5432/fiscalrecorder"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_TIME="3600"

# Application Configuration
NODE_ENV="production"
PORT="5001"

# Optional: External Database
# EXTERNAL_DB_HOST="192.168.1.100"
# EXTERNAL_DB_PORT="1433"
```

### 3. Build Applicazione

```bash
# Build frontend e backend
npm run build

# Verifica che la build sia completata
ls -la dist/
```

## ⚙️ Configurazione

### 1. PM2 per Produzione (Raccomandato)

```bash
# Installa PM2 globalmente
npm install -g pm2

# Avvia applicazione con PM2
pm2 start ecosystem.config.cjs

# Salva configurazione PM2
pm2 save

# Configura avvio automatico
pm2 startup
# Segui le istruzioni visualizzate
```

### 2. Configurazione Nginx (Opzionale)

Se vuoi usare Nginx come reverse proxy:

```bash
# Installa Nginx
sudo apt install nginx

# Crea configurazione
sudo nano /etc/nginx/sites-available/fiscalrecorder
```

Configurazione Nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Abilita il sito
sudo ln -s /etc/nginx/sites-available/fiscalrecorder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🎬 Primo Avvio

### 1. Avvio Sviluppo

```bash
cd source/
npm run dev
```

### 2. Avvio Produzione

```bash
cd source/
npm start

# Oppure con PM2
pm2 start ecosystem.config.cjs
```

### 3. Verifica Installazione

Apri il browser e vai a:
- **Sviluppo:** http://localhost:5173
- **Produzione:** http://localhost:5001

### 4. Primo Setup

1. 🌐 Accedi all'interfaccia web
2. ⚙️ Vai alla sezione "Amministrazione"
3. 🏢 Configura i dati aziendali
4. 👤 Crea il primo utente amministratore
5. 🗃️ Testa la connessione database

## 🏭 Deploy Produzione

### 1. Configurazioni di Sicurezza

```bash
# Firewall (Ubuntu/Debian)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Se non usi Nginx, apri porta applicazione
sudo ufw allow 5001
```

### 2. SSL/HTTPS con Certbot

```bash
# Installa Certbot
sudo apt install certbot python3-certbot-nginx

# Ottieni certificato SSL
sudo certbot --nginx -d yourdomain.com

# Test rinnovo automatico
sudo certbot renew --dry-run
```

### 3. Backup Automatico

```bash
# Crea script di backup
sudo mkdir -p /opt/backups
sudo nano /opt/scripts/backup-db.sh
```

Script di backup:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fiscalrecorder_$DATE.sql"

mkdir -p $BACKUP_DIR
PGPASSWORD="FiscalApp2025!" pg_dump -h localhost -U fiscalapp fiscalrecorder > $BACKUP_FILE
gzip $BACKUP_FILE

# Rimuovi backup più vecchi di 7 giorni
find $BACKUP_DIR -name "fiscalrecorder_*.sql.gz" -mtime +7 -delete
```

```bash
# Rendi eseguibile e aggiungi a cron
sudo chmod +x /opt/scripts/backup-db.sh
sudo crontab -e

# Aggiungi questa linea per backup giornaliero alle 2:00
0 2 * * * /opt/scripts/backup-db.sh
```

## 🐛 Troubleshooting

### Problemi Comuni

#### Database non si connette
```bash
# Verifica stato PostgreSQL
sudo systemctl status postgresql

# Test connessione manuale
PGPASSWORD="FiscalApp2025!" psql -h localhost -U fiscalapp -d fiscalrecorder -c "SELECT 1;"

# Verifica log PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

#### Applicazione non si avvia
```bash
# Verifica log PM2
pm2 logs fiscalrecorder

# Verifica porte in uso
netstat -tlnp | grep :5001

# Test avvio manuale
cd source/
npm start
```

#### Problemi Build
```bash
# Pulisci cache e reinstalla
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

### Log e Monitoraggio

```bash
# Log applicazione (PM2)
pm2 logs fiscalrecorder

# Log sistema
journalctl -u nginx
journalctl -u postgresql

# Monitoraggio risorse
pm2 monit
htop
```

### Performance

```bash
# Ottimizzazione PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf

# Configurazioni consigliate:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# work_mem = 4MB
# maintenance_work_mem = 64MB

sudo systemctl restart postgresql
```

## 🆘 Supporto

Se incontri problemi:

1. 📖 Consulta la documentazione in `docs/`
2. 🔍 Verifica i log dell'applicazione
3. 🌐 Controlla la connettività database
4. 📧 Contatta il supporto tecnico

---

**✅ Installazione Completata!** La tua istanza di FiscalRecorder è ora pronta per l'uso.
