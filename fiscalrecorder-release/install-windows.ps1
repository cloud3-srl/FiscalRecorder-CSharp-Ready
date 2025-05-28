# ============================================================================
# FiscalRecorder - Installazione Windows
# Script di installazione automatica per sistemi Windows
# PowerShell 5.1+ richiesto
# ============================================================================

param(
    [switch]$Unattended,
    [string]$InstallPath = "$env:USERPROFILE\FiscalRecorder",
    [switch]$CreateDesktopShortcut = $true,
    [switch]$CreateStartMenuShortcut = $true
)

# Configurazione
$Script:FiscalRecorderVersion = "1.0.0"
$Script:RepoUrl = "https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready.git"
$Script:ZipUrl = "https://github.com/cloud3-srl/FiscalRecorder-CSharp-Ready/archive/refs/heads/main.zip"
$Script:LogFile = "$env:TEMP\fiscalrecorder-install.log"
$Script:BackupDir = "$env:USERPROFILE\FiscalRecorder-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Funzioni di utilità
function Write-Header {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Blue
    Write-Host "                    FiscalRecorder - Installazione Windows" -ForegroundColor Blue
    Write-Host "                              Versione $FiscalRecorderVersion" -ForegroundColor Blue
    Write-Host "============================================================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ Errore: $Message" -ForegroundColor Red
    Write-Host "Dettagli salvati in: $LogFile" -ForegroundColor Yellow
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ Attenzione: $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Chocolatey {
    Write-Info "Installazione Chocolatey (gestore pacchetti)..."
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Success "Chocolatey installato"
        return $true
    }
    catch {
        Write-Warning "Installazione Chocolatey fallita: $($_.Exception.Message)"
        return $false
    }
}

function Test-Requirements {
    Write-Info "Verifica requisiti di sistema..."
    
    # Verifica versione Windows
    $osVersion = [System.Environment]::OSVersion.Version
    if ($osVersion.Major -ge 10) {
        Write-Success "Sistema operativo: Windows $($osVersion.Major).$($osVersion.Minor)"
    }
    else {
        Write-Warning "Versione Windows non testata: $($osVersion.Major).$($osVersion.Minor)"
    }
    
    # Verifica PowerShell
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Write-Success "PowerShell: v$($psVersion.Major).$($psVersion.Minor)"
    }
    else {
        Write-Error "PowerShell 5.1+ richiesto. Versione attuale: $($psVersion.Major).$($psVersion.Minor)"
        return $false
    }
    
    # Verifica .NET Framework
    try {
        $netVersion = Get-ItemProperty "HKLM:SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full\" -Name Release -ErrorAction Stop
        if ($netVersion.Release -ge 461808) {
            Write-Success ".NET Framework 4.7.2+ trovato"
        }
        else {
            Write-Warning ".NET Framework 4.7.2+ consigliato per compatibilità ottimale"
        }
    }
    catch {
        Write-Warning "Impossibile verificare versione .NET Framework"
    }
    
    # Verifica spazio disco
    $drive = (Get-Item $InstallPath -ErrorAction SilentlyContinue)?.Root ?? (Get-Item $env:USERPROFILE).Root
    $freeSpace = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='$($drive.Name.TrimEnd('\'))'").FreeSpace / 1MB
    
    if ($freeSpace -gt 500) {
        Write-Success "Spazio disco sufficiente: $([math]::Round($freeSpace, 0))MB disponibili"
    }
    else {
        Write-Warning "Spazio disco limitato: $([math]::Round($freeSpace, 0))MB disponibili (500MB richiesti)"
    }
    
    # Verifica Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js trovato: $nodeVersion"
            
            # Verifica versione minima
            $majorVersion = [int]($nodeVersion.TrimStart('v').Split('.')[0])
            if ($majorVersion -ge 14) {
                Write-Success "Versione Node.js compatibile"
            }
            else {
                Write-Warning "Versione Node.js troppo vecchia. Minima richiesta: v14.0.0"
            }
        }
    }
    catch {
        Write-Warning "Node.js non trovato"
        Write-Info "Node.js verrà installato automaticamente"
        
        # Prova a installare Node.js con Chocolatey
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            Write-Info "Installazione Node.js tramite Chocolatey..."
            try {
                choco install nodejs -y | Out-File $LogFile -Append
                Write-Success "Node.js installato"
            }
            catch {
                Write-Warning "Installazione automatica Node.js fallita"
            }
        }
        elseif (-not $Unattended) {
            $install = Read-Host "Installare Node.js automaticamente? (Y/n)"
            if ($install -ne 'n' -and $install -ne 'N') {
                if (Install-Chocolatey) {
                    choco install nodejs -y | Out-File $LogFile -Append
                    Write-Success "Node.js installato"
                }
            }
        }
    }
    
    return $true
}

