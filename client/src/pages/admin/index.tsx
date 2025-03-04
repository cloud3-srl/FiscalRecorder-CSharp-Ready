import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const response = await fetch('/api/admin/import-products', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'importazione');
      }

      const data = await response.json();
      toast({
        title: "Importazione completata",
        description: `Importati ${data.imported} prodotti con successo`
      });
      setFile(null);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile importare i prodotti",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Amministrazione</h1>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Importa Prodotti (CSV)</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button 
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importa
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Il file CSV deve contenere le seguenti colonne:
              <ul className="list-disc list-inside mt-2">
                <li>code (Codice prodotto)</li>
                <li>name (Nome prodotto)</li>
                <li>price (Prezzo)</li>
                <li>category (Categoria - opzionale)</li>
                <li>description (Descrizione - opzionale)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
