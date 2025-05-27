import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";

function CategoriesSettings() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Categorie</h1>
        </div>
        <p className="text-sm text-gray-500 font-medium" style={{ 
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          Gestisci le categorie per organizzare i tuoi prodotti
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista Categorie</CardTitle>
              <CardDescription style={{ 
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
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
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Categorie in sviluppo</h3>
            <p className="text-muted-foreground">
              Funzionalità in fase di sviluppo. Presto potrai gestire le categorie dei prodotti.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CategoriesSettings;
