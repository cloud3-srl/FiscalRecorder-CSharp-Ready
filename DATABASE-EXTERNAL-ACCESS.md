# 🌐 Accesso Esterno PostgreSQL - Configurazione Completata

## ✅ Configurazione Applicata

PostgreSQL è stato configurato per accettare connessioni esterne su CloudPos server (65.108.89.211).

### 🔧 Modifiche Applicate

#### 1. PostgreSQL Configuration (postgresql.conf)
```bash
# File: /etc/postgresql/16/main/postgresql.conf
listen_addresses = '*'  # Era: #listen_addresses = 'localhost'
```

#### 2. Host-Based Authentication (pg_hba.conf)
```bash
# File: /etc/postgresql/16/main/pg_hba.conf
# Aggiunta la riga:
host    fiscalrecorder  fiscalapp       0.0.0.0/0               md5
```

#### 3. Firewall Configuration
```bash
# Porta PostgreSQL aperta per connessioni esterne
ufw allow 5432/tcp
```

#### 4. Service Restart
```bash
# PostgreSQL riavviato per applicare le configurazioni
systemctl restart postgresql
```

## 🔍 Verifica Configurazione

### Status PostgreSQL
```
● postgresql.service - PostgreSQL RDBMS
     Active: active (exited)
```

### Porte in Ascolto
```
tcp        0      0 0.0.0.0:5432            0.0.0.0:*               LISTEN      postgres
tcp6       0      0 :::5432                 :::*                    LISTEN      postgres
```

✅ **PostgreSQL accetta connessioni su tutte le interfacce (0.0.0.0:5432)**

## 🌐 Dettagli Connessione

### Informazioni Database
- **Host:** 65.108.89.211
- **Porta:** 5432
- **Database:** fiscalrecorder
- **Utente:** fiscalapp
- **Password:** FiscalApp2025!

### String di Connessione
```bash
# PostgreSQL URL
postgresql://fiscalapp:FiscalApp2025!@65.108.89.211:5432/fiscalrecorder

# psql command line
PGPASSWORD="FiscalApp2025!" psql -h 65.108.89.211 -U fiscalapp -d fiscalrecorder

# Node.js (esempio)
const client = new Client({
  host: '65.108.89.211',
  port: 5432,
  database: 'fiscalrecorder',
  user: 'fiscalapp',
  password: 'FiscalApp2025!'
});
```

## 🔒 Sicurezza

### Configurazione Attuale
- ✅ **Autenticazione MD5** richiesta per tutte le connessioni
- ✅ **Accesso limitato** al database `fiscalrecorder` per utente `fiscalapp`
- ✅ **Firewall configurato** per porta 5432
- ⚠️ **Accesso globale** (0.0.0.0/0) - considera limitare agli IP necessari

### Raccomandazioni Sicurezza

#### 1. Limitare Accesso per IP (Raccomandato)
```bash
# Modifica /etc/postgresql/16/main/pg_hba.conf
# Sostituisci 0.0.0.0/0 con IP specifici:

# Esempio: Solo per IP specifici
host    fiscalrecorder  fiscalapp       192.168.1.0/24          md5
host    fiscalrecorder  fiscalapp       10.0.0.0/8              md5

# Riavvia PostgreSQL
systemctl restart postgresql
```

#### 2. SSL/TLS (Opzionale)
```bash
# Abilita SSL in postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

#### 3. Monitoraggio Connessioni
```bash
# Log connessioni in postgresql.conf
log_connections = on
log_disconnections = on
log_hostname = on

# Monitora log
tail -f /var/log/postgresql/postgresql-16-main.log
```

## 🧪 Test Connessione

### Da Locale
```bash
# Test connessione da macchina locale
PGPASSWORD="FiscalApp2025!" psql -h 65.108.89.211 -U fiscalapp -d fiscalrecorder -c "SELECT version();"
```

### Da Applicazione
```javascript
// Test con Node.js
const { Client } = require('pg');

const client = new Client({
  host: '65.108.89.211',
  port: 5432,
  database: 'fiscalrecorder',
  user: 'fiscalapp',
  password: 'FiscalApp2025!'
});

async function testConnection() {
  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Connessione riuscita:', result.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Errore connessione:', err);
  }
}

testConnection();
```

## 🔧 Troubleshooting

### Problema: Connection timeout
```bash
# Verifica firewall locale
telnet 65.108.89.211 5432

# Verifica firewall server
ssh root@65.108.89.211 'ufw status | grep 5432'
```

### Problema: Authentication failed
```bash
# Verifica configurazione pg_hba.conf
ssh root@65.108.89.211 'cat /etc/postgresql/16/main/pg_hba.conf | grep fiscalrecorder'

# Verifica utente esiste
ssh root@65.108.89.211 'sudo -u postgres psql -c "\du fiscalapp"'
```

### Problema: Database non trovato
```bash
# Verifica database esiste
ssh root@65.108.89.211 'sudo -u postgres psql -c "\l" | grep fiscalrecorder'
```

## 📋 Backup File Configurazione

I file originali sono stati salvati come backup:
- `/etc/postgresql/16/main/postgresql.conf.backup`
- `/etc/postgresql/16/main/pg_hba.conf.backup`

### Ripristino (se necessario)
```bash
# Ripristina configurazione originale
cp /etc/postgresql/16/main/postgresql.conf.backup /etc/postgresql/16/main/postgresql.conf
cp /etc/postgresql/16/main/pg_hba.conf.backup /etc/postgresql/16/main/pg_hba.conf
systemctl restart postgresql
```

## 🎯 Utilizzo in FiscalRecorder

### File .env
```env
# Database remoto configurato
DATABASE_URL=postgresql://fiscalapp:FiscalApp2025!@65.108.89.211:5432/fiscalrecorder
```

### Test Applicazione
```bash
# Dalla directory locale del progetto
cd fiscalrecorder-release/source/
npm install
npm run dev

# L'applicazione dovrebbe connettersi al database remoto
```

---

**✅ PostgreSQL CloudPos ora accetta connessioni esterne!**

Server: **65.108.89.211:5432**  
Database: **fiscalrecorder**  
Utente: **fiscalapp**
