#!/bin/bash

# ============================================================================
# FiscalRecorder - Installazione Express
# Script di installazione automatica per sistemi Unix/Linux/macOS
# ============================================================================

set -e  # Esce al primo errore

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurazione
FISCAL_RECORDER_VERSION="1.0.0"
INSTALL_DIR="$HOME/FiscalRecorder"
BACKUP_DIR="$HOME/FiscalRecorder-backup-$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/tmp/fiscalrecorder-install.log"

# URL del repository (sostituire con l'URL reale)
REPO_URL="https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready.git"
ZIP_URL="https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready/archive/refs/heads/main.zip"

# Funzioni di utilità
print_header() {
    echo -e "${BLUE}"
    echo "============================================================================"
    echo "                    FiscalRecorder - Installazione Express"
    echo "                              Versione $FISCAL_RECORDER_VERSION"
    echo "============================================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ Errore: $1${NC}"
    echo "Dettagli salvati in: $LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}⚠ Attenzione: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verifica requisiti di sistema
check_requirements() {
    print_info "Verifica requisiti di sistema..."
    
    # Verifica OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_success "Sistema operativo: Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_success "Sistema operativo: macOS"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        print_success "Sistema operativo: Windows (Git Bash/WSL)"
    else
        print_error "Sistema operativo non supportato: $OSTYPE"
        exit 1
    fi
    
    # Verifica comandi necessari
    local required_commands=("curl" "unzip")
    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            print_success "Comando trovato: $cmd"
        else
            print_warning "Comando mancante: $cmd"
            if [[ "$OS" == "linux" ]]; then
                print_info "Installazione con: sudo apt-get install $cmd (Ubuntu/Debian) o sudo yum install $cmd (CentOS/RHEL)"
            elif [[ "$OS" == "macos" ]]; then
                print_info "Installazione con: brew install $cmd"
            fi
        fi
    done
    
    # Verifica Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js trovato: $NODE_VERSION"
        
        # Verifica versione minima (14.0.0)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [[ $NODE_MAJOR -ge 14 ]]; then
            print_success "Versione Node.js compatibile"
        else
            print_warning "Versione Node.js troppo vecchia. Minima richiesta: v14.0.0"
        fi
    else
        print_warning "Node.js non trovato"
        print_info "Scarica da: https://nodejs.org/"
        read -p "Continuare senza Node.js? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Verifica spazio disco (500MB)
    local available_space
    if [[ "$OS" == "macos" ]]; then
        available_space=$(df -m "$HOME" | awk 'NR==2 {print $4}')
    else
        available_space=$(df -m "$HOME" | awk 'NR==2 {print $4}')
    fi
    
    if [[ $available_space -gt 500 ]]; then
        print_success "Spazio disco sufficiente: ${available_space}MB disponibili"
    else
        print_warning "Spazio disco limitato: ${available_space}MB disponibili (500MB richiesti)"
    fi
}

# Backup installazione esistente
backup_existing() {
    if [[ -d "$INSTALL_DIR" ]]; then
        print_info "Backup installazione esistente..."
        mv "$INSTALL_DIR" "$BACKUP_DIR"
        print_success "Backup salvato in: $BACKUP_DIR"
    fi
}

# Download del codice sorgente
download_source() {
    print_info "Download del codice sorgente..."
    
    # Crea directory di installazione
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Prova con git prima, poi fallback a ZIP
    if command -v git &> /dev/null; then
        print_info "Download tramite Git..."
        if git clone "$REPO_URL" . >> "$LOG_FILE" 2>&1; then
            print_success "Download completato tramite Git"
            return 0
        else
            print_warning "Download Git fallito, provo con ZIP..."
        fi
    fi
    
    # Fallback a download ZIP
    print_info "Download tramite ZIP..."
    if curl -L "$ZIP_URL" -o source.zip >> "$LOG_FILE" 2>&1; then
        unzip -q source.zip
        # Sposta i contenuti dalla cartella estratta
        mv FiscalRecorder-CSharp-Ready-main/* . 2>/dev/null || mv FiscalRecorder-CSharp-Ready-*/* .
        rm -rf FiscalRecorder-CSharp-Ready-* source.zip
        print_success "Download ZIP completato"
    else
        print_error "Impossibile scaricare il codice sorgente"
        exit 1
    fi
}

# Installazione dipendenze
install_dependencies() {
    print_info "Installazione dipendenze..."
    
    if command -v npm &> /dev/null; then
        print_info "Installazione dipendenze Node.js..."
        npm install >> "$LOG_FILE" 2>&1
        print_success "Dipendenze Node.js installate"
        
        # Build del client
        print_info "Build dell'applicazione client..."
        npm run build >> "$LOG_FILE" 2>&1
        print_success "Build client completata"
    else
        print_warning "npm non trovato, saltando installazione dipendenze Node.js"
    fi
}

# Configurazione database
setup_database() {
    print_info "Configurazione database..."
    
    # Crea directory per database
    mkdir -p "$INSTALL_DIR/data"
    
    # Copia schema database se esiste
    if [[ -f "$INSTALL_DIR/database/schema.sql" ]]; then
        cp "$INSTALL_DIR/database/schema.sql" "$INSTALL_DIR/data/"
        print_success "Schema database copiato"
    fi
    
    print_success "Database SQLite configurato"
}

# Creazione script di avvio
create_launcher() {
    print_info "Creazione script di avvio..."
    
    # Script di avvio Unix
    cat > "$INSTALL_DIR/start-fiscalrecorder.sh" << 'EOF'
#!/bin/bash

# FiscalRecorder - Script di avvio
cd "$(dirname "$0")"

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "Errore: Node.js non trovato"
    echo "Scarica da: https://nodejs.org/"
    exit 1
fi

# Avvia il server
echo "Avvio FiscalRecorder..."
echo "Server disponibile su: http://localhost:3000"
echo "Premi Ctrl+C per fermare il server"

npm start
EOF

    chmod +x "$INSTALL_DIR/start-fiscalrecorder.sh"
    print_success "Script di avvio creato"
    
    # Desktop entry per Linux
    if [[ "$OS" == "linux" && -d "$HOME/.local/share/applications" ]]; then
        cat > "$HOME/.local/share/applications/fiscalrecorder.desktop" << EOF
[Desktop Entry]
Name=FiscalRecorder
Comment=Registratore di Cassa Professionale
Exec=$INSTALL_DIR/start-fiscalrecorder.sh
Icon=$INSTALL_DIR/client/public/favicon.ico
Terminal=false
Type=Application
Categories=Office;Finance;
EOF
        print_success "Collegamento desktop creato"
    fi
}

# Configurazione iniziale
initial_setup() {
    print_info "Configurazione iniziale..."
    
    # Crea file di configurazione di base
    cat > "$INSTALL_DIR/.env" << EOF
# FiscalRecorder - Configurazione
NODE_ENV=production
PORT=3000
DB_PATH=./data/fiscalrecorder.db

# Configurazione SMTP (opzionale)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Configurazione aziendale
COMPANY_NAME=La Mia Azienda
COMPANY_ADDRESS=Via Example 123
COMPANY_CITY=Roma
COMPANY_ZIP=00100
COMPANY_VAT=
EOF

    print_success "File di configurazione creato"
    
    # Imposta permessi
    chmod 755 "$INSTALL_DIR"
    print_success "Permessi impostati"
}

# Test dell'installazione
test_installation() {
    print_info "Test dell'installazione..."
    
    cd "$INSTALL_DIR"
    
    # Verifica file principali
    local required_files=("package.json" "server" "client")
    for file in "${required_files[@]}"; do
        if [[ -e "$file" ]]; then
            print_success "File trovato: $file"
        else
            print_error "File mancante: $file"
            return 1
        fi
    done
    
    print_success "Test di base superato"
}

# Main
main() {
    print_header
    
    # Log dell'installazione
    echo "=== FiscalRecorder Installation Log - $(date) ===" > "$LOG_FILE"
    
    print_info "Avvio installazione express..."
    print_info "Directory di installazione: $INSTALL_DIR"
    print_info "Log di installazione: $LOG_FILE"
    echo
    
    # Chiedi conferma
    read -p "Continuare con l'installazione? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Installazione annullata dall'utente"
        exit 0
    fi
    
    # Fasi di installazione
    check_requirements
    echo
    
    backup_existing
    echo
    
    download_source
    echo
    
    install_dependencies
    echo
    
    setup_database
    echo
    
    create_launcher
    echo
    
    initial_setup
    echo
    
    test_installation
    echo
    
    # Installazione completata
    print_header
    print_success "INSTALLAZIONE COMPLETATA CON SUCCESSO!"
    echo
    print_info "Directory installazione: $INSTALL_DIR"
    print_info "Per avviare FiscalRecorder:"
    echo -e "  ${GREEN}cd $INSTALL_DIR${NC}"
    echo -e "  ${GREEN}./start-fiscalrecorder.sh${NC}"
    echo
    print_info "Il server sarà disponibile su: http://localhost:3000"
    echo
    print_info "Documentazione completa in: $INSTALL_DIR/README.md"
    echo
    
    # Opzione per avviare immediatamente
    read -p "Avviare FiscalRecorder ora? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Avvio FiscalRecorder..."
        cd "$INSTALL_DIR"
        ./start-fiscalrecorder.sh
    fi
}

# Gestione errori
trap 'print_error "Installazione interrotta"; exit 1' INT TERM

# Esegui main solo se script chiamato direttamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
