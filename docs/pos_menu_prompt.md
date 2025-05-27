# Prompt per Agente AI - Creazione Interfaccia Menu POS

## Obiettivo
Crea una struttura di menu completa per un'applicazione POS (Point of Sale) seguendo la gerarchia e le specifiche fornite.

## Struttura da Implementare

### 1. MENU PRINCIPALE
- **Schermata Principale** con:
  - Menu laterale contenente: Preferiti, Reparti (Dolce, Pane, Salato)
  - Barra superiore con: Apri cassetto, Chiudi cassa, Prezzi base, Admin (con autenticazione), Attivazione

### 2. MENU LATERALE (GESTIONE)
Implementa le seguenti sezioni con i relativi campi:

#### A. Configurazione Base
- **Ragione sociale**
- **Aliquote IVA**
- **Reparti** (Dolce, Pane, Salato, Nuovo reparto)
  - Per Nuovo reparto: finestra con Descrizione, Descrizione sui bottoni, Descrizione sullo scontrino, Aliquota IVA (menu a tendina), Tipologia di vendita (menu a tendina), Limite importo, Colore, Preferito (checkbox)

#### B. Gestione Prodotti e Vendita
- **Categorie**
- **Prodotti**
- **Modalità di vendita**
- **Stampanti**
- **Lettori barcode**
- **Display cliente**
- **Pagamenti**
- **Ruoli**
- **Operatori**

#### C. Documenti
- **Scontrino**: Stampa di default (menu a tendina), Stampa dettaglio per aliquote IVA (interruttore), Stampa ricevuta per pagamento differito (interruttore), Frase di cortesia (campo testo)
- **Fattura**: Stampante di default (menu a tendina), Frase di cortesia (campo testo)
- **Conto**: Abilitazione pagamenti Bancomat e carta di credito (interruttore), Stampante di default (menu a tendina), Stampa intestazione (interruttore), Frase di cortesia (campo testo)
- **Copia conforme scontrino**: Stampante di default (menu a tendina), Frase di cortesia (campo testo)
- **Codice a barre**: Stampante di default (menu a tendina)

#### D. Causali di Vendita
- Descrizione
- Prefisso nota su documento (campo testo)
- Modifica del prezzo al cambio dell'aliquota IVA (interruttore)
- Stampa articoli a prezzo zero (interruttore)
- Stampa obbligatoria di scontrini e fatture anche senza stampante fiscale (interruttore)
- Stampa relazione finanziaria alla chiusura della giornata (interruttore)
- Stampa report a fine turno (interruttore)
- Visualizzazione dettagli aggiuntivi e conti chiusi a fine turno e alla chiusura di giornata se il ruolo dell'operatore lo consente (interruttore)
- Stampa dettaglio varianti (interruttore)
- Stampa nome operatore su conto e scontrino (interruttore)
- Stampa codici a barre dei prodotti su conto e scontrino (interruttore)

#### E. Ordini
- Avviso sonoro all'arrivo di un nuovo ordine esterno (menu a tendina)
- Stampa automatica delle comande per gli ordini accettati (interruttore)
- Stampa indirizzo / modalità di consegna in comanda (interruttore)
- Copia nota ordine su conto, scontrino e fattura (interruttore)
- Stampa sempre nomi categorie in comanda (interruttore)
- Stampa ordini in ordine di inserimento (interruttore)
- Stampa ordinazioni nello stesso ordine di disposizione di categorie e prodotti nell'interfaccia grafica (interruttore)
- Stampa una comanda per ogni categoria (interruttore)
- Abilita tasto per la stampa diretta della comanda (interruttore)
- Stampa conteggio pezzi in comanda (menu a tendina)
- Prossimo numero ordine (campo numerico)
- Massimo numero ordine (campo numerico)
- Prefisso (campo testo)

#### F. Postazioni
- Elenco postazioni con: Nome postazione (campo testo), Attiva (interruttore)

#### G. Comande
- Stile prodotti (maiuscolo/minuscolo/normale/grassetto)
- Stile varianti (maiuscolo/minuscolo/normale/grassetto)
- Dimensione varianti (normale/doppia)

#### H. Generali
- Stile pulsantiera (anteprima grafica)
- Numero di righe categorie visibili (slider)
- Modalità scorrimento categorie (verticale)
- Visualizza i prodotti correlati (interruttore)
- Visualizza i prodotti suggeriti (interruttore)
- Numero di righe massime di prodotti correlati visibili (campo numerico)
- Resetta filtro ricerca dopo ogni inserimento prodotto (interruttore)
- Autenticazione (interruttore)
- Autenticazione obbligatoria per ogni nuovo conto (interruttore)
- Cassa chiusa automaticamente dopo autenticazione con iBeacon (interruttore)
- Selezione obbligatoria dei pagamenti (interruttore)

#### I. Importazione
- **Stampa DGFE**
- **Stampa DGFE per periodo**: Data inizio (calendario), Data fine (calendario)
- **Stampa DGFE per numero documento**: Giorno (calendario), Numero iniziale (campo numerico), Numero finale (campo numerico)
- **Prodotti**
- **Categorie**
- **Reparti**
- **Aliquote IVA**
- **Operatori**

### 3. MENU PAGAMENTO
Implementa le seguenti modalità di pagamento:
- Contanti, Bancomat, Carta di Credito, Assegno, Ticket, Buono per servizi, Buono per beni, Prepagata, TS Wallet, Differito, Bonifico bancario, Riba 30, Riba 60, Poste Pay, Paypal

Con opzioni per:
- **Scontrino**
- **Fattura**: Cliente (campo testo), Azienda (campo testo), Causale (menu a tendina), Numero Fattura (campo numerico), Split payment (interruttore), Importo da riscuotere (campo testo)
- **Conto**: Cliente (campo testo), Azienda (campo testo), Causale (menu a tendina)

## Requisiti Tecnici
1. Utilizza una struttura gerarchica ad albero navigabile
2. Implementa controlli appropriati per ogni tipo di campo (interruttori, menu a tendina, campi numerici, calendario, slider)
3. Mantieni la logica di raggruppamento delle funzionalità correlate
4. Assicurati che l'interfaccia sia intuitiva per operatori POS
5. Implementa validazioni appropriate per i campi obbligatori
6. Crea un design responsive e accessibile

## Note Aggiuntive
- Rispetta la gerarchia esatta mostrata nella struttura
- Ogni interruttore deve avere stati chiari (attivo/disattivo)
- I menu a tendina devono supportare selezioni appropriate per il contesto POS
- I campi numerici devono avere validazioni appropriate
- L'interfaccia deve supportare workflow di cassa efficienti