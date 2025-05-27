// Script per aggiungere la route execute-query mancante
const fs = require('fs');

console.log('🔧 Aggiunta route execute-query...');

// Leggi il file routes.ts
const routesPath = 'server/routes.ts';
let routesContent = fs.readFileSync(routesPath, 'utf8');

// Trova la posizione dopo la route test-connection
const insertPosition = routesContent.indexOf('  });', routesContent.indexOf('/api/admin/test-connection')) + 6;

const executeQueryRoute = `

  // Route per eseguire query SQL
  app.post("/api/admin/execute-query", async (req, res) => {
    const result = sqlQuerySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }

    const { query } = result.data;

    try {
      // Esegui la query sul database esterno attivo
      const queryResult = await executeMssqlQuery(query);
      
      // Salva la query nello storico
      await db.insert(sqlQueryHistory).values({
        query,
        result: JSON.stringify(queryResult),
        executedAt: new Date(),
        success: true
      });

      res.json({ success: true, data: queryResult });
    } catch (error) {
      console.error("Errore esecuzione query:", error);
      
      // Salva l'errore nello storico
      await db.insert(sqlQueryHistory).values({
        query,
        result: error instanceof Error ? error.message : String(error),
        executedAt: new Date(),
        success: false
      });

      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Errore sconosciuto" 
      });
    }
  });
`;

// Inserisci la route
if (!routesContent.includes('/api/admin/execute-query')) {
  const newContent = routesContent.slice(0, insertPosition) + executeQueryRoute + routesContent.slice(insertPosition);
  fs.writeFileSync(routesPath, newContent);
  console.log('✅ Route execute-query aggiunta con successo!');
} else {
  console.log('⚠️ Route execute-query già presente');
}

console.log('🎉 Operazione completata!');
console.log('💡 Ora esegui:');
console.log('   npm run build');
console.log('   pm2 restart fiscalrecorder');
