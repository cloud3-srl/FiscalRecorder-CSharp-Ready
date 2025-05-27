if (!config) {
        return res.status(404).json({ success: false, error: "Configurazione non trovata" });
      }

      if (config.isActive) {
        return res.status(400).json({ success: false, error: "Impossibile eliminare la configurazione attiva" });
      }

      // Elimina la configurazione
      await db.delete(databaseConfigs).where(eq(databaseConfigs.id, id));
      
      res.json({ success: true, message: "Configurazione eliminata con successo" });
    } catch (error) {
      console.error('Errore eliminazione configurazione:', error);
      res.status(500).json({ 
        success: false, 
        error: "Errore durante l'eliminazione della configurazione",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // API per attivare una configurazione database
  app.post("/api/admin/database-configs/:id/toggle-active", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: "ID configurazione non valido" });
    }

    try {
      await db.transaction(async (tx) => {
        // Disattiva tutte le configurazioni
        await tx.update(databaseConfigs).set({ isActive: false });
        
        // Attiva la configurazione richiesta
        const [config] = await tx.update(databaseConfigs)
          .set({ isActive: true })
          .where(eq(databaseConfigs.id, id))
          .returning();
        
        if (!config) {
          throw new Error("Configurazione non trovata");
        }
        
        res.json({ success: true, data: config, message: "Configurazione attivata con successo" });
      });
    } catch (error) {
      console.error('Errore attivazione configurazione:', error);
      res.status(500).json({ 
        success: false, 
        error: "Errore durante l'attivazione della configurazione",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateReceiptNumber(): string {
  return `R${Date.now()}`;
}
