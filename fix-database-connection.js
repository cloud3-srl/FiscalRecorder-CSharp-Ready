// Script per correggere la connessione al database PostgreSQL
const fs = require('fs');
const path = require('path');

console.log('🔧 Correzione connessione database PostgreSQL...');

// Leggi il file routes.ts
const routesPath = 'server/routes.ts';
let routesContent = fs.readFileSync(routesPath, 'utf8');

// Aggiungi import per pg all'inizio del file
if (!routesContent.includes("import { Client } from 'pg'")) {
  routesContent = routesContent.replace(
    "import { z } from 'zod';",
    "import { z } from 'zod';\nimport { Client } from 'pg';"
  );
}

// Aggiungi funzione per testare PostgreSQL
const pgTestFunction = `
// Funzione per testare connessione PostgreSQL
async function testPostgresConnection(config: any): Promise<boolean> {
  const client = new Client({
    host: config.server,
    port: config.port || 5432,
    database: config.database,
    user: config.username,
    password: config.password,
  });
  
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch (error) {
    console.error('Errore connessione PostgreSQL:', error);
    try {
      await client.end();
    } catch (e) {}
    return false;
  }
}
`;

// Inserisci la funzione prima della registrazione delle route
if (!routesContent.includes('testPostgresConnection')) {
  routesContent = routesContent.replace(
    'export async function registerRoutes(app: Express): Promise<http.Server> {',
    pgTestFunction + '\nexport async function registerRoutes(app: Express): Promise<http.Server> {'
  );
}

// Sostituisci la logica del test-connection per supportare entrambi i driver
const oldTestConnection = `    try {
      const startTime = Date.now();
      const success = await testMssqlConnection(configToTest);
      const message = success ? "Connessione stabilita con successo" : "Test connessione fallito";`;

const newTestConnection = `    try {
      const startTime = Date.now();
      let success = false;
      
      if (configToTest.driver === 'postgresql') {
        success = await testPostgresConnection(configToTest);
      } else {
        success = await testMssqlConnection(configToTest);
      }
      
      const message = success ? "Connessione stabilita con successo" : "Test connessione fallito";`;

if (routesContent.includes(oldTestConnection)) {
  routesContent = routesContent.replace(oldTestConnection, newTestConnection);
}

// Scrivi il file modificato
fs.writeFileSync(routesPath, routesContent);
console.log('✅ File routes.ts aggiornato');

// Aggiungi pg alle dipendenze package.json se non presente
const packagePath = 'package.json';
const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (!packageContent.dependencies.pg) {
  console.log('📦 Aggiunta dipendenza pg...');
  packageContent.dependencies.pg = '^8.16.0';
  if (!packageContent.devDependencies['@types/pg']) {
    packageContent.devDependencies['@types/pg'] = '^8.15.2';
  }
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
  console.log('✅ package.json aggiornato');
}

console.log('🎉 Correzioni completate!');
console.log('💡 Ora esegui:');
console.log('   npm install');
console.log('   npm run build');
console.log('   pm2 restart fiscalrecorder');
