import React from 'react';
import { useQuery } from "@tanstack/react-query";
import * as schema from "@shared/schema";
import CustomersTable from "./components/CustomersTable";
import { PageHeader, PageTitle } from "@/components/ui/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Database, Users } from "lucide-react";
import { useOffline } from "@/hooks/use-offline";

export default function CustomersPage() {
  const { isOffline } = useOffline();
  
  const { data: customers, isLoading, error, refetch } = useQuery<schema.Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Non riprovare se siamo offline
      if (!navigator.onLine) return false;
      return failureCount < 2;
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader>
          <PageTitle>Anagrafica Clienti</PageTitle>
        </PageHeader>
        
        <div className="space-y-4">
          {/* Skeleton toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          
          {/* Skeleton table */}
          <div className="border rounded-lg">
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader>
          <PageTitle>Anagrafica Clienti</PageTitle>
        </PageHeader>
        
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium mb-1">Errore nel caricamento dei clienti</div>
            <div className="text-sm">
              {error.message}
              {isOffline && " - Controlla la connessione internet"}
            </div>
            <button 
              onClick={() => refetch()}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Riprova
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            <PageTitle>Anagrafica Clienti</PageTitle>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isOffline && (
              <Alert className="border-orange-200 bg-orange-50 py-2 px-3">
                <Database className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-xs">
                  Modalità offline
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Informazioni sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale Clienti</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers?.length || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con P.IVA</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers?.filter(c => c.vatNumber).length || 0}
              </p>
            </div>
            <Database className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Email</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers?.filter(c => c.email).length || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabella principale */}
      <CustomersTable customers={customers || []} />
    </div>
  );
}
