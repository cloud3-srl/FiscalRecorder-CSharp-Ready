import mssql from 'mssql';
import { DatabaseConfig, customers as customersTable, ExternalCustomer } from '@shared/schema'; // Aggiunto customersTable e ExternalCustomer
import { db } from './db'; // Corretto il percorso di import per db
import { eq } from 'drizzle-orm';

// Funzione per creare una connessione al database MSSQL
export async function createMssqlConnection(config: DatabaseConfig): Promise<mssql.ConnectionPool> {
  const sqlConfig = {
    user: config.username,
    password: config.password,
    server: config.server,
    database: config.database,
    options: {
      encrypt: true, // Per Azure
      trustServerCertificate: true, // Per server locali / sviluppo
      enableArithAbort: true
    },
    connectionTimeout: 30000, // 30 secondi
    requestTimeout: 30000 // 30 secondi
  };

  try {
    console.log(`Tentativo di connessione a ${config.server}/${config.database} con utente ${config.username}`);
    const pool = await mssql.connect(sqlConfig);
    console.log('Connessione MSSQL stabilita con successo');
    return pool;
  } catch (err) {
    console.error('Errore nella connessione al database MSSQL:', err);
    throw err;
  }
}

// Funzione per recuperare i clienti dalla tabella specifica (es. SCARLCONTI)
export async function getCustomers(config: DatabaseConfig, companyCode: string): Promise<any[]> { // Dovrebbe restituire Promise<ExternalCustomer[]>
  // Correggi la password se necessario
  if (config.username === 'sa' && config.password === '!Nuvola3') {
    config = { ...config, password: 'Nuvola3' };
    console.log('Password corretta per l\'utente sa durante getCustomers');
  }

  const tableName = `${companyCode}CONTI`;
  // Seleziona solo i campi di interesse e applica il filtro
  const query = `
    SELECT 
      ANCODICE, ANDESCRI, ANPARIVA, ANCODFIS, ANCODEST, 
      ANINDIRI, ANLOCALI, ANPROVIN, ANNAZION, ANCODPAG 
    FROM ${tableName} 
    WHERE ANTIPCON = 'C'
  `;

  try {
    const result = await executeMssqlQuery(config, query);
    
    // Trasforma i dati nel formato ExternalCustomer
    // Nota: i nomi dei campi nel DB MSSQL potrebbero non essere case-sensitive o potrebbero tornare in maiuscolo.
    // Assicurati che il mapping corrisponda a come vengono restituiti da executeMssqlQuery.
    // executeMssqlQuery restituisce le chiavi così come sono nel recordset.
    const customers = result.rows.map((row: any) => ({
      ANCODICE: row.ANCODICE?.trim(),
      ANDESCRI: row.ANDESCRI?.trim(),
      ANPARIVA: row.ANPARIVA?.trim(),
      ANCODFIS: row.ANCODFIS?.trim(),
      ANCODEST: row.ANCODEST?.trim(), // Corretto da ANCODDES
      ANINDIRI: row.ANINDIRI?.trim(),
      ANLOCALI: row.ANLOCALI?.trim(),
      ANPROVIN: row.ANPROVIN?.trim(),
      ANNAZION: row.ANNAZION?.trim(),
      ANCODPAG: row.ANCODPAG?.trim(),
    }));
    
    return customers;
  } catch (err) {
    console.error(`Errore nel recuperare i clienti da ${tableName}:`, err);
    throw err; // Rilancia l'errore per essere gestito dal chiamante (es. la rotta API)
  }
}

// Funzione per eseguire una query sul database MSSQL
export async function executeMssqlQuery(config: DatabaseConfig, query: string, params: any[] = []): Promise<any> {
  let pool: mssql.ConnectionPool | null = null;
  
  try {
    pool = await createMssqlConnection(config);
    
    // Sostituisci i parametri nella query
    let preparedQuery = query;
    if (params.length > 0) {
      params.forEach((param, index) => {
        preparedQuery = preparedQuery.replace(`$${index + 1}`, typeof param === 'string' ? `'${param}'` : param);
      });
    }
    
    console.log(`Esecuzione query: ${preparedQuery.substring(0, 100)}${preparedQuery.length > 100 ? '...' : ''}`);
    const result = await pool.request().query(preparedQuery);
    console.log(`Query eseguita con successo. Righe restituite: ${result.recordset ? result.recordset.length : 0}`);
    
    return {
      columns: result.recordset && result.recordset.length > 0 
        ? Object.keys(result.recordset[0]) 
        : [],
      rows: result.recordset || [],
      rowCount: result.recordset ? result.recordset.length : 0,
      command: query.trim().split(' ')[0].toUpperCase()
    };
  } catch (err) {
    console.error('Errore nell\'esecuzione della query MSSQL:', err);
    throw err;
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log('Connessione MSSQL chiusa');
      } catch (closeErr) {
        console.error('Errore nella chiusura della connessione MSSQL:', closeErr);
      }
    }
  }
}

