#!/bin/bash

# ============================================================================
# FiscalRecorder - Script di Build Automatico Installer
# Genera tutti i pacchetti di installazione per diverse piattaforme
# ============================================================================

set -e

# Configurazione
VERSION="1.0.0"
BUILD_DIR="$(pwd)/build"
DIST_DIR="$(pwd)/dist"
SOURCE_DIR="../"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "============================================================================"
    echo "                FiscalRecorder - Build Installer Automatico"
    echo "                              Versione $VERSION"
    echo "============================================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ Errore: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verifica dipendenze
check_dependencies() {
    print_info "Verifica dipendenze per build..."
    
    local missing_deps=()
    
    # Verifica Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    # Verifica npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # Verifica zip
    if ! command -v zip &> /dev/null; then
        missing_deps+=("zip")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Dipendenze mancanti: ${missing_deps[*]}"
        print_info "Installa le dipendenze e riprova"
        exit 1
    fi
    
    print_success "Tutte le dipendenze sono presenti"
}

# Preparazione directories
prepare_directories() {
    print_info "Preparazione directory di build..."
    
    # Pulisci directory esistenti
    rm -rf "$BUILD_DIR" "$DIST_DIR"
    
    # Crea nuove directory
    mkdir -p "$BUILD_DIR" "$DIST_DIR"
    mkdir -p "$BUILD_DIR/source"
    mkdir -p "$BUILD_DIR/windows"
    mkdir -p "$BUILD_DIR/unix"
    mkdir -p "$BUILD_DIR/portable"
    
    print_success "Directory preparate"
}

# Copia e prepara codice sorgente
prepare_source() {
    print_info "Preparazione codice sorgente..."
    
    # Copia tutto il progetto escludendo build e node_modules
    rsync -av --exclude='node_modules' \
              --exclude='.git' \
              --exclude='build' \
              --exclude='dist' \
              --exclude='fiscalrecorder-release' \
              "$SOURCE_DIR" "$BUILD_DIR/source/"
    
    # Entra nella directory sorgente
    cd "$BUILD_DIR/source"
    
    # Installa dipendenze
    print_info "Installazione dipendenze..."
    npm install --production
    
    # Build del client
    print_info "Build dell'applicazione client..."
    npm run build
    
    # Pulisci file non necessari per produzione
    rm -rf node_modules/.cache
    rm -rf .git
    find . -name "*.log" -delete
    find . -name ".DS_Store" -delete
    
    print_success "Codice sorgente preparato"
}

# Crea pacchetto Windows
create_windows_package() {
    print_info "Creazione pacchetto Windows..."
    
    local win_dir="$BUILD_DIR/windows/FiscalRecorder"
    mkdir -p "$win_dir"
    
    # Copia il progetto
    cp -r "$BUILD_DIR/source/"* "$win_dir/"
    
    # Copia script di installazione Windows
    cp "$(dirname "$0")/install-windows.ps1" "$BUILD_DIR/windows/"
    
    # Crea file batch per l'installazione
    cat > "$BUILD_DIR/windows/INSTALLA.bat" << 'EOF'
@echo off
echo ============================================================================
echo              FiscalRecorder - Installazione Windows
echo ============================================================================
echo.
echo Questo script avviera' l'installazione di FiscalRecorder.
echo.
pause

powershell -ExecutionPolicy Bypass -File "%~dp0install-windows.ps1"
pause
EOF
    
    # Crea script di avvio diretto
    cat > "$win_dir/AVVIA.bat" << 'EOF'
@echo off
cd /d "%~dp0"

echo ============================================================================
echo                        FiscalRecorder - Avvio
echo ============================================================================
echo.

REM Verifica Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRORE: Node.js non trovato!
    echo.
    echo Per installare Node.js:
    echo 1. Vai su https://nodejs.org/
    echo 2. Scarica la versione LTS
    echo 3. Installa e riavvia il computer
    echo.
    pause
    exit /b 1
)

echo Avvio FiscalRecorder...
echo.
echo Il server sara' disponibile su: http://localhost:3000
echo Premi Ctrl+C per fermare il server
echo.

npm start
pause
EOF
    
    # Crea README Windows
    cat > "$BUILD_DIR/windows/LEGGIMI.txt" << EOF
FiscalRecorder v$VERSION - Installazione Windows
===============================================

INSTALLAZIONE AUTOMATICA (Consigliata):
1. Fai doppio click su "INSTALLA.bat"
2. Segui le istruzioni a schermo
3. L'installer configurerà tutto automaticamente

