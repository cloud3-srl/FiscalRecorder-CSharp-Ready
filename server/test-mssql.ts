import * as sql from 'mssql';

async function testMssqlConnection() {
  const sqlConfig = {
    user: 'sa',
    password: '!Nuvola3',
    server: '10.0.50.53',
    database: 'ahr_pog',
    options: {
      encrypt: true, // Per Azure
      trustServerCertificate: true, // Per server locali / sviluppo
      enableArithAbort: true
    }
  };

  try {
    console.log('Tentativo di connessione al database MSSQL...');
    const pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log('Connessione stabilita con successo!');
    
    console.log('Esecuzione query di test...');
    const result = await pool.request().query('SELECT * FROM C3EXPPOS WHERE EAIMPPOS=\'N\' AND EACODAZI=\'SCARL\'');
    
    console.log('Query eseguita con successo!');
    console.log(`Numero di righe restituite: ${result.recordset.length}`);
    
    if (result.recordset.length > 0) {
      console.log('Prima riga:');
      console.log(result.recordset[0]);
    }
    
    await pool.close();
    console.log('Connessione chiusa.');
  } catch (err) {
    console.error('Errore nella connessione o nell\'esecuzione della query:', err);
  }
}

testMssqlConnection();