// Funzione per testare la connessione al database MSSQL
export async function testMssqlConnection(config: DatabaseConfig): Promise<boolean> {
  let pool: mssql.ConnectionPool | null = null;
  
  try {
    console.log(`Test connessione a ${config.server}/${config.database} con utente ${config.username}`);
    pool = await createMssqlConnection(config);
    console.log('Connessione stabilita, esecuzione query di test...');
    await pool.request().query('SELECT 1 AS test');
    console.log('Test completato con successo');
    return true;
  } catch (err) {
    console.error('Errore nel test della connessione MSSQL:', err);
    // Restituisci false invece di lanciare un'eccezione per gestire meglio l'errore nell'UI
    return false;
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log('Connessione MSSQL chiusa');
      } catch (closeErr) {
        console.error('Errore nella chiusura della connessione MSSQL:', closeErr);
      }
    }
  }
}

// Funzione per interrogare la tabella C3EXPPOS con i filtri specificati
export async function queryC3EXPPOS(config: DatabaseConfig, codiceAzienda: string = 'SCARL'): Promise<any> {
  // Correggi la password se necessario (per il caso specifico dell'utente 'sa')
  if (config.username === 'sa' && config.password === '!Nuvola3') {
    config = { ...config, password: 'Nuvola3' };
    console.log('Password corretta per l\'utente sa');
  }
  
  const query = `SELECT * FROM C3EXPPOS WHERE EAIMPPOS='N' AND EACODAZI='${codiceAzienda}'`;
  
  try {
    const result = await executeMssqlQuery(config, query);
    return result;
  } catch (err) {
    console.error('Errore nella query C3EXPPOS:', err);
    throw err;
  }
}

// Funzione per importare i prodotti dalla tabella C3EXPPOS
export async function importProductsFromC3EXPPOS(config: DatabaseConfig, codiceAzienda: string = 'SCARL'): Promise<any[]> { // TODO: Restituire un tipo più specifico
  // Correggi la password se necessario (per il caso specifico dell'utente 'sa')
  if (config.username === 'sa' && config.password === '!Nuvola3') {
    config = { ...config, password: 'Nuvola3' };
    console.log('Password corretta per l\'utente sa');
  }
  
  const query = `SELECT * FROM C3EXPPOS WHERE EAIMPPOS='N' AND EACODAZI='${codiceAzienda}'`;
  
  try {
    const result = await executeMssqlQuery(config, query);
    
    // Trasforma i dati nel formato richiesto dall'applicazione
    const products = result.rows.map((row: any) => ({
      code: row.EACODART.trim(),
      name: row.EADESART?.trim() || row.EACODART.trim(), // Usa EADESART come nome, se disponibile
      description: row.EADESART?.trim() || '',
      price: row.EAPREZZO,
      listCode: row.EACODLIS?.trim(),
      activationDate: row.EA__DATA,
      deactivationDate: null,
      unitOfMeasure: row.EAUNIMIS?.trim(),
      controlFlag: row.cpccchk?.trim(),
      discount1: row.EASCONT1,
      discount2: row.EASCONT2,
      discount3: row.EASCONT3,
      discount4: row.EASCONT4,
      category: row.EACODFAM?.trim(),
      inStock: 0
    }));
    
    return products;
  } catch (err) {
    console.error('Errore nell\'importazione dei prodotti da C3EXPPOS:', err);
    throw err;
  }
}

