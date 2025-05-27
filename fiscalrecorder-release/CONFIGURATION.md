# 🔧 Guida di Configurazione - FiscalRecorder

Questa guida ti aiuterà a configurare correttamente FiscalRecorder per il tuo ambiente specifico.

## 📋 Indice

1. [Configurazione Database](#-configurazione-database)
2. [Variabili Ambiente](#-variabili-ambiente)
3. [Configurazione PM2](#-configurazione-pm2)
4. [Reverse Proxy](#-reverse-proxy)
5. [SSL/HTTPS](#-sslhttps)
6. [Backup Automatico](#-backup-automatico)
7. [Monitoraggio](#-monitoraggio)
8. [Ottimizzazioni](#-ottimizzazioni)

## 🗄️ Configurazione Database

### PostgreSQL Setup Dettagliato

#### 1. Configurazione postgresql.conf
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```conf
# Connessioni
listen_addresses = 'localhost'          # Solo connessioni locali
port = 5432                            # Porta standard
max_connections = 200                   # Connessioni simultanee

# Memoria
shared_buffers = 256MB                  # 25% della RAM
effective_cache_size = 1GB              # 75% della RAM  
work_mem = 4MB                         # Per query singole
maintenance_work_mem = 64MB            # Per maintenance

# Write Ahead Log (WAL)
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_min_duration_statement = 1000      # Log query > 1s

# Locale
lc_messages = 'en_US.UTF-8'
lc_monetary = 'it_IT.UTF-8'            # Formato monetario italiano
lc_numeric = 'it_IT.UTF-8'
lc_time = 'it_IT.UTF-8'
```

#### 2. Configurazione pg_hba.conf
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

```conf
# Configurazione accessi
local   all             postgres                                peer
local   all             all                                     peer
host    fiscalrecorder  fiscalapp       127.0.0.1/32           md5
host    fiscalrecorder  fiscalapp       ::1/128                md5

# Connessioni remote (solo se necessario)
# host    fiscalrecorder  fiscalapp       192.168.1.0/24         md5
```

#### 3. Ottimizzazioni Database
```sql
-- Connessione come superuser
sudo -u postgres psql fiscalrecorder

-- Analisi automatica
ALTER DATABASE fiscalrecorder SET log_statement_stats = off;
ALTER DATABASE fiscalrecorder SET log_parser_stats = off;
ALTER DATABASE fiscalrecorder SET log_planner_stats = off;
ALTER DATABASE fiscalrecorder SET log_executor_stats = off;

-- Ottimizzazioni specifiche
VACUUM ANALYZE;

-- Index maintenance
REINDEX DATABASE fiscalrecorder;

-- Statistiche estese per query optimizer
ALTER DATABASE fiscalrecorder SET default_statistics_target = 100;
```

## 🌐 Variabili Ambiente

### File .env Completo
```env
# ==============================================
# FISCALRECORDER CONFIGURATION
# ==============================================

# Application
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# Database Principal (PostgreSQL)
DATABASE_URL=postgresql://fiscalapp:FiscalApp2025!@localhost:5432/fiscalrecorder

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_TIME=3600

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# External Database (SQL Server - Opzionale)
EXTERNAL_DB_ENABLED=false
EXTERNAL_DB_HOST=192.168.1.100
EXTERNAL_DB_PORT=1433
EXTERNAL_DB_NAME=database_name
EXTERNAL_DB_USER=sql_user
EXTERNAL_DB_PASSWORD=sql_password
EXTERNAL_DB_ENCRYPT=true
EXTERNAL_DB_TRUST_CERT=false

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf

# Email (Opzionale)
SMTP_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_PATH=/opt/backups/fiscalrecorder
BACKUP_RETENTION_DAYS=30

# Development (Solo per NODE_ENV=development)
VITE_DEV_PORT=5173
VITE_API_URL=http://localhost:5001/api
```

### Sicurezza Password
```bash
# Genera JWT Secret sicuro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Genera password sicura
openssl rand -base64 32
```

## 🚀 Configurazione PM2

### File ecosystem.config.cjs
```javascript
module.exports = {
  apps: [{
    name: 'fiscalrecorder',
    script: './dist/index.js',
    instances: 2,                    // Numero di istanze (cores)
    exec_mode: 'cluster',            // Modalità cluster
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    
    // Restart Policy
    restart_delay: 4000,             // Delay restart (ms)
    max_memory_restart: '1G',        // Restart se > 1GB RAM
    min_uptime: '10s',               // Uptime minimo
    max_restarts: 5,                 // Max restart consecutivi
    
    // Logging
    log_file: './logs/pm2-combined.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Monitoring
    pmx: true,
    
    // Auto restart su cambi file (sviluppo)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Configurazione cluster
    instance_var: 'INSTANCE_ID',
    
    // Cron per restart notturno
    cron_restart: '0 3 * * *',      // Restart alle 3:00 ogni notte
    
    // Shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000
  }],
  
  // Deploy configuration (opzionale)
  deploy: {
    production: {
      user: 'fiscalapp',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/fiscalrecorder.git',
      path: '/opt/fiscalrecorder',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production'
    }
  }
};
```

### Comandi PM2 Utili
```bash
# Avvio applicazione
pm2 start ecosystem.config.cjs

# Monitoraggio
pm2 monit
pm2 status
pm2 logs fiscalrecorder

# Restart e reload
pm2 restart fiscalrecorder
pm2 reload fiscalrecorder        # Zero-downtime restart

# Scaling
pm2 scale fiscalrecorder +2       # Aggiungi 2 istanze
pm2 scale fiscalrecorder 4        # Scala a 4 istanze

# Startup automatico
pm2 startup
pm2 save
```

## 🌐 Reverse Proxy

### Nginx Configurazione Completa
```nginx
# /etc/nginx/sites-available/fiscalrecorder
upstream fiscalrecorder {
    least_conn;
    server 127.0.0.1:5001 max_fails=3 fail_timeout=30s;
    # Aggiungi più backend se hai multiple istanze
    # server 127.0.0.1:5002 max_fails=3 fail_timeout=30s;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

server {
    listen 80;
    server_name fiscalrecorder.yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
    
    # File upload size
    client_max_body_size 10M;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri @backend;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://fiscalrecorder;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }
    
    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://fiscalrecorder;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Default proxy
    location @backend {
        proxy_pass http://fiscalrecorder;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Main location
    location / {
        try_files $uri $uri/ @backend;
    }
    
    # Health check
    location /health {
        access_log off;
        proxy_pass http://fiscalrecorder/api/health;
    }
}
```

## 🔒 SSL/HTTPS

### Let's Encrypt con Certbot
```bash
# Installazione Certbot
sudo apt install certbot python3-certbot-nginx

# Ottieni certificato
sudo certbot --nginx -d fiscalrecorder.yourdomain.com

# Verifica rinnovo automatico
sudo certbot renew --dry-run

# Configurazione auto-renewal
sudo crontab -e
# Aggiungi:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Configurazione SSL Nginx
```nginx
# Configurazione automatica di Certbot
server {
    listen 443 ssl http2;
    server_name fiscalrecorder.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/fiscalrecorder.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fiscalrecorder.yourdomain.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # ... resto della configurazione
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name fiscalrecorder.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📦 Backup Automatico

### Script di Backup Avanzato
```bash
#!/bin/bash
# /opt/scripts/backup-fiscalrecorder.sh

# Configurazioni
BACKUP_DIR="/opt/backups/fiscalrecorder"
DB_NAME="fiscalrecorder"
DB_USER="fiscalapp"
DB_HOST="localhost"
APP_DIR="/opt/fiscalrecorder"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Crea directory backup
mkdir -p "$BACKUP_DIR"/{database,uploads,config,logs}

log "Inizio backup FiscalRecorder..."

# 1. Backup Database
log "Backup database PostgreSQL..."
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/database/fiscalrecorder_$DATE.sql.gz"

if [[ $? -eq 0 ]]; then
    log "✅ Database backup completato"
else
    error "❌ Database backup fallito"
    exit 1
fi

# 2. Backup file configurazione
log "Backup configurazioni..."
cp "$APP_DIR/.env" "$BACKUP_DIR/config/.env_$DATE" 2>/dev/null
cp "$APP_DIR/ecosystem.config.cjs" "$BACKUP_DIR/config/ecosystem.config_$DATE.cjs" 2>/dev/null

# 3. Backup uploads (se esistono)
if [[ -d "$APP_DIR/uploads" ]]; then
    log "Backup uploads..."
    tar -czf "$BACKUP_DIR/uploads/uploads_$DATE.tar.gz" -C "$APP_DIR" uploads/
fi

# 4. Backup log recenti
log "Backup log..."
find "$APP_DIR/logs" -name "*.log" -mtime -1 -exec cp {} "$BACKUP_DIR/logs/" \; 2>/dev/null

# 5. Pulizia backup vecchi
log "Pulizia backup vecchi (>${RETENTION_DAYS} giorni)..."
find "$BACKUP_DIR" -name "*_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*_*" -mtime +$RETENTION_DAYS -delete

# 6. Verifica spazio disco
DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [[ $DISK_USAGE -gt 85 ]]; then
    warn "Spazio disco basso: ${DISK_USAGE}%"
fi

# 7. Report finale
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "✅ Backup completato! Dimensione totale: $BACKUP_SIZE"

# 8. Test restore (opzionale, commentato)
# log "Test restore database..."
# gunzip < "$BACKUP_DIR/database/fiscalrecorder_$DATE.sql.gz" | head -20 > /dev/null
# if [[ $? -eq 0 ]]; then
#     log "✅ Backup database verificato"
# else
#     error "❌ Backup database corrotto"
# fi

log "Backup processo completato alle $(date)"
```

### Configurazione Cron
```bash
# Backup giornaliero alle 2:00
0 2 * * * /opt/scripts/backup-fiscalrecorder.sh >> /var/log/backup-fiscalrecorder.log 2>&1

# Backup settimanale più completo (domenica alle 3:00)
0 3 * * 0 /opt/scripts/backup-fiscalrecorder-full.sh >> /var/log/backup-fiscalrecorder-full.log 2>&1
```

## 📊 Monitoraggio

### Script di Health Check
```bash
#!/bin/bash
# /opt/scripts/healthcheck-fiscalrecorder.sh

API_URL="http://localhost:5001/api/health"
LOG_FILE="/var/log/healthcheck-fiscalrecorder.log"

check_service() {
    local service=$1
    local url=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [[ $response -eq 200 ]]; then
        echo "[$(date)] ✅ $service: OK" >> "$LOG_FILE"
        return 0
    else
        echo "[$(date)] ❌ $service: FAILED (HTTP: $response)" >> "$LOG_FILE"
        return 1
    fi
}

# Check Application
if ! check_service "FiscalRecorder API" "$API_URL"; then
    # Restart if down
    echo "[$(date)] 🔄 Restarting FiscalRecorder..." >> "$LOG_FILE"
    pm2 restart fiscalrecorder
fi

# Check Database
if ! PGPASSWORD="FiscalApp2025!" psql -h localhost -U fiscalapp -d fiscalrecorder -c "SELECT 1;" > /dev/null 2>&1; then
    echo "[$(date)] ❌ Database: FAILED" >> "$LOG_FILE"
else
    echo "[$(date)] ✅ Database: OK" >> "$LOG_FILE"
fi

# Check Disk Space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [[ $DISK_USAGE -gt 85 ]]; then
    echo "[$(date)] ⚠️ Disk Usage: ${DISK_USAGE}% (HIGH)" >> "$LOG_FILE"
fi
```

## ⚡ Ottimizzazioni

### Node.js Performance
```bash
# .env aggiunte per performance
NODE_OPTIONS="--max-old-space-size=1024 --optimize-for-size"
UV_THREADPOOL_SIZE=8
```

### Database Optimization
```sql
-- Configurazioni periodiche
ANALYZE;
VACUUM (ANALYZE, VERBOSE);

-- Index specifici per performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
```

### Sistema Operativo
```bash
# Kernel parameters per performance
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 8192' >> /etc/sysctl.conf
echo 'vm.swappiness = 10' >> /etc/sysctl.conf

# Applicazione
sysctl -p
```

---

**🎯 Configurazione Completata!** Il tuo sistema FiscalRecorder è ora ottimizzato per l'ambiente di produzione.
