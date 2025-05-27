# 🔐 Credenziali e Configurazioni Deploy CloudPos

## 📋 Informazioni Server

**Server di Produzione:**
- **Host:** 65.108.89.211
- **Dominio:** cloudpos.cloud3.cloud
- **Sistema:** Ubuntu 24.04.1 LTS (ARM64)
- **Provider:** Hetzner Cloud

## 🔑 Accesso SSH

**Utente:** root
**Password:** !Localcloud3

**Chiave SSH Privata:** ~/.ssh/cloudpos_key
**Chiave SSH Pubblica:** ~/.ssh/cloudpos_key.pub

**Comando di accesso:**
```bash
ssh root@65.108.89.211
# oppure con chiave SSH:
ssh -i ~/.ssh/cloudpos_key root@65.108.89.211
```

## 🗄️ Database PostgreSQL

**Host:** localhost
**Porta:** 5432
**Database:** fiscalrecorder
**Utente:** fiscalapp
**Password:** FiscalApp2025!

**Stringa di connessione:**
```
postgresql://fiscalapp:FiscalApp2025!@localhost:5432/fiscalrecorder
```

**Accesso diretto:**
```bash
sudo -u postgres psql -d fiscalrecorder
# oppure con utente applicazione:
PGPASSWORD="FiscalApp2025!" psql -h localhost -U fiscalapp -d fiscalrecorder
```

## 🔐 Certificati SSL

**Provider:** Let's Encrypt
**Email:** admin@cloud3.srl
**Certificato:** /etc/letsencrypt/live/cloudpos.cloud3.cloud/fullchain.pem
**Chiave privata:** /etc/letsencrypt/live/cloudpos.cloud3.cloud/privkey.pem
**Scadenza:** 25 agosto 2025 (rinnovo automatico)

## 🚀 Applicazione

**Directory:** /opt/fiscalrecorder
**Porta:** 5001
**Ambiente:** production
**Process Manager:** PM2 (2 istanze cluster)

**JWT Configuration:**
- **Secret:** Generato dinamicamente con OpenSSL
- **Algorithm:** HS256
- **Expiration:** 3600 secondi (1 ora)

## 📁 Percorsi Importanti

**Applicazione:** /opt/fiscalrecorder
**Logs PM2:** /opt/fiscalrecorder/logs/
**Script backup:** /opt/scripts/backup-db.sh
**Backup database:** /opt/backups/
**Configurazione Nginx:** /etc/nginx/sites-available/cloudpos.cloud3.cloud

## 🛠️ Comandi Amministrazione

### PM2 Management
```bash
pm2 status                    # Stato processi
pm2 logs fiscalrecorder       # Visualizza logs
pm2 restart fiscalrecorder    # Riavvia applicazione
pm2 reload fiscalrecorder     # Reload zero-downtime
pm2 save                      # Salva configurazione
pm2 startup                   # Configura avvio automatico
```

### Database Management
```bash
# Backup manuale
/opt/scripts/backup-db.sh

# Accesso database
sudo -u postgres psql -d fiscalrecorder

# Migrazioni (da directory app)
cd /opt/fiscalrecorder && npm run db:push
```

### Nginx Management
```bash
systemctl status nginx        # Stato Nginx
systemctl restart nginx       # Riavvia Nginx
nginx -t                      # Test configurazione
```

### SSL Management
```bash
certbot renew                 # Rinnovo certificati (automatico)
certbot certificates          # Lista certificati
```

## 📊 Monitoraggio

**URL Produzione:** https://cloudpos.cloud3.cloud
**Status Check:** curl -I https://cloudpos.cloud3.cloud

### Log Locations
- **PM2 Logs:** /opt/fiscalrecorder/logs/
- **Nginx Logs:** /var/log/nginx/
- **SSL Logs:** /var/log/letsencrypt/

## 💾 Backup Automatico

**Schedule:** Ogni giorno alle 02:00
**Script:** /opt/scripts/backup-db.sh
**Destinazione:** /opt/backups/
**Retention:** 7 giorni
**Formato:** fiscalrecorder_YYYYMMDD_HHMMSS.sql.gz

**Crontab:**
```bash
0 2 * * * /opt/scripts/backup-db.sh
```

## 🔥 Firewall

**Porte aperte:**
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)

```bash
ufw status                    # Stato firewall
```

## 📋 File di Configurazione

### .env (Produzione)
```bash
DATABASE_URL="postgresql://fiscalapp:FiscalApp2025!@localhost:5432/fiscalrecorder"
JWT_SECRET="[generato dinamicamente]"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_TIME="3600"
NODE_ENV="production"
PORT="5001"
```

### ecosystem.config.cjs (PM2)
```javascript
module.exports = {
  apps: [{
    name: 'fiscalrecorder',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## 🔄 Deploy Updates

Per aggiornare l'applicazione:
```bash
cd /opt/fiscalrecorder
git pull origin main
npm install
npm run build
npm run db:push
pm2 reload fiscalrecorder
```

## 🚨 Troubleshooting

### Check Status
```bash
systemctl status nginx
systemctl status postgresql
pm2 status
```

### Common Issues
- **Port già in uso:** `lsof -i :5001`
- **Database connessione:** Verificare credenziali in .env
- **SSL problemi:** `certbot renew --dry-run`
- **Permessi file:** `chown -R root:root /opt/fiscalrecorder`

---

**⚠️ SICUREZZA:** Questo file contiene credenziali sensibili. Conservare in modo sicuro e non condividere pubblicamente.

**📅 Creato:** 27 maggio 2025
**👤 Autore:** Deploy automatico CloudPos
**🔄 Ultimo aggiornamento:** 27 maggio 2025, 11:40 AM
