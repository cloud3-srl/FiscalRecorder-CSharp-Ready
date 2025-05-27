import mssql from 'mssql';
import { DatabaseConfig, customers as customersTable, ExternalCustomer, products as productsTable, paymentMethods as paymentMethodsTable } from '@shared/schema';
import * as schema from '@shared/schema'; 
import { db } from './db'; 
import { eq } from 'drizzle-orm';

// Funzione per creare una connessione al database MSSQL
export async function createMssqlConnection(config: Pick<DatabaseConfig, 'username' | 'password' | 'server' | 'database' | 'driver'>): Promise<mssql.ConnectionPool> {
  const sqlConfig: mssql.config = { // Aggiunto tipo esplicito per sqlConfig
    user: config.username,
    password: config.password,
    server: config.server,
    database: config.database,
    driver: config.driver, // Aggiunto driver se necessario per mssql.connect
    options: {
      encrypt: true, 
      trustServerCertificate: true, 
      enableArithAbort: true
    },
    connectionTimeout: 30000, 
    requestTimeout: 30000 
  };

  try {
    // console.log(`Tentativo di connessione a ${config.server}/${config.database} con utente ${config.username}`);
    const pool = await mssql.connect(sqlConfig);
    // console.log('Connessione MSSQL stabilita con successo');
    return pool;
  } catch (err) {
    console.error('Errore nella connessione al database MSSQL:', err);
    throw err;
  }
}

// Funzione per recuperare i clienti dalla tabella specifica
export async function getCustomers(config: DatabaseConfig, companyCode: string, customerTableNamePattern?: string): Promise<ExternalCustomer[]> {
  if (config.username === 'sa' && config.password === '!Nuvola3') {
    config = { ...config, password: 'Nuvola3' };
  }
  let actualCustomerTableName: string;
  if (customerTableNamePattern) {
    actualCustomerTableName = customerTableNamePattern.replace('{companyCode}', companyCode);
  } else {
    actualCustomerTableName = `${companyCode}CONTI`; 
  }
  const query = `
    SELECT ANCODICE, ANDESCRI, ANPARIVA, ANCODFIS, ANCODEST, ANINDIRI, ANLOCALI, ANPROVIN, ANNAZION, ANCODPAG 
    FROM ${actualCustomerTableName} WHERE ANTIPCON = 'C'`;
  try {
    const result = await executeMssqlQuery(config, query);
    return result.rows.map((row: any) => ({
      ANCODICE: row.ANCODICE?.trim(), ANDESCRI: row.ANDESCRI?.trim(), ANPARIVA: row.ANPARIVA?.trim(),
      ANCODFIS: row.ANCODFIS?.trim(), ANCODEST: row.ANCODEST?.trim(), ANINDIRI: row.ANINDIRI?.trim(),
      ANLOCALI: row.ANLOCALI?.trim(), ANPROVIN: row.ANPROVIN?.trim(), ANNAZION: row.ANNAZION?.trim(),
      ANCODPAG: row.ANCODPAG?.trim(),
    }));
  } catch (err) {
    console.error(`Errore nel recuperare i clienti da ${actualCustomerTableName}:`, err);
    throw err;
  }
}

// Funzione per eseguire una query sul database MSSQL
export async function executeMssqlQuery(config: DatabaseConfig, query: string, params: any[] = []): Promise<any> {
  let pool: mssql.ConnectionPool | null = null;
  try {
    pool = await createMssqlConnection(config);
    let preparedQuery = query;
    if (params.length > 0) {
      // Basic parameter substitution, consider mssql.Request for proper parameterization
      params.forEach((param, index) => {
        preparedQuery = preparedQuery.replace(`$${index + 1}`, typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param);
      });
    }
    const result = await pool.request().query(preparedQuery);
    return {
      columns: result.recordset && result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [],
      rows: result.recordset || [],
      rowCount: result.recordset ? result.recordset.length : 0,
      command: query.trim().split(' ')[0].toUpperCase()
    };
  } catch (err) {
    console.error('Errore nell\'esecuzione della query MSSQL:', err);
    throw err;
  } finally {
    if (pool) { try { await pool.close(); } catch (closeErr) { console.error('Errore chiusura connessione MSSQL:', closeErr); } }
  }
}

