import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Download } from "lucide-react";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorLogId, setErrorLogId] = useState<string | null>(null);
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

      if (data.errors && data.errors.length > 0) {
        setErrorLogId(data.errorLogId);
        toast({
          title: "Importazione completata con errori",
          description: `Importati ${data.imported} prodotti su ${data.total}. ${data.errors.length} errori riscontrati.`,
          variant: "destructive"
        });
      } else {
        setErrorLogId(null);
        toast({
          title: "Importazione completata",
          description: `Importati ${data.imported} prodotti con successo`
        });
      }

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

  const handleDownloadErrors = () => {
    if (errorLogId) {
      window.location.href = `/api/admin/import-errors/${errorLogId}`;
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

            {errorLogId && (
              <Button 
                variant="outline" 
                onClick={handleDownloadErrors}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Scarica log errori
              </Button>
            )}

            <div className="text-sm text-muted-foreground">
              Il file CSV deve contenere le seguenti colonne:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>ARCODART (Codice articolo - obbligatorio)</li>
                <li>ARDESART (Descrizione articolo - obbligatorio)</li>
                <li>LIPREZZO (Prezzo - obbligatorio)</li>
                <li>LICODLIS (Codice listino)</li>
                <li>LIDATATT (Data attivazione - formato YYYY-MM-DD)</li>
                <li>LIDATDIS (Data disattivazione - formato YYYY-MM-DD)</li>
                <li>LIUNIMIS (Unità di misura)</li>
                <li>cpccchk (Flag di controllo)</li>
                <li>LISCONT1 (Primo sconto)</li>
                <li>LISCONT2 (Secondo sconto)</li>
                <li>LISCONT3 (Terzo sconto)</li>
                <li>LISCONT4 (Quarto sconto)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}