function Backup-Existing {
    if (Test-Path $InstallPath) {
        Write-Info "Backup installazione esistente..."
        try {
            Move-Item $InstallPath $BackupDir -Force
            Write-Success "Backup salvato in: $BackupDir"
        }
        catch {
            Write-Error "Impossibile creare backup: $($_.Exception.Message)"
            return $false
        }
    }
    return $true
}

function Download-Source {
    Write-Info "Download del codice sorgente..."
    
    try {
        # Crea directory di installazione
        New-Item -Path $InstallPath -ItemType Directory -Force | Out-Null
        Set-Location $InstallPath
        
        # Prova con git prima
        if (Get-Command git -ErrorAction SilentlyContinue) {
            Write-Info "Download tramite Git..."
            try {
                git clone $RepoUrl . *>&1 | Out-File $LogFile -Append
                Write-Success "Download completato tramite Git"
                return $true
            }
            catch {
                Write-Warning "Download Git fallito, provo con ZIP..."
            }
        }
        
        # Fallback a download ZIP
        Write-Info "Download tramite ZIP..."
        $zipPath = "$InstallPath\source.zip"
        
        # Download con progress bar
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($ZipUrl, $zipPath)
        
        # Estrazione
        Write-Info "Estrazione archivio..."
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $InstallPath)
        
        # Sposta i contenuti dalla cartella estratta
        $extractedFolder = Get-ChildItem $InstallPath -Directory | Where-Object { $_.Name -like "FiscalRecorder-*" } | Select-Object -First 1
        if ($extractedFolder) {
            Get-ChildItem $extractedFolder.FullName | Move-Item -Destination $InstallPath -Force
            Remove-Item $extractedFolder.FullName -Recurse -Force
        }
        
        Remove-Item $zipPath -Force
        Write-Success "Download ZIP completato"
        return $true
    }
    catch {
        Write-Error "Impossibile scaricare il codice sorgente: $($_.Exception.Message)"
        return $false
    }
}

function Install-Dependencies {
    Write-Info "Installazione dipendenze..."
    
    try {
        Set-Location $InstallPath
        
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            Write-Info "Installazione dipendenze Node.js..."
            npm install *>&1 | Out-File $LogFile -Append
            Write-Success "Dipendenze Node.js installate"
            
            # Build del client
            Write-Info "Build dell'applicazione client..."
            npm run build *>&1 | Out-File $LogFile -Append
            Write-Success "Build client completata"
        }
        else {
            Write-Warning "npm non trovato, saltando installazione dipendenze Node.js"
        }
        
        return $true
    }
    catch {
        Write-Error "Errore nell'installazione dipendenze: $($_.Exception.Message)"
        return $false
    }
}

function Setup-Database {
    Write-Info "Configurazione database..."
    
    try {
        # Crea directory per database
        $dataDir = "$InstallPath\data"
        New-Item -Path $dataDir -ItemType Directory -Force | Out-Null
        
        # Copia schema database se esiste
        $schemaPath = "$InstallPath\database\schema.sql"
        if (Test-Path $schemaPath) {
            Copy-Item $schemaPath "$dataDir\schema.sql"
            Write-Success "Schema database copiato"
        }
        
        Write-Success "Database SQLite configurato"
        return $true
    }
    catch {
        Write-Error "Errore nella configurazione database: $($_.Exception.Message)"
        return $false
    }
}

function Create-Launchers {
    Write-Info "Creazione collegamenti di avvio..."
    
    try {
        # Script di avvio Windows (Batch)
        $startScript = @"
@echo off
cd /d "%~dp0"

REM Verifica Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Errore: Node.js non trovato
    echo Scarica da: https://nodejs.org/
    pause
    exit /b 1
)

echo Avvio FiscalRecorder...
echo Server disponibile su: http://localhost:3000
echo Premi Ctrl+C per fermare il server

npm start
pause
"@
        
        $startScript | Out-File "$InstallPath\start-fiscalrecorder.bat" -Encoding ASCII
        Write-Success "Script di avvio creato"
        
        # Desktop shortcut
        if ($CreateDesktopShortcut) {
            $desktopPath = [System.Environment]::GetFolderPath('Desktop')
            $shortcutPath = "$desktopPath\FiscalRecorder.lnk"
            
            $shell = New-Object -ComObject WScript.Shell
            $shortcut = $shell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = "$InstallPath\start-fiscalrecorder.bat"
            $shortcut.WorkingDirectory = $InstallPath
            $shortcut.Description = "FiscalRecorder - Registratore di Cassa"
            $shortcut.IconLocation = "$InstallPath\client\public\favicon.ico"
            $shortcut.Save()
            
            Write-Success "Collegamento desktop creato"
        }
        
        # Start Menu shortcut
        if ($CreateStartMenuShortcut) {
            $startMenuPath = [System.Environment]::GetFolderPath('StartMenu')
            $programsPath = "$startMenuPath\Programs"
            $shortcutPath = "$programsPath\FiscalRecorder.lnk"
            
            $shell = New-Object -ComObject WScript.Shell
            $shortcut = $shell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = "$InstallPath\start-fiscalrecorder.bat"
            $shortcut.WorkingDirectory = $InstallPath
            $shortcut.Description = "FiscalRecorder - Registratore di Cassa"
            $shortcut.IconLocation = "$InstallPath\client\public\favicon.ico"
            $shortcut.Save()
            
            Write-Success "Collegamento menu Start creato"
        }
        
        return $true
    }
    catch {
        Write-Error "Errore nella creazione collegamenti: $($_.Exception.Message)"
        return $false
    }
}

function Initialize-Setup {
    Write-Info "Configurazione iniziale..."
    
    try {
        # File di configurazione .env
        $envContent = @"
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
"@
        
        $envContent | Out-File "$InstallPath\.env" -Encoding UTF8
        Write-Success "File di configurazione creato"
        
        return $true
    }
    catch {
        Write-Error "Errore nella configurazione iniziale: $($_.Exception.Message)"
        return $false
    }
}

function Test-Installation {
    Write-Info "Test dell'installazione..."
    
    try {
        Set-Location $InstallPath
        
        # Verifica file principali
        $requiredFiles = @("package.json", "server", "client")
        foreach ($file in $requiredFiles) {
            if (Test-Path $file) {
                Write-Success "File trovato: $file"
            }
            else {
                Write-Error "File mancante: $file"
                return $false
            }
        }
        
        Write-Success "Test di base superato"
        return $true
    }
    catch {
        Write-Error "Errore nel test installazione: $($_.Exception.Message)"
        return $false
    }
}

function Add-FirewallRule {
    Write-Info "Configurazione Windows Firewall..."
    
    try {
        if (Test-Administrator) {
            # Regola firewall per permettere connessioni su porta 3000
            $ruleName = "FiscalRecorder-HTTP"
            
            # Rimuovi regola esistente se presente
            Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
            
            # Crea nuova regola
            New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Domain,Private | Out-Null
            Write-Success "Regola firewall aggiunta per porta 3000"
        }
        else {
            Write-Warning "Privilegi di amministratore richiesti per configurare il firewall"
            Write-Info "Potrebbe essere necessario autorizzare manualmente FiscalRecorder nel firewall"
        }
    }
    catch {
        Write-Warning "Impossibile configurare firewall automaticamente: $($_.Exception.Message)"
    }
}

# Funzione principale
function Start-Installation {
    Write-Header
    
    # Inizializza log
    "=== FiscalRecorder Windows Installation Log - $(Get-Date) ===" | Out-File $LogFile
    
    Write-Info "Avvio installazione Windows..."
    Write-Info "Directory di installazione: $InstallPath"
    Write-Info "Log di installazione: $LogFile"
    Write-Host ""
    
    # Chiedi conferma se non in modalità unattended
    if (-not $Unattended) {
        $confirm = Read-Host "Continuare con l'installazione? (Y/n)"
        if ($confirm -eq 'n' -or $confirm -eq 'N') {
            Write-Info "Installazione annullata dall'utente"
            return
        }
    }
    
    # Fasi di installazione
    if (-not (Test-Requirements)) { return }
    Write-Host ""
    
    if (-not (Backup-Existing)) { return }
    Write-Host ""
    
    if (-not (Download-Source)) { return }
    Write-Host ""
    
    if (-not (Install-Dependencies)) { return }
    Write-Host ""
    
    if (-not (Setup-Database)) { return }
    Write-Host ""
    
    if (-not (Create-Launchers)) { return }
    Write-Host ""
    
    if (-not (Initialize-Setup)) { return }
    Write-Host ""
    
    Add-FirewallRule
    Write-Host ""
    
    if (-not (Test-Installation)) { return }
    Write-Host ""
    
    # Installazione completata
    Write-Header
    Write-Success "INSTALLAZIONE COMPLETATA CON SUCCESSO!"
    Write-Host ""
    Write-Info "Directory installazione: $InstallPath"
    Write-Info "Per avviare FiscalRecorder:"
    Write-Host "  - Doppio click su 'FiscalRecorder' (desktop o menu Start)" -ForegroundColor Green
    Write-Host "  - Oppure esegui: $InstallPath\start-fiscalrecorder.bat" -ForegroundColor Green
    Write-Host ""
    Write-Info "Il server sarà disponibile su: http://localhost:3000"
    Write-Host ""
    Write-Info "Documentazione completa in: $InstallPath\README.md"
    Write-Host ""
    
    # Opzione per avviare immediatamente
    if (-not $Unattended) {
        $startNow = Read-Host "Avviare FiscalRecorder ora? (y/N)"
        if ($startNow -eq 'y' -or $startNow -eq 'Y') {
            Write-Info "Avvio FiscalRecorder..."
            Start-Process "$InstallPath\start-fiscalrecorder.bat"
        }
    }
}

# Gestione errori
$ErrorActionPreference = 'Stop'
trap {
    Write-Error "Installazione interrotta: $($_.Exception.Message)"
    Read-Host "Premi INVIO per uscire"
    exit 1
}

# Esecuzione principale
Start-Installation