// Tipo per i parametri necessari a testMssqlConnection
type ConnectionTestParams = Pick<schema.DatabaseConfig, 'username' | 'password' | 'server' | 'database' | 'driver'>;

export async function testMssqlConnection(config: ConnectionTestParams): Promise<boolean> {
  let pool: mssql.ConnectionPool | null = null;
  try {
    // Ricostruisci un oggetto config parziale solo con i campi necessari per createMssqlConnection
    const connectionConfig = {
        username: config.username,
        password: config.password,
        server: config.server,
        database: config.database,
        driver: config.driver,
        // Aggiungi altri campi di DatabaseConfig con valori fittizi se createMssqlConnection li richiede
        // ma non sono in ConnectionTestParams e non sono usati per la connessione effettiva.
        // Per ora, assumiamo che createMssqlConnection usi solo questi.
        id: 0, name: '', options: {}, isActive: false, lastSync: null, createdAt: new Date() 
    };
    pool = await createMssqlConnection(connectionConfig);
    await pool.request().query('SELECT 1 AS test');
    return true;
  } catch (err) { return false; } 
  finally {
    if (pool) { try { await pool.close(); } catch (closeErr) { /* ignore */ } }
  }
}

export async function queryC3EXPPOS(config: DatabaseConfig, codiceAzienda: string = 'SCARL', productTableName?: string ): Promise<any> {
  if (config.username === 'sa' && config.password === '!Nuvola3') {
    config = { ...config, password: 'Nuvola3' };
  }
  const actualProductTableName = productTableName || 'C3EXPPOS';
  const query = `SELECT * FROM ${actualProductTableName} WHERE EAIMPPOS='N' AND EACODAZI='${codiceAzienda}'`;
  try {
    return await executeMssqlQuery(config, query);
  } catch (err) {
    console.error(`Errore nella query ${actualProductTableName}:`, err);
    throw err;
  }
}