INSTALLAZIONE MANUALE:
1. Assicurati di avere Node.js installato (https://nodejs.org/)
2. Copia la cartella "FiscalRecorder" dove preferisci
3. Apri il Prompt dei comandi nella cartella
4. Esegui: npm install
5. Esegui: npm start

AVVIO:
- Doppio click su "AVVIA.bat" nella cartella FiscalRecorder
- Oppure esegui "npm start" dal Prompt dei comandi

ACCESSO:
- Apri il browser e vai su: http://localhost:3000

SUPPORTO:
- Documentazione: README.md nella cartella FiscalRecorder
- Issues: https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready/issues

EOF
    
    # Crea archivio Windows
    cd "$BUILD_DIR/windows"
    zip -r "$DIST_DIR/FiscalRecorder-Windows-v$VERSION.zip" .
    
    print_success "Pacchetto Windows creato: FiscalRecorder-Windows-v$VERSION.zip"
}

# Crea pacchetto Unix/Linux/macOS
create_unix_package() {
    print_info "Creazione pacchetto Unix/Linux/macOS..."
    
    local unix_dir="$BUILD_DIR/unix/FiscalRecorder"
    mkdir -p "$unix_dir"
    
    # Copia il progetto
    cp -r "$BUILD_DIR/source/"* "$unix_dir/"
    
    # Copia script di installazione
    cp "$(dirname "$0")/install-express.sh" "$BUILD_DIR/unix/"
    chmod +x "$BUILD_DIR/unix/install-express.sh"
    
    # Crea script di installazione semplificato
    cat > "$BUILD_DIR/unix/install.sh" << 'EOF'
#!/bin/bash

echo "============================================================================"
echo "              FiscalRecorder - Installazione Express"
echo "============================================================================"
echo ""

# Verifica se siamo nella directory corretta
if [ ! -f "install-express.sh" ]; then
    echo "Errore: Script di installazione non trovato"
    echo "Assicurati di essere nella directory corretta"
    exit 1
fi

# Esegui lo script di installazione completo
chmod +x install-express.sh
./install-express.sh
EOF
    chmod +x "$BUILD_DIR/unix/install.sh"
    
    # Crea script di avvio
    cat > "$unix_dir/start.sh" << 'EOF'
#!/bin/bash

cd "$(dirname "$0")"

echo "============================================================================"
echo "                        FiscalRecorder - Avvio"
echo "============================================================================"
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "ERRORE: Node.js non trovato!"
    echo ""
    echo "Per installare Node.js:"
    echo "- Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "- CentOS/RHEL: sudo yum install nodejs npm"
    echo "- macOS: brew install node"
    echo "- O scarica da: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "Avvio FiscalRecorder..."
echo ""
echo "Il server sarà disponibile su: http://localhost:3000"
echo "Premi Ctrl+C per fermare il server"
echo ""

npm start
EOF
    chmod +x "$unix_dir/start.sh"
    
    # Crea README Unix
    cat > "$BUILD_DIR/unix/README.txt" << EOF
FiscalRecorder v$VERSION - Installazione Unix/Linux/macOS
=========================================================

INSTALLAZIONE AUTOMATICA (Consigliata):
1. Apri il terminale in questa cartella
2. Esegui: ./install.sh
3. Segui le istruzioni a schermo

INSTALLAZIONE MANUALE:
1. Assicurati di avere Node.js installato
2. Copia la cartella "FiscalRecorder" dove preferisci
3. Apri il terminale nella cartella
4. Esegui: npm install
5. Esegui: npm start

AVVIO:
- Esegui: ./start.sh nella cartella FiscalRecorder
- Oppure esegui: npm start

ACCESSO:
- Apri il browser e vai su: http://localhost:3000

SUPPORTO:
- Documentazione: README.md nella cartella FiscalRecorder
- Issues: https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready/issues

EOF
    
    # Crea archivio Unix
    cd "$BUILD_DIR/unix"
    tar -czf "$DIST_DIR/FiscalRecorder-Unix-v$VERSION.tar.gz" .
    
    print_success "Pacchetto Unix creato: FiscalRecorder-Unix-v$VERSION.tar.gz"
}

# Crea versione portable
create_portable_package() {
    print_info "Creazione versione portable..."
    
    local portable_dir="$BUILD_DIR/portable/FiscalRecorder-Portable"
    mkdir -p "$portable_dir"
    
    # Copia il progetto
    cp -r "$BUILD_DIR/source/"* "$portable_dir/"
    
    # Crea script portable per Windows
    cat > "$portable_dir/FiscalRecorder-Portable.bat" << 'EOF'
@echo off
cd /d "%~dp0"

echo ============================================================================
echo                    FiscalRecorder - Versione Portable
echo ============================================================================
echo.
echo Questa versione non richiede installazione.
echo.

REM Verifica Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ATTENZIONE: Node.js non trovato nel PATH di sistema
    echo.
    echo Se hai Node.js installato ma vedi questo messaggio:
    echo 1. Riavvia il computer
    echo 2. Oppure aggiungi Node.js al PATH manualmente
    echo.
    echo Se non hai Node.js installato:
    echo 1. Vai su https://nodejs.org/
    echo 2. Scarica la versione LTS
    echo 3. Installa e riavvia il computer
    echo.
    pause
    exit /b 1
)

