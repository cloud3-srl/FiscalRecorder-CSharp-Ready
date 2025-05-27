#!/bin/bash

# Script di deploy per FiscalRecorder
# Server: cloudpos.cloud3.cloud (65.108.89.211)

echo "🚀 Avvio deploy FiscalRecorder..."

# 1. Aggiornamento sistema
echo "📦 Aggiornamento sistema..."
apt update && apt upgrade -y

# 2. Installazione Node.js 18+ LTS
echo "📦 Installazione Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 3. Installazione PostgreSQL
echo "📦 Installazione PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 4. Installazione Nginx e PM2
echo "📦 Installazione Nginx e PM2..."
apt install -y nginx
npm install -g pm2

# 5. Installazione Certbot per SSL
echo "📦 Installazione Certbot..."
apt install -y certbot python3-certbot-nginx

# 6. Configurazione PostgreSQL
echo "🔧 Configurazione PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE fiscalrecorder;"
sudo -u postgres psql -c "CREATE USER fiscalapp WITH PASSWORD 'FiscalApp2025!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fiscalrecorder TO fiscalapp;"

# 7. Setup directory progetto
echo "📁 Setup directory progetto..."
mkdir -p /opt/fiscalrecorder
cd /opt/fiscalrecorder

# 8. Clone repository
echo "📥 Clone repository..."
if [ ! -d ".git" ]; then
    git clone https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready.git .
fi

# 9. Installazione dipendenze
echo "📦 Installazione dipendenze Node.js..."
npm install

# 10. Configurazione ambiente produzione
echo "🔧 Configurazione ambiente..."
cat > .env << EOF
DATABASE_URL="postgresql://fiscalapp:FiscalApp2025!@localhost:5432/fiscalrecorder"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_TIME="3600"
NODE_ENV="production"
PORT="5001"
EOF

# 11. Build applicazione
echo "🔨 Build applicazione..."
npm run build

# 12. Migrazioni database
echo "🗄️ Esecuzione migrazioni database..."
npm run db:push

# 13. Configurazione PM2
echo "🔧 Configurazione PM2..."
cat > ecosystem.config.js << EOF
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
EOF

# 14. Creazione directory logs
mkdir -p logs

# 15. Configurazione Nginx
echo "🔧 Configurazione Nginx..."
cat > /etc/nginx/sites-available/cloudpos.cloud3.cloud << EOF
server {
    listen 80;
    server_name cloudpos.cloud3.cloud;

    # Redirect all HTTP requests to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cloudpos.cloud3.cloud;

    # SSL configuration will be added by Certbot

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files
    location /assets {
        root /opt/fiscalrecorder/dist/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# 16. Abilitazione sito Nginx
ln -sf /etc/nginx/sites-available/cloudpos.cloud3.cloud /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 17. Test configurazione Nginx
nginx -t

# 18. Restart Nginx
systemctl restart nginx
systemctl enable nginx

# 19. Setup SSL con Certbot
echo "🔒 Configurazione SSL..."
certbot --nginx -d cloudpos.cloud3.cloud --non-interactive --agree-tos --email admin@cloud3.srl

# 20. Avvio applicazione con PM2
echo "🚀 Avvio applicazione..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 21. Setup backup database
echo "💾 Configurazione backup database..."
mkdir -p /opt/backups
cat > /opt/scripts/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DB_NAME="fiscalrecorder"
DB_USER="fiscalapp"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fiscalrecorder_$DATE.sql"

# Backup database
PGPASSWORD="FiscalApp2025!" pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_FILE

# Comprimi backup
gzip $BACKUP_FILE

# Rimuovi backup più vecchi di 7 giorni
find $BACKUP_DIR -name "fiscalrecorder_*.sql.gz" -mtime +7 -delete

echo "Backup completato: $BACKUP_FILE.gz"
EOF

chmod +x /opt/scripts/backup-db.sh

# 22. Cron job per backup
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/scripts/backup-db.sh") | crontab -

# 23. Firewall setup
echo "🔥 Configurazione firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

echo "✅ Deploy completato!"
echo "🌐 Sito disponibile su: https://cloudpos.cloud3.cloud"
echo "📊 PM2 status: pm2 status"
echo "📝 Logs: pm2 logs fiscalrecorder"
echo "💾 Backup test: /opt/scripts/backup-db.sh"
