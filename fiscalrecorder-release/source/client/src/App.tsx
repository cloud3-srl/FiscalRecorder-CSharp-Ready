import React, { useState, useEffect, ReactNode } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/ui/layout";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import POS from "@/pages/pos";
import AdminPage from "@/pages/admin";
import DatabaseConfigPage from "@/pages/admin/database";
import ReportPage from "@/pages/report";
import CustomersPage from "@/pages/customers"; 
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { 
  Home, Settings, Database, FileText, Menu, Briefcase, Users, FileClock, Star, LogOut,
  HelpCircle, Megaphone, BarChart3, FileArchive, Building2,
  Warehouse, ShoppingCart, CreditCard, Printer, ScanLine, Tv, UserCog, 
  SlidersHorizontal, UploadCloud, Palette
} from "lucide-react";
import cn from 'classnames';
import { useAuth, AuthProvider } from './contexts/AuthContext';

// Importa i componenti delle impostazioni
import CompanySettings from "@/pages/settings/components/CompanySettings";
import DepartmentsSettings from "@/pages/settings/components/DepartmentsSettings";
import CategoriesSettings from "@/pages/settings/components/CategoriesSettings";
import ProductsSettings from "@/pages/settings/components/ProductsSettings";
import PaymentsSettings from "@/pages/settings/components/PaymentsSettings";
import {
  SaleModesSettings,
  PrintersSettings,
  BarcodeReadersSettings,
  ClientDisplaySettings,
  RolesSettings,
  OperatorsSettings,
  DocumentsSettings,
  OrdersSettings,
  GeneralSettings,
  ImportSettings,
} from "@/pages/settings/components/RemainingComponents";

// Hook e Componente Logo
function useAppLogo() {
  const { data } = useQuery<{ general_settings_logo?: { appLogoBase64?: string | null } } | null, Error>({
    queryKey: ['appLogoConfig'],
    queryFn: async () => {
      const response = await fetch('/api/settings/general-config');
      if (!response.ok) throw new Error('Impossibile caricare la configurazione del logo');
      const result = await response.json();
      return result.success ? result.data : null;
    },
    select: (data) => ({ general_settings_logo: data?.general_settings_logo })
  });
  return data?.general_settings_logo?.appLogoBase64 || null;
}

const Logo = () => {
  const appLogoBase64 = useAppLogo();
  if (appLogoBase64) {
    return <img src={appLogoBase64} alt="App Logo" className="h-10 object-contain" />;
  }
  return (
    <div className="flex items-center space-x-2">
      <Briefcase className="h-6 w-6 text-primary" />
      <span className="font-bold text-lg">CLOUD3pOS</span>
    </div>
  );
};

const navItems = [
  { href: "/", label: "POS", icon: Home },
  { href: "/reports", label: "Report", icon: BarChart3 },
  { href: "/documents", label: "Documenti", icon: FileArchive },
  { href: "/customers", label: "Clienti", icon: Users },
  { href: "/deferred-invoices", label: "Fattura differita", icon: FileClock },
  { href: "/fidelity", label: "Fidelity", icon: Star },
  { href: "/admin/database", label: "Database e Sync", icon: Database },
  { href: "/settings", label: "Impostazioni", icon: Settings }, 
  { href: "/help-center", label: "Centro assistenza", icon: HelpCircle },
  { href: "/news", label: "News e Comunicazioni", icon: Megaphone },
];

// Menu delle impostazioni che si sovrappone al menu principale
const settingsNavItems = [
  { href: "/", label: "Torna al POS", icon: Home },
  { href: "/settings/company", label: "Ragione sociale", icon: Building2, section: "AZIENDA E FISCALITÀ" },
  { href: "/settings/departments", label: "Reparti", icon: Palette, section: "CATALOGO" },
  { href: "/settings/categories", label: "Categorie", icon: Briefcase, section: "CATALOGO" },
  { href: "/settings/products", label: "Prodotti", icon: ShoppingCart, section: "CATALOGO" },
  { href: "/settings/sale-modes", label: "Modalità di vendita", icon: ShoppingCart, section: "OPERATIVITÀ CASSA" },
  { href: "/settings/documents", label: "Documenti", icon: FileText, section: "OPERATIVITÀ CASSA" },
  { href: "/settings/payments", label: "Pagamenti", icon: CreditCard, section: "OPERATIVITÀ CASSA" },
  { href: "/settings/orders", label: "Ordini", icon: ShoppingCart, section: "OPERATIVITÀ CASSA" },
  { href: "/settings/printers", label: "Stampanti", icon: Printer, section: "HARDWARE E DISPOSITIVI" },
  { href: "/settings/barcode-readers", label: "Lettori barcode", icon: ScanLine, section: "HARDWARE E DISPOSITIVI" },
  { href: "/settings/client-display", label: "Display cliente", icon: Tv, section: "HARDWARE E DISPOSITIVI" },
  { href: "/settings/roles", label: "Ruoli", icon: UserCog, section: "UTENTI E SICUREZZA" },
  { href: "/settings/operators", label: "Operatori", icon: Users, section: "UTENTI E SICUREZZA" },
  { href: "/settings/general", label: "Generali", icon: SlidersHorizontal, section: "CONFIGURAZIONE AVANZATA" },
  { href: "/settings/import", label: "Importazione", icon: UploadCloud, section: "CONFIGURAZIONE AVANZATA" },
  { href: "/admin/database", label: "Database e Sync", icon: Database, section: "CONFIGURAZIONE AVANZATA" },
];

