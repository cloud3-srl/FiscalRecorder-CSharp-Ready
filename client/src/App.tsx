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
  SlidersHorizontal, UploadCloud, Palette, ChevronRight, ChevronLeft
} from "lucide-react";
import cn from 'classnames';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { DevModeProvider } from './contexts/DevModeContext';
import DevModeToggle from './components/DevModeToggle';

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
  const { data } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      const response = await fetch('/api/settings/company-profile');
      if (!response.ok) return null;
      return response.json();
    },
    select: (data) => data?.logo || null
  });
  return data;
}

const Logo = ({ collapsed = false }) => {
  const appLogoBase64 = useAppLogo();
  if (appLogoBase64) {
    return <img src={appLogoBase64} alt="App Logo" className={cn("object-contain", collapsed ? "h-8" : "h-10")} />;
  }
  return (
    <div className={cn("flex items-center", collapsed ? "justify-center" : "space-x-2")}>
      <Briefcase className={cn("text-primary", collapsed ? "h-8 w-8" : "h-6 w-6")} />
      {!collapsed && <span className="font-bold text-lg">CLOUD3pOS</span>}
    </div>
  );
};

const navItems = [
  { href: "/", label: "POS", icon: Home },
  { href: "/reports", label: "Report", icon: BarChart3 },
  { href: "/customers", label: "Clienti", icon: Users },
  { href: "/fidelity", label: "Fidelity", icon: Star },
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
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
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

  const toggleMenuCollapse = () => {
    setIsMenuCollapsed(!isMenuCollapsed);
  };

  return (
    <div className="flex flex-1 h-screen"> 
      <aside className={cn(
        "hidden md:flex md:flex-col border-r bg-background transition-all duration-300 relative",
        isMenuCollapsed ? "md:w-16" : "md:w-64"
      )}>
        {/* Header con logo e hamburger */}
        <div className={cn("border-b transition-all duration-300", isMenuCollapsed ? "p-2" : "p-4")}>
          <div className="flex items-center justify-between">
            {/* Logo sempre a sinistra */}
            {!isMenuCollapsed ? (
              <Link href="/" className="flex-grow">
                <Logo collapsed={false} />
              </Link>
            ) : (
              <Link href="/" className="mx-auto">
                <Logo collapsed={true} />
              </Link>
            )}
            
            {/* Hamburger button sempre a destra quando espanso */}
            {!isMenuCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenuCollapse}
                className="flex-shrink-0 ml-2"
                title="Comprimi menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            
            {/* Hamburger button centrato quando collassato */}
            {isMenuCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenuCollapse}
                className="absolute top-2 right-2"
                title="Espandi menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation items */}
        <nav className={cn("flex flex-col flex-grow transition-all duration-300", isMenuCollapsed ? "p-2" : "p-4 space-y-2")}>
          {navItems.map((item) => {
            if (item.href === "/settings") {
              return (
                <button 
                  key={item.label}
                  onClick={handleSettingsClick}
                  title={isMenuCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground text-left transition-all duration-300",
                    isMenuCollapsed ? "justify-center p-3" : "space-x-3 px-3 py-2",
                    isOnSettingsPage ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isMenuCollapsed && <span>{item.label}</span>}
                </button>
              );
            }
            return (
              <Link 
                key={item.label} 
                href={item.href}
                title={isMenuCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-300",
                  isMenuCollapsed ? "justify-center p-3" : "space-x-3 px-3 py-2",
                  location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isMenuCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isMenuCollapsed && (
          <div className="mt-auto space-y-2 p-4 border-t">
            {user && (<div className="text-xs text-muted-foreground px-1">Utente: {user.username}</div>)}
            <div className="flex items-center justify-between">
              <Button variant="ghost" className="flex-1 justify-start text-sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />Logout
              </Button>
              <DevModeToggle />
            </div>
            <div className="text-xs text-muted-foreground">Versione: 13.5.0 (942)</div>
          </div>
        )}

        {/* Logout button per menu collassato */}
        {isMenuCollapsed && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout}
              title="Logout"
              className="w-full"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Menu delle impostazioni sovrapposto - STABILE */}
        {isSettingsMenuOpen && !isMenuCollapsed && (
          <div data-settings-menu className="absolute inset-0 bg-background border-r z-10 p-4 space-y-4 flex flex-col">
            <div className="mb-4 flex items-center justify-between border-b pb-4">
              <Logo collapsed={false} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsMenuOpen(false)}
                title="Torna al menu principale"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
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
            <Logo collapsed={false} />
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
      
      <main className={cn("flex-1 p-4 md:p-8 pt-16 md:pt-6 transition-all duration-300")}>
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
      <DevModeProvider>
        <Layout>
          <AppNavigation />
        </Layout>
        <Toaster />
      </DevModeProvider>
    </QueryClientProvider>
  );
}

export default App;