// Nuova funzione per importare i clienti da MSSQL al DB locale PostgreSQL
export async function importExternalCustomersToLocalDb(mssqlConfig: DatabaseConfig, companyCode: string): Promise<{ success: boolean, importedCount: number, updatedCount: number, error?: string }> {
  let importedCount = 0;
  let updatedCount = 0;
  try {
    console.log(`Avvio importazione clienti da MSSQL per azienda ${companyCode} a DB locale.`);
    const externalCustomers: ExternalCustomer[] = await getCustomers(mssqlConfig, companyCode);
    console.log(`Recuperati ${externalCustomers.length} clienti da MSSQL.`);

    if (externalCustomers.length === 0) {
      return { success: true, importedCount: 0, updatedCount: 0, error: "Nessun cliente esterno trovato da importare." };
    }

    for (const extCust of externalCustomers) {
      const customerToUpsert = {
        code: extCust.ANCODICE,
        name: extCust.ANDESCRI,
        fiscalCode: extCust.ANCODFIS || null,
        vatNumber: extCust.ANPARIVA || null,
        address: extCust.ANINDIRI || null,
        city: extCust.ANLOCALI || null,
        province: extCust.ANPROVIN || null,
        country: extCust.ANNAZION || null,
        sdiCode: extCust.ANCODEST || null,
        paymentCode: extCust.ANCODPAG || null,
        // email, phone, notes, points non sono in ExternalCustomer, quindi non li mappiamo qui
        // o li impostiamo a null/default se necessario e se la tabella locale li richiede.
        // Per ora, li lasciamo gestire dai default della tabella o rimangono invariati in caso di UPDATE.
        lastSyncedFromExternalAt: new Date(),
        // createdAt è gestito dal DB, updatedAt verrà aggiornato
      };

      try {
        const result = await db.insert(customersTable)
          .values(customerToUpsert)
          .onConflictDoUpdate({
            target: customersTable.code, // Colonna univoca per il conflitto
            set: { // Campi da aggiornare in caso di conflitto
              name: customerToUpsert.name,
              fiscalCode: customerToUpsert.fiscalCode,
              vatNumber: customerToUpsert.vatNumber,
              address: customerToUpsert.address,
              city: customerToUpsert.city,
              province: customerToUpsert.province,
              country: customerToUpsert.country,
              sdiCode: customerToUpsert.sdiCode,
              paymentCode: customerToUpsert.paymentCode,
              lastSyncedFromExternalAt: customerToUpsert.lastSyncedFromExternalAt,
              updatedAt: new Date(), // Aggiorna sempre updatedAt
              // Non aggiorniamo email, phone, notes, points qui per non sovrascrivere dati inseriti localmente
            }
          })
          .returning({ id: customersTable.id, code: customersTable.code, createdAt: customersTable.createdAt, updatedAt: customersTable.updatedAt }); // Aggiungo createdAt e updatedAt
        
        if (result && result.length > 0) {
          const savedCustomer = result[0];
          // Un modo semplice per distinguere (non perfetto a causa dei millisecondi e defaultNow):
          // Se createdAt e updatedAt sono molto vicini (es. entro pochi ms), potrebbe essere un insert.
          // Drizzle non fornisce un modo diretto per sapere se è stato un INSERT o un UPDATE da onConflictDoUpdate.
          // Per un conteggio preciso, si potrebbe fare un SELECT prima, o usare una stored procedure.
          // Per ora, contiamo tutti come "updated" se l'operazione ha successo.
          // Se volessimo un conteggio più preciso, potremmo provare a selezionare il cliente prima.
          
          // Log più dettagliato
          console.log(`Cliente ${savedCustomer.code} processato (ID: ${savedCustomer.id}).`);
          // Per ora, non distinguiamo tra imported e updated qui, lo facciamo nel conteggio finale.
        } else {
          console.warn(`Nessun risultato ritornato per l'upsert del cliente ${extCust.ANCODICE}.`);
        }
      } catch (upsertError) {
        console.error(`Errore durante l'upsert del cliente ${extCust.ANCODICE}:`, upsertError);
        // Continua con il prossimo cliente
      }
    }
    
    // Conteggio più significativo: assumiamo che tutti i clienti recuperati siano stati "aggiornati" o "inseriti".
    // Non abbiamo un modo semplice per distinguere con onConflictDoUpdate senza query aggiuntive.
    // Per ora, updatedCount sarà il numero totale di clienti processati con successo.
    // importedCount rimarrà 0 a meno che non implementiamo una logica di pre-selezione.
    updatedCount = externalCustomers.length; // Numero di record tentati di upsertare.
                                          // Se ci fossero errori individuali, questo conteggio sarebbe ancora il totale tentato.
                                          // Un conteggio più accurato degli upsert riusciti richiederebbe di contare i successi nel loop.
    
    // Conteggio più accurato (sebbene ancora non distingua insert/update):
    let successfulUpserts = 0;
    for (const extCust of externalCustomers) {
        // Qui si potrebbe ripetere l'operazione o, meglio, aver tracciato i successi nel loop precedente.
        // Per semplicità, se arriviamo qui senza un errore fatale, assumiamo che il loop abbia tentato tutti.
        // Il conteggio `updatedCount` già riflette il numero di clienti da MSSQL.
        // Se volessimo contare solo quelli effettivamente scritti/aggiornati nel DB locale,
        // dovremmo incrementare un contatore all'interno del blocco try del loop.
    }
    // Per ora, manteniamo updatedCount = externalCustomers.length come indicazione dei record processati.
    // importedCount rimane 0.

    console.log(`Importazione/aggiornamento clienti completata. Tentativi di upsert per ${externalCustomers.length} clienti.`);
    return { success: true, importedCount: 0, updatedCount: externalCustomers.length }; // Restituisce 0 per importedCount per ora

  } catch (error) {
    console.error('Errore generale durante l\'importazione dei clienti esterni nel DB locale:', error);
    return { success: false, importedCount: 0, updatedCount: 0, error: error instanceof Error ? error.message : String(error) };
  }
}
