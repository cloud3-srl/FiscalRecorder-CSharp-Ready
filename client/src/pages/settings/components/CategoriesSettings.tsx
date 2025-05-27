import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function CategoriesSettings() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardDescription>
                Configura le categorie per i tuoi prodotti
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Nuova Categoria
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funzionalità in fase di sviluppo...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CategoriesSettings;
