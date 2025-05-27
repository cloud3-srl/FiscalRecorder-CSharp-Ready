#!/bin/bash

# ==============================================
# FISCALRECORDER - SCRIPT INSTALLAZIONE AUTOMATICA
# ==============================================
# Versione: 1.0.0
# Sistema: Ubuntu/Debian

set -e  # Esci se un comando fallisce

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configurazioni
DB_NAME="fiscalrecorder"
DB_USER="fiscalapp"
DB_PASSWORD="FiscalApp2025!"
APP_DIR="/opt/fiscalrecorder"
BACKUP_DIR="/opt/backups/fiscalrecorder"

# Funzioni di utilità
print_header() {
    echo -e "${PURPLE}"
    echo "=============================================="
    echo " 🧾 FISCALRECORDER - INSTALLAZIONE AUTOMATICA"
    echo "=============================================="
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Questo script deve essere eseguito come root"
        echo "Esegui: sudo $0"
        exit 1
    fi
}

check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Sistema operativo non supportato"
        exit 1
    fi
    
    . /etc/os-release
    if [[ $ID != "ubuntu" && $ID != "debian" ]]; then
        log_warn "Sistema non testato: $PRETTY_NAME"
        read -p "Continuare comunque? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

install_dependencies() {
    log_step "Installazione dipendenze sistema..."
    
    apt update
    apt install -y curl wget gnupg lsb-release build-essential software-properties-common
    
    log_info "✅ Dipendenze installate"
}

install_nodejs() {
    log_step "Installazione Node.js 18..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        if [[ ${NODE_VERSION%%.*} -ge 18 ]]; then
            log_info "✅ Node.js già installato: v$NODE_VERSION"
            return
        fi
    fi
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    log_info "✅ Node.js installato: $(node --version)"
}

install_postgresql() {
    log_step "Installazione PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        log_info "✅ PostgreSQL già installato"
    else
        apt install -y postgresql postgresql-contrib
        systemctl enable postgresql
        systemctl start postgresql
        log_info "✅ PostgreSQL installato"
    fi
}

setup_database() {
    log_step "Configurazione database..."
    
    # Crea utente e database
    sudo -u postgres psql <<EOF
-- Crea utente se non esiste
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Crea database se non esiste
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Assegna privilegi
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

    log_info "✅ Database configurato"
}