echo Avvio FiscalRecorder...
echo.
echo Server disponibile su: http://localhost:3000
echo Premi Ctrl+C per fermare
echo.

npm start
pause
EOF
    
    # Crea script portable per Unix
    cat > "$portable_dir/fiscalrecorder-portable.sh" << 'EOF'
#!/bin/bash

cd "$(dirname "$0")"

echo "============================================================================"
echo "                    FiscalRecorder - Versione Portable"
echo "============================================================================"
echo ""
echo "Questa versione non richiede installazione."
echo ""

if ! command -v node &> /dev/null; then
    echo "ATTENZIONE: Node.js non trovato"
    echo ""
    echo "Installa Node.js per utilizzare FiscalRecorder:"
    echo "- Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "- CentOS/RHEL: sudo yum install nodejs npm"  
    echo "- macOS: brew install node"
    echo "- O scarica da: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "Avvio FiscalRecorder..."
echo ""
echo "Server disponibile su: http://localhost:3000"
echo "Premi Ctrl+C per fermare"
echo ""

npm start
EOF
    chmod +x "$portable_dir/fiscalrecorder-portable.sh"
    
    # Crea README portable
    cat > "$portable_dir/README-PORTABLE.txt" << EOF
FiscalRecorder v$VERSION - Versione Portable
============================================

Questa è la versione portable di FiscalRecorder che non richiede 
installazione nel sistema.

REQUISITI:
- Node.js 14+ installato nel sistema
- Browser web moderno

UTILIZZO WINDOWS:
- Doppio click su "FiscalRecorder-Portable.bat"

UTILIZZO UNIX/LINUX/MACOS:
- Apri terminale e esegui: ./fiscalrecorder-portable.sh

ACCESSO:
- Apri il browser e vai su: http://localhost:3000

VANTAGGI VERSIONE PORTABLE:
- Non modifica il sistema
- Può essere eseguita da USB/disco esterno
- Facile da rimuovere (elimina la cartella)
- Ideale per test o uso temporaneo

NOTA:
I dati vengono salvati nella cartella "data" all'interno
di questa directory portable.

EOF
    
    # Crea archivio portable
    cd "$BUILD_DIR/portable"
    zip -r "$DIST_DIR/FiscalRecorder-Portable-v$VERSION.zip" .
    
    print_success "Versione portable creata: FiscalRecorder-Portable-v$VERSION.zip"
}