export async function importProductsFromExternalDb(
  config: DatabaseConfig, 
  codiceAzienda: string = 'SCARL',
  productTableName?: string
): Promise<{ success: boolean, importedCount: number, updatedCount: number, error?: string }> {
  if (config.username === 'sa' && config.password === '!Nuvola3') {
    config = { ...config, password: 'Nuvola3' };
  }
  const actualProductTableName = productTableName || 'C3EXPPOS';
  const query = `SELECT * FROM ${actualProductTableName} WHERE EAIMPPOS='N' AND EACODAZI='${codiceAzienda}'`;
  try {
    const result = await executeMssqlQuery(config, query);
    const externalProducts = result.rows.map((row: any) => ({
      code: row.EACODART?.trim(),
      name: row.EADESART?.trim() || row.EACODART?.trim(),
      description: row.EADESART?.trim() || null,
      barcode: row.EACODBAR?.trim() || null,
      price: String(row.EAPREZZO ?? 0), 
      vatRate: row.EAPERIVA ? String(row.EAPERIVA) : null,
      listCode: row.EACODLIS?.trim() || null,
      activationDate: row.EA__DATA ? new Date(row.EA__DATA) : null, 
      deactivationDate: null, 
      unitOfMeasure: row.EAUNIMIS?.trim() || null,
      controlFlag: row.cpccchk?.trim() || null,
      discount1: row.EASCONT1 ? String(row.EASCONT1) : null,
      discount2: row.EASCONT2 ? String(row.EASCONT2) : null,
      discount3: row.EASCONT3 ? String(row.EASCONT3) : null,
      discount4: row.EASCONT4 ? String(row.EASCONT4) : null,
      departmentCode: row.EACODREP?.trim() || null,
      category: row.EACODFAM?.trim() || null, 
      familyDescription: row.EADESFAM?.trim() || null,
      homogeneousCategoryCode: row.EACATOMO?.trim() || null,
      homogeneousCategoryDescription: row.EADESOMO?.trim() || null,
      isLotManaged: (() => {
        const eaflottVal = row.EAFLOTT;
        if (typeof eaflottVal === 'string') {
          const trimmedUpper = eaflottVal.trim().toUpperCase();
          return trimmedUpper === 'S' || trimmedUpper === '1' || trimmedUpper === 'Y' || trimmedUpper === 'T' || trimmedUpper === 'TRUE';
        } else if (typeof eaflottVal === 'number') { return eaflottVal === 1; }
        else if (typeof eaflottVal === 'boolean') { return eaflottVal; }
        return false;
      })(),
      inStock: 0 
    }));
    if (externalProducts.length === 0) return { success: true, importedCount: 0, updatedCount: 0, error: `Nessun prodotto in ${actualProductTableName}` };
    for (const extProd of externalProducts) {
      if (!extProd.code) { console.warn("Prodotto saltato per codice mancante:", extProd); continue; }
      try {
        // Rimuovi 'id' se presente in extProd prima dell'upsert, dato che è autogenerato
        const { id, ...prodDataToUpsert } = extProd as any; // Cast to any to allow deleting id
        await db.insert(productsTable).values(prodDataToUpsert)
          .onConflictDoUpdate({ target: productsTable.code, set: { ...prodDataToUpsert, code: undefined } }); // code non va aggiornato nel set di onConflict
      } catch (upsertError) { console.error(`Errore upsert prodotto ${extProd.code}:`, upsertError); }
    }
    return { success: true, importedCount: 0, updatedCount: externalProducts.length }; // Conteggio semplificato
  } catch (err) {
    console.error(`Errore import prodotti da ${actualProductTableName}:`, err);
    return { success: false, importedCount: 0, updatedCount: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function importExternalCustomersToLocalDb(
  mssqlConfig: DatabaseConfig, 
  companyCode: string,
  customerTableNamePattern?: string
): Promise<{ success: boolean, importedCount: number, updatedCount: number, error?: string }> {
  if (mssqlConfig.username === 'sa' && mssqlConfig.password === '!Nuvola3') {
    mssqlConfig = { ...mssqlConfig, password: 'Nuvola3' };
  }
  let actualCustomerTableName: string;
  if (customerTableNamePattern) {
    actualCustomerTableName = customerTableNamePattern.replace('{companyCode}', companyCode);
  } else {
    actualCustomerTableName = `${companyCode}CONTI`;
  }
  const query = `SELECT ANCODICE, ANDESCRI, ANPARIVA, ANCODFIS, ANCODEST, ANINDIRI, ANLOCALI, ANPROVIN, ANNAZION, ANCODPAG 
    FROM ${actualCustomerTableName} WHERE ANTIPCON = 'C'`;
  try {
    const result = await executeMssqlQuery(mssqlConfig, query);
    const externalCustomers: ExternalCustomer[] = result.rows.map((row: any) => ({
      ANCODICE: row.ANCODICE?.trim(), ANDESCRI: row.ANDESCRI?.trim(), ANPARIVA: row.ANPARIVA?.trim(),
      ANCODFIS: row.ANCODFIS?.trim(), ANCODEST: row.ANCODEST?.trim(), ANINDIRI: row.ANINDIRI?.trim(),
      ANLOCALI: row.ANLOCALI?.trim(), ANPROVIN: row.ANPROVIN?.trim(), ANNAZION: row.ANNAZION?.trim(),
      ANCODPAG: row.ANCODPAG?.trim(),
    }));
    if (externalCustomers.length === 0) return { success: true, importedCount: 0, updatedCount: 0, error: `Nessun cliente in ${actualCustomerTableName}` };
    for (const extCust of externalCustomers) {
      if (!extCust.ANCODICE) { console.warn("Cliente saltato per codice mancante:", extCust); continue; }
      const customerToUpsert = {
        code: extCust.ANCODICE, name: extCust.ANDESCRI, fiscalCode: extCust.ANCODFIS || null,
        vatNumber: extCust.ANPARIVA || null, address: extCust.ANINDIRI || null, city: extCust.ANLOCALI || null,
        province: extCust.ANPROVIN || null, country: extCust.ANNAZION || null, sdiCode: extCust.ANCODEST || null,
        paymentCode: extCust.ANCODPAG || null, lastSyncedFromExternalAt: new Date(),
      };
      try {
        const { id, ...custDataToUpsert } = customerToUpsert as any;
        await db.insert(customersTable).values(custDataToUpsert)
          .onConflictDoUpdate({ target: customersTable.code, set: { ...custDataToUpsert, code: undefined, updatedAt: new Date() } });
      } catch (upsertError) { console.error(`Errore upsert cliente ${extCust.ANCODICE}:`, upsertError); }
    }
    return { success: true, importedCount: 0, updatedCount: externalCustomers.length };
  } catch (error) {
    console.error(`Errore import clienti da ${actualCustomerTableName}:`, error);
    return { success: false, importedCount: 0, updatedCount: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function importPaymentMethodsFromExternalDb(
  mssqlConfig: DatabaseConfig,
  companyCode: string,
  paymentMethodTableNamePattern?: string
): Promise<{ success: boolean, importedCount: number, updatedCount: number, error?: string }> {
  if (mssqlConfig.username === 'sa' && mssqlConfig.password === '!Nuvola3') {
    mssqlConfig = { ...mssqlConfig, password: 'Nuvola3' };
  }
  
  let actualPmTableName: string;
  if (paymentMethodTableNamePattern) {
    actualPmTableName = paymentMethodTableNamePattern.replace('{companyCode}', companyCode);
  } else {
    actualPmTableName = `${companyCode}PAG_AMEN`;
  }
  
  const query = `
    SELECT 
        PACODICE,              -- Codice pagamento
        PADESCRI            -- Descrizione pagamento

    FROM ${actualPmTableName}
    ORDER BY PACODICE;
  `;
  try {
    const result = await executeMssqlQuery(mssqlConfig, query);
    const externalPaymentMethods = result.rows.map((row: any) => ({
      code: row.PACODICE?.trim(), 
      description: row.PADESCRI?.trim(),
    }));
    
    if (externalPaymentMethods.length === 0) {
      return { success: true, importedCount: 0, updatedCount: 0, error: `Nessun metodo pagamento in ${actualPmTableName}` };
    }
    
    let processedCount = 0;
    for (const extPm of externalPaymentMethods) {
      if (!extPm.code || !extPm.description) { 
        console.warn(`Record PM saltato:`, extPm); 
        continue; 
      }
      
      // Determina automaticamente il tipo in base alla descrizione
      let type: schema.PaymentMethod['type'] = 'other';
      const descLower = extPm.description.toLowerCase();
      if (descLower.includes('contanti')) type = 'cash';
      else if (descLower.includes('carta') || descLower.includes('pos') || descLower.includes('bancomat')) type = 'card';
      else if (descLower.includes('digitale') || descLower.includes('satispay') || descLower.includes('paypal')) type = 'digital';
      else if (descLower.includes('voucher') || descLower.includes('buono')) type = 'voucher';
      
      const paymentMethodToUpsert = { 
        code: extPm.code, 
        description: extPm.description, 
        type: type, 
        isActive: true,
        details: {}
      };
      
      try {
        const { id, ...pmDataToUpsert } = paymentMethodToUpsert as any;
        await db.insert(paymentMethodsTable).values(pmDataToUpsert)
          .onConflictDoUpdate({ 
            target: paymentMethodsTable.code, 
            set: { ...pmDataToUpsert, code: undefined, updatedAt: new Date() } 
          });
        processedCount++;
      } catch (upsertError) { 
        console.error(`Errore upsert metodo pagamento ${extPm.code}:`, upsertError); 
      }
    }
    
    return { success: true, importedCount: 0, updatedCount: processedCount };
  } catch (error) {
    console.error(`Errore import metodi pagamento da ${actualPmTableName}:`, error);
    return { 
      success: false, 
      importedCount: 0, 
      updatedCount: 0, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