install_application() {
    log_step "Installazione applicazione..."
    
    # Crea directory applicazione
    mkdir -p $APP_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /var/log/fiscalrecorder
    
    # Copia file sorgente
    if [[ -d "./source" ]]; then
        cp -r ./source/* $APP_DIR/
        log_info "✅ File applicazione copiati"
    else
        log_error "Directory source non trovata!"
        exit 1
    fi
    
    # Configura permessi
    chown -R www-data:www-data $APP_DIR
    chmod +x $APP_DIR/dist/index.js 2>/dev/null || true
}

configure_environment() {
    log_step "Configurazione ambiente..."
    
    cd $APP_DIR
    
    # Copia configurazione di esempio
    if [[ ! -f .env ]]; then
        cp .env.example .env
        
        # Sostituisci password di default
        sed -i "s/PASSWORD_HERE/$DB_PASSWORD/g" .env
        
        # Genera JWT secret
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        sed -i "s/your-super-secret-jwt-key-min-32-chars-here/$JWT_SECRET/g" .env
        
        log_info "✅ File .env configurato"
    else
        log_warn "File .env già esistente, saltato"
    fi
    
    # Installa dipendenze Node.js
    npm install
    log_info "✅ Dipendenze Node.js installate"
    
    # Build applicazione
    npm run build
    log_info "✅ Applicazione compilata"
}

import_database_schema() {
    log_step "Importazione schema database..."
    
    if [[ -f "./database/schema.sql" ]]; then
        PGPASSWORD="$DB_PASSWORD" psql -h localhost -U $DB_USER -d $DB_NAME -f ./database/schema.sql
        log_info "✅ Schema database importato"
    else
        log_warn "File schema.sql non trovato, saltato"
    fi
}

install_pm2() {
    log_step "Installazione PM2..."
    
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        log_info "✅ PM2 installato"
    else
        log_info "✅ PM2 già installato"
    fi
    
    # Configura PM2 per startup automatico
    pm2 startup systemd -u www-data --hp /var/www
    
    log_info "✅ PM2 configurato"
}

setup_firewall() {
    log_step "Configurazione firewall..."
    
    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw allow ssh
        ufw allow 80
        ufw allow 443
        ufw allow 5001
        log_info "✅ Firewall configurato"
    else
        log_warn "UFW non installato, configurazione firewall saltata"
    fi
}

start_application() {
    log_step "Avvio applicazione..."
    
    cd $APP_DIR
    
    # Avvia con PM2
    sudo -u www-data pm2 start ecosystem.config.cjs 2>/dev/null || \
    sudo -u www-data pm2 start dist/index.js --name fiscalrecorder
    
    # Salva configurazione PM2
    sudo -u www-data pm2 save
    
    # Aspetta un momento per l'avvio
    sleep 5
    
    # Verifica status
    if sudo -u www-data pm2 status | grep -q "online"; then
        log_info "✅ Applicazione avviata con successo"
    else
        log_error "❌ Errore nell'avvio dell'applicazione"
        sudo -u www-data pm2 logs fiscalrecorder --lines 10
        exit 1
    fi
}

setup_backup() {
    log_step "Configurazione backup automatico..."
    
    # Crea script di backup
    cat > /opt/scripts/backup-fiscalrecorder.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/fiscalrecorder"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
PGPASSWORD="FiscalApp2025!" pg_dump -h localhost -U fiscalapp fiscalrecorder | gzip > "$BACKUP_DIR/fiscalrecorder_$DATE.sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
EOF
    
    chmod +x /opt/scripts/backup-fiscalrecorder.sh
    
    # Aggiungi a crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/scripts/backup-fiscalrecorder.sh") | crontab -
    
    log_info "✅ Backup automatico configurato"
}

print_completion() {
    echo -e "${GREEN}"
    echo "=============================================="
    echo " 🎉 INSTALLAZIONE COMPLETATA CON SUCCESSO!"
    echo "=============================================="
    echo -e "${NC}"
    echo
    echo -e "${BLUE}📍 URL Applicazione:${NC} http://$(hostname -I | awk '{print $1}'):5001"
    echo -e "${BLUE}📍 URL Locale:${NC} http://localhost:5001"
    echo
    echo -e "${YELLOW}🔧 Comandi Utili:${NC}"
    echo "  • Status:     sudo -u www-data pm2 status"
    echo "  • Log:        sudo -u www-data pm2 logs fiscalrecorder"
    echo "  • Restart:    sudo -u www-data pm2 restart fiscalrecorder"
    echo "  • Stop:       sudo -u www-data pm2 stop fiscalrecorder"
    echo
    echo -e "${YELLOW}📁 Directory Importanti:${NC}"
    echo "  • Applicazione: $APP_DIR"
    echo "  • Backup:       $BACKUP_DIR"
    echo "  • Log:          /var/log/fiscalrecorder"
    echo
    echo -e "${GREEN}🚀 FiscalRecorder è ora pronto per l'uso!${NC}"
}

# ==============================================
# ESECUZIONE SCRIPT
# ==============================================

main() {
    print_header
    
    log_info "Inizio installazione FiscalRecorder..."
    
    check_root
    check_os
    install_dependencies
    install_nodejs
    install_postgresql
    setup_database
    install_application
    configure_environment
    import_database_schema
    install_pm2
    setup_firewall
    start_application
    setup_backup
    
    print_completion
}

# Verifica se script è eseguito direttamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