# Crea pacchetto codice sorgente
create_source_package() {
    print_info "Creazione pacchetto codice sorgente..."
    
    local src_dir="$BUILD_DIR/source-package"
    mkdir -p "$src_dir"
    
    # Copia sorgente pulito (senza node_modules e build)
    rsync -av --exclude='node_modules' \
              --exclude='.git' \
              --exclude='build' \
              --exclude='dist' \
              --exclude='fiscalrecorder-release' \
              "$SOURCE_DIR" "$src_dir/FiscalRecorder-Source/"
    
    # Aggiungi README per sviluppatori
    cat > "$src_dir/FiscalRecorder-Source/BUILD.md" << EOF
# FiscalRecorder v$VERSION - Build dal Codice Sorgente

## Requisiti di Sviluppo
- Node.js 14+
- npm 6+
- Git (opzionale)

## Installazione Dipendenze
\`\`\`bash
npm install
\`\`\`

## Build Produzione
\`\`\`bash
npm run build
\`\`\`

## Avvio Sviluppo
\`\`\`bash
npm run dev
\`\`\`

## Avvio Produzione
\`\`\`bash
npm start
\`\`\`

## Testing
\`\`\`bash
npm test
\`\`\`

## Struttura Progetto
- \`client/\` - Frontend React + TypeScript
- \`server/\` - Backend Node.js + Express
- \`shared/\` - Codice condiviso (schema DB, tipi)
- \`docs/\` - Documentazione

## Database
Il progetto usa SQLite per default. Per SQL Server:
1. Configura connectionString in \`.env\`
2. Esegui migration: \`npm run db:migrate\`

## Personalizzazione
Modifica i file di configurazione:
- \`.env\` - Variabili ambiente
- \`client/src/config/\` - Configurazione frontend
- \`server/config/\` - Configurazione backend

EOF
    
    # Crea archivio sorgente
    cd "$src_dir"
    tar -czf "$DIST_DIR/FiscalRecorder-Source-v$VERSION.tar.gz" .
    
    print_success "Pacchetto sorgente creato: FiscalRecorder-Source-v$VERSION.tar.gz"
}

# Genera checksum
generate_checksums() {
    print_info "Generazione checksum..."
    
    cd "$DIST_DIR"
    
    # Genera SHA256 per tutti i file
    if command -v sha256sum &> /dev/null; then
        sha256sum *.* > checksums.sha256
    elif command -v shasum &> /dev/null; then
        shasum -a 256 *.* > checksums.sha256
    else
        print_warning "Comando sha256sum/shasum non trovato, saltando checksum"
        return
    fi
    
    print_success "Checksum generati: checksums.sha256"
}

# Crea release notes
create_release_notes() {
    print_info "Creazione release notes..."
    
    cat > "$DIST_DIR/RELEASE-NOTES-v$VERSION.txt" << EOF
FiscalRecorder v$VERSION - Release Notes
========================================

DATA RILASCIO: $(date +"%d/%m/%Y")

NOVITÀ IN QUESTA VERSIONE:
- ✅ Sistema completo di gestione punto vendita
- ✅ Gestione clienti con validazione CF/P.IVA italiana
- ✅ Gestione prodotti con categorie e scorte
- ✅ Documenti fiscali conformi normativa italiana
- ✅ Report avanzati e statistiche vendite
- ✅ Funzionalità offline con sincronizzazione
- ✅ Sistema personalizzazione tema
- ✅ Configurazione email SMTP
- ✅ Selezione colonne universale per tabelle
- ✅ Interfaccia responsive e touch-friendly

PACCHETTI DISPONIBILI:
- FiscalRecorder-Windows-v$VERSION.zip (Installazione guidata Windows)
- FiscalRecorder-Unix-v$VERSION.tar.gz (Script auto-installazione Unix/Linux/macOS)
- FiscalRecorder-Portable-v$VERSION.zip (Versione portable multi-piattaforma)
- FiscalRecorder-Source-v$VERSION.tar.gz (Codice sorgente per sviluppatori)

REQUISITI MINIMI:
- Sistema Operativo: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- Node.js: 14.0+
- RAM: 4GB (8GB consigliati)
- Spazio Disco: 500MB
- Browser: Chrome, Firefox, Safari, Edge (versioni recenti)

INSTALLAZIONE RAPIDA:
1. Scarica il pacchetto per il tuo sistema operativo
2. Estrai l'archivio
3. Esegui lo script di installazione
4. Segui le istruzioni a schermo

PRIMI PASSI:
1. Avvia FiscalRecorder
2. Accedi a http://localhost:3000
3. Configura i dati aziendali in Impostazioni > Azienda
4. Imposta stampanti in Impostazioni > Stampanti
5. Inizia a utilizzare il punto vendita

SUPPORTO:
- Documentazione: README.md incluso nei pacchetti
- Issues: https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready/issues
- Email: support@fiscalrecorder.it

LICENZA:
Software libero distribuito sotto licenza Open Source.
Vedere LICENSE file per dettagli.

EOF

    print_success "Release notes create: RELEASE-NOTES-v$VERSION.txt"
}

# Funzione principale
main() {
    print_header
    
    print_info "Avvio build automatico installer..."
    print_info "Versione: $VERSION"
    print_info "Directory build: $BUILD_DIR"
    print_info "Directory distribuzione: $DIST_DIR"
    echo ""
    
    check_dependencies
    echo ""
    
    prepare_directories
    echo ""
    
    prepare_source
    echo ""
    
    create_windows_package
    echo ""
    
    create_unix_package
    echo ""
    
    create_portable_package
    echo ""
    
    create_source_package
    echo ""
    
    generate_checksums
    echo ""
    
    create_release_notes
    echo ""
    
    # Riepilogo finale
    print_header
    print_success "BUILD COMPLETATO CON SUCCESSO!"
    echo ""
    print_info "Pacchetti generati in: $DIST_DIR"
    echo ""
    
    if [ -d "$DIST_DIR" ]; then
        print_info "File creati:"
        ls -la "$DIST_DIR" | grep -v "^total" | awk '{print "  - " $9 " (" $5 " bytes)"}'
        echo ""
        
        # Calcola dimensione totale
        total_size=$(du -sh "$DIST_DIR" | cut -f1)
        print_info "Dimensione totale: $total_size"
    fi
    
    echo ""
    print_info "I pacchetti sono pronti per la distribuzione!"
}

# Esegui solo se chiamato direttamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
