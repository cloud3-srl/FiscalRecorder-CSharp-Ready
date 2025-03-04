import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Download, Trash2, Database, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorLogId, setErrorLogId] = useState<string | null>(null);
  const { toast } = useToast();

  // Query per ottenere le statistiche
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Mutation per svuotare l'archivio
  const { mutate: clearArchive, isPending: isClearing } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/clear-products', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Impossibile svuotare l\'archivio');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Archivio svuotato",
        description: "Tutti gli articoli sono stati rimossi"
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile svuotare l'archivio",
        variant: "destructive"
      });
    }
  });

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

  const handleClearArchive = () => {
    if (window.confirm('Sei sicuro di voler svuotare l\'archivio? Questa azione è irreversibile.')) {
      clearArchive();
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-6">Amministrazione</h1>

        {/* Statistiche */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Totale Articoli</div>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalProducts || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Ultima Sincronizzazione</div>
            <div className="text-sm font-medium">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.lastSync || 'Mai'}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Stato Cache</div>
            <div className="text-sm font-medium flex items-center gap-2">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className={`h-2 w-2 rounded-full ${stats?.cacheStatus === 'valid' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  {stats?.cacheStatus === 'valid' ? 'Aggiornata' : 'Da aggiornare'}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Gestione Archivio */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Gestione Archivio</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aggiorna
              </Button>
              <Button 
                variant="destructive"
                onClick={handleClearArchive}
                disabled={isClearing}
              >
                {isClearing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Svuota Archivio
              </Button>
            </div>
          </div>

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