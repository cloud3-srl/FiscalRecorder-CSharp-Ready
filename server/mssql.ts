import mssql from 'mssql';
import { DatabaseConfig } from '@shared/schema';

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
export async function importProductsFromC3EXPPOS(config: DatabaseConfig, codiceAzienda: string = 'SCARL'): Promise<any[]> {
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
