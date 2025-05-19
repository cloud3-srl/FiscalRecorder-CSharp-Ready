import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Database, CheckCircle, XCircle, Play, Clock, Calendar, Plus, Trash2, RefreshCw } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDatabaseConfigSchema, sqlQuerySchema, scheduleOperationSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DatabaseConfigPage() {
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);
  const [activeTab, setActiveTab] = useState("config");
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Query per ottenere le configurazioni
  const { data: configs = [], isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['/api/admin/database-configs'],
  });

  // Query per ottenere i log di connessione
  const { data: connectionLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/admin/connection-logs'],
    enabled: activeTab === "logs",
  });

  // Query per ottenere la cronologia delle query
  const { data: queryHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/admin/query-history'],
    enabled: activeTab === "query",
  });

  // Query per ottenere le operazioni pianificate
  const { data: scheduledOperations = [], isLoading: isLoadingScheduled } = useQuery({
    queryKey: ['/api/admin/scheduled-operations'],
    enabled: activeTab === "schedule",
  });

  const form = useForm({
    resolver: zodResolver(insertDatabaseConfigSchema),
    defaultValues: {
      name: "",
      driver: "SQL Server Native Client 11.0",
      server: "",
      database: "",
      username: "",
      password: "",
      options: {},
      isActive: false
    }
  });

  const scheduleForm = useForm({
    resolver: zodResolver(scheduleOperationSchema),
    defaultValues: {
      name: "",
      type: "import",
      configId: 0,
      schedule: "0 0 * * *", // Ogni giorno a mezzanotte
      options: {}
    }
  });

  // Mutation per salvare la configurazione
  const { mutate: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/database-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Impossibile salvare la configurazione');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database-configs'] });
      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni del database sono state aggiornate"
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la configurazione",
        variant: "destructive"
      });
    }
  });

  // Mutation per eseguire una query SQL
  const { mutate: executeQuery } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Impossibile eseguire la query');
      return response.json();
    },
    onSuccess: (data) => {
      setQueryResult(data.result);
      toast({
        title: "Query eseguita",
        description: `Query completata in ${data.duration}ms`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/query-history'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Impossibile eseguire la query: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsExecutingQuery(false);
    }
  });

  // Mutation per pianificare un'operazione
  const { mutate: scheduleOperation, isPending: isScheduling } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/scheduled-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Impossibile pianificare l\'operazione');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scheduled-operations'] });
      toast({
        title: "Operazione pianificata",
        description: "L'operazione è stata pianificata con successo"
      });
      scheduleForm.reset();
      setShowScheduleDialog(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile pianificare l'operazione",
        variant: "destructive"
      });
    }
  });

  // Mutation per eliminare un'operazione pianificata
  const { mutate: deleteOperation } = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/scheduled-operations/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Impossibile eliminare l\'operazione');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scheduled-operations'] });
      toast({
        title: "Operazione eliminata",
        description: "L'operazione pianificata è stata eliminata"
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'operazione",
        variant: "destructive"
      });
    }
  });

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.getValues())
      });
      
      if (!response.ok) throw new Error('Test connessione fallito');
      
      const result = await response.json();
      
      toast({
        title: "Connessione riuscita",
        description: result.message || "Il database è raggiungibile"
      });
      
      // Aggiorna i log di connessione
      queryClient.invalidateQueries({ queryKey: ['/api/admin/connection-logs'] });
    } catch (error) {
      toast({
        title: "Errore di connessione",
        description: "Impossibile connettersi al database",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleExecuteQuery = () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Query vuota",
        description: "Inserisci una query SQL da eseguire",
        variant: "destructive"
      });
      return;
    }

    // Trova la configurazione attiva
    const activeConfig = (configs as any[]).find((config: any) => config.isActive);
    if (!activeConfig) {
      toast({
        title: "Nessuna configurazione attiva",
        description: "Attiva una configurazione di database prima di eseguire una query",
        variant: "destructive"
      });
      return;
    }

    setIsExecutingQuery(true);
    executeQuery({
      configId: activeConfig.id,
      query: sqlQuery
    });
  };

  const handleScheduleSubmit = (data: any) => {
    scheduleOperation(data);
  };

  if (isLoadingConfigs) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
