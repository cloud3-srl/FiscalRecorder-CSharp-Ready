# 🔑 Guida Configurazione SSH Senza Password

Questa guida ti aiuterà a configurare l'accesso SSH al server CloudPos senza dover inserire la password ogni volta.

## 🎯 Obiettivo

Configurare l'autenticazione SSH basata su chiavi per accedere al server `65.108.89.211` senza password.

## 📋 Prerequisiti

- Accesso SSH al server con password
- Privilegi amministrativi sul server
- Client SSH configurato localmente

## 🔧 Configurazione Passo-Passo

### 1. Genera Chiave SSH (Già Fatto)

```bash
# Chiave già generata
ls -la ~/.ssh/cloudpos_key*
```

**Output:**
```
-rw-------  1 user  staff  399 ... cloudpos_key      (chiave privata)
-rw-r--r--  1 user  staff   96 ... cloudpos_key.pub  (chiave pubblica)
```

### 2. Visualizza Chiave Pubblica

```bash
cat ~/.ssh/cloudpos_key.pub
```

### 3. Configura Server SSH

Accedi al server e configura SSH:

```bash
# Accedi al server (con password)
ssh root@65.108.89.211

# Crea directory .ssh se non esiste
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Crea file authorized_keys se non esiste
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Aggiungi la chiave pubblica (sostituisci con la tua chiave)
echo "ssh-ed25519 AAAA...tua_chiave_qui... cloudpos@fiscalrecorder" >> ~/.ssh/authorized_keys
```

### 4. Configura SSH Server

Modifica la configurazione SSH del server:

```bash
# Modifica configurazione SSH
nano /etc/ssh/sshd_config
```

Verifica che queste impostazioni siano presenti e non commentate:

```bash
# Abilita autenticazione con chiavi
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Opzionale: Disabilita password (solo dopo aver testato le chiavi)
# PasswordAuthentication no
```

Riavvia servizio SSH:

```bash
systemctl restart sshd
```

### 5. Testa Connessione

Dal tuo computer locale:

```bash
# Test con chiave specifica
ssh -i ~/.ssh/cloudpos_key root@65.108.89.211

# Test con alias configurato
ssh cloudpos
```

## 🛠️ Troubleshooting

### Problema: Ancora richiesta password

**Causa:** Permessi file/directory incorretti sul server

**Soluzione:**
```bash
# Sul server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown -R root:root ~/.ssh
```

### Problema: Permission denied (publickey)

**Causa:** Chiave non trovata o configurazione SSH

**Soluzione:**
```bash
# Verifica chiave sul server
cat ~/.ssh/authorized_keys

# Verifica log SSH
tail -f /var/log/auth.log
```

### Problema: Connection refused

**Causa:** Servizio SSH non attivo

**Soluzione:**
```bash
# Verifica status SSH
systemctl status sshd

# Riavvia se necessario
systemctl restart sshd
```

## 📝 Configurazione SSH Client (Già Fatto)

File `~/.ssh/config`:

```
Host cloudpos
    HostName 65.108.89.211
    User root
    IdentityFile ~/.ssh/cloudpos_key
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

Host fiscalrecorder
    HostName 65.108.89.211
    User root
    IdentityFile ~/.ssh/cloudpos_key
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

## 🔐 Sicurezza Aggiuntiva

### Disabilita Password Authentication (Opzionale)

Solo dopo aver verificato che le chiavi funzionano:

```bash
# Su server, modifica /etc/ssh/sshd_config
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Riavvia SSH
systemctl restart sshd
```

### Backup Chiave SSH

```bash
# Backup locale
cp ~/.ssh/cloudpos_key ~/Desktop/cloudpos_key_backup
cp ~/.ssh/cloudpos_key.pub ~/Desktop/cloudpos_key_backup.pub
```

## ✅ Verifica Configurazione

Test completo:

```bash
# Test connessione
ssh cloudpos 'echo "✅ SSH senza password funzionante!"'

# Test comandi
ssh cloudpos 'hostname && date && whoami'

# Test applicazione
ssh cloudpos 'cd /opt/fiscalrecorder && pm2 status'
```

## 🚀 Comandi Utili

Dopo la configurazione:

```bash
# Connessione rapida
ssh cloudpos

# Esecuzione comandi remoti
ssh cloudpos 'pm2 status'
ssh cloudpos 'pm2 logs fiscalrecorder --lines 20'
ssh cloudpos 'systemctl status postgresql'

# Copia file
scp file.txt cloudpos:/tmp/
scp cloudpos:/opt/fiscalrecorder/.env ./backup.env
```

## 📞 Supporto

Se hai problemi:

1. Verifica permessi file SSH
2. Controlla log sistema: `/var/log/auth.log`
3. Testa connessione con verbose: `ssh -vvv cloudpos`
4. Verifica configurazione SSH server: `/etc/ssh/sshd_config`

---

**🎯 Obiettivo:** Una volta configurato, potrai accedere al server con `ssh cloudpos` senza password!