// Rotte principali dell'applicazione
const appRoutes = [
  { path: "/", component: POS }, 
  { path: "/admin", component: AdminPage }, 
  { path: "/admin/database", component: DatabaseConfigPage },
  { path: "/reports", component: ReportPage }, 
  { path: "/customers", component: CustomersPage }, 
  { path: "/settings", component: SettingsPage }, 
  { path: "/settings/:rest*", component: SettingsPage },
];

// Componente per mostrare il contenuto delle impostazioni basato sulla route
const SettingsContent = ({ location }: { location: string }) => {
  const path = location.split('/').pop();
  
  switch (path) {
    case 'company':
      return <CompanySettings />;
    case 'departments':
      return <DepartmentsSettings />;
    case 'categories':
      return <CategoriesSettings />;
    case 'products':
      return <ProductsSettings />;
    case 'payments':
      return <PaymentsSettings />;
    case 'sale-modes':
      return <SaleModesSettings />;
    case 'printers':
      return <PrintersSettings />;
    case 'barcode-readers':
      return <BarcodeReadersSettings />;
    case 'client-display':
      return <ClientDisplaySettings />;
    case 'roles':
      return <RolesSettings />;
    case 'operators':
      return <OperatorsSettings />;
    case 'documents':
      return <DocumentsSettings />;
    case 'orders':
      return <OrdersSettings />;
    case 'general':
      return <GeneralSettings />;
    case 'import':
      return <ImportSettings />;
    case 'database':
      return <DatabaseConfigPage />;
    default:
      return <CompanySettings />;
  }
};

function AppNavigation() {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { logout, user } = useAuth();

  // Controlla se siamo in una pagina delle impostazioni
  const isOnSettingsPage = location.startsWith('/settings') || location.startsWith('/admin');

  // Mantieni il menu delle impostazioni aperto quando si è nelle pagine delle impostazioni
  useEffect(() => {
    if (isOnSettingsPage) {
      setIsSettingsMenuOpen(true);
    } else {
      setIsSettingsMenuOpen(false);
    }
  }, [isOnSettingsPage]);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSettingsMenuOpen(true);
  };

  return (
    <div className="flex flex-1 h-screen"> 
      <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-background p-4 space-y-4 relative">
        <div className="mb-4">
          <Link href="/"><Logo /></Link>
        </div>
        <nav className="flex flex-col flex-grow">
          {navItems.map((item) => {
            if (item.href === "/settings") {
              return (
                <button 
                  key={item.label}
                  onClick={handleSettingsClick}
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-left",
                    isOnSettingsPage ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <Link key={item.label} href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 pt-2 border-t">
          {user && (<div className="text-xs text-muted-foreground px-1">Utente: {user.username}</div>)}
          <Button variant="ghost" className="w-full justify-start text-sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />Logout
          </Button>
          <div className="text-xs text-muted-foreground">Versione: 13.5.0 (942)</div>
        </div>

        {/* Menu delle impostazioni sovrapposto - STABILE */}
        {isSettingsMenuOpen && (
          <div data-settings-menu className="absolute inset-0 bg-background border-r z-10 p-4 space-y-4 flex flex-col">
            <div className="mb-4">
              <Logo />
            </div>
            
            <nav className="flex flex-col flex-grow space-y-1 overflow-y-auto">
              {/* Torna al POS */}
              <Link 
                href="/"
                className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground mb-4"
              >
                <Home className="h-5 w-5" />
                <span>Torna al POS</span>
              </Link>

              {/* Lista delle voci delle impostazioni filtrate - NON chiudere menu al click */}
              {settingsNavItems
                .filter(item => item.href !== "/")
                .map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
            </nav>
          </div>
        )}
      </aside>
      
      {/* Menu mobile */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Apri menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0 pt-8 flex flex-col">
          <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center mb-6 ml-4">
            <Logo />
          </Link>
          <nav className="flex flex-col space-y-1 flex-grow">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 mt-auto border-t space-y-2">
            {user && (<div className="text-xs text-muted-foreground">Utente: {user.username}</div>)}
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { logout(); setIsSidebarOpen(false); }}>
              <LogOut className="mr-2 h-4 w-4" />Logout
            </Button>
            <div className="text-xs text-muted-foreground">Versione: 13.5.0 (942)</div>
          </div>
        </SheetContent>
      </Sheet>
      
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-6">
        {/* Se il menu impostazioni è aperto, mostra il contenuto delle impostazioni */}
        {isSettingsMenuOpen ? (
          <SettingsContent location={location} />
        ) : (
          <Switch>
            {appRoutes
              .filter(route => !route.path.startsWith('/settings'))
              .map(route => (
                <Route key={route.path} path={route.path} component={route.component} />
              ))}
            <Route component={NotFound} />
          </Switch>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <AppNavigation />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
