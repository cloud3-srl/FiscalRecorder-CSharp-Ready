import { useState } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/ui/layout"; // Questo Layout verrà modificato
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import POS from "@/pages/pos";
import AdminPage from "@/pages/admin";
import DatabaseConfigPage from "@/pages/admin/database";
import ReportPage from "@/pages/report";
import NotFound from "@/pages/not-found";
import { 
  Home, Settings, Database, FileText, Menu, Briefcase, Users, FileClock, Star, Wallet, HelpCircle, Megaphone, BarChart3, FileArchive, Building2 
} from "lucide-react";
import cn from 'classnames';

// Placeholder per il logo, da sostituire con il vero logo se disponibile
const Logo = () => (
  <div className="flex items-center space-x-2">
    <Briefcase className="h-6 w-6 text-primary" /> {/* Icona temporanea */}
    <span className="font-bold text-lg">Cassa in Cloud</span>
  </div>
);

const navItems = [
  { href: "/reports", label: "Report", icon: BarChart3 }, // Modificato da /report e icona
  { href: "/documents", label: "Documenti", icon: FileArchive },
  { href: "/companies", label: "Aziende", icon: Building2 },
  { href: "/customers", label: "Clienti", icon: Users },
  { href: "/deferred-invoices", label: "Fattura differita", icon: FileClock },
  { href: "/fidelity", label: "Fidelity", icon: Star },
  { href: "/ts-wallet", label: "TS Wallet", icon: Wallet },
  { href: "/settings", label: "Impostazioni", icon: Settings }, // Icona aggiornata
  { href: "/help-center", label: "Centro assistenza", icon: HelpCircle },
  { href: "/news", label: "News e Comunicazioni", icon: Megaphone },
];

// Le route attuali, da aggiornare se necessario per le nuove pagine
const routes = [
  { path: "/", component: POS, label: "POS", icon: Home }, // Aggiunto per coerenza, anche se non nel menu laterale
  { path: "/admin", component: AdminPage, label: "Admin", icon: Settings },
  { path: "/admin/database", component: DatabaseConfigPage, label: "Database Config", icon: Database },
  { path: "/reports", component: ReportPage, label: "Report", icon: BarChart3 }, // Aggiornato per matchare navItems
  // Aggiungere qui le altre route per le nuove pagine del menu laterale quando verranno create
  // Esempio: { path: "/documents", component: DocumentsPage, label: "Documenti", icon: FileArchive },
];


function AppNavigation() {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 md:flex">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden"> {/* Visibile solo su mobile/tablet */}
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Apri menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center mb-6 ml-4">
                  <Logo />
                </Link>
                <nav className="flex flex-col space-y-1">
                  {navItems.map((item) => (
                    <Link 
                      key={item.label} 
                      href={item.href} 
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        location === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
                  Versione: 13.5.0 (942) {/* Come da screenshot */}
                </div>
              </SheetContent>
            </Sheet>
            {/* Logo visibile su desktop */}
            <Link href="/" className="mr-6 flex items-center space-x-2 hidden md:flex">
              <Logo />
            </Link>
          </div>
          {/* Potremmo aggiungere qui altri elementi dell'header se necessario, es. nome utente, notifiche */}
        </div>
      </header>

      {/* Sidebar fissa per desktop (da implementare in Layout) e contenuto principale */}
      <div className="flex flex-1">
        {/* Sidebar fissa per desktop */}
        <aside className="hidden md:block md:w-64 border-r bg-background p-4 space-y-1">
          <nav className="flex flex-col">
            {navItems.map((item) => (
              <Link 
                key={item.label} 
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-4 text-xs text-muted-foreground">
            Versione: 13.5.0 (942)
          </div>
        </aside>
        
        {/* Contenuto principale */}
        <main className="flex-1 p-4 md:p-8 pt-6">
          <AppRouter />
        </main>
      </div>
    </>
  );
}

function AppRouter() { // Rinominato da Router a AppRouter per evitare conflitti
  return (
    <Switch>
      {routes.map(route => (
        <Route key={route.path} path={route.path} component={route.component} />
      ))}
      {/* Aggiungere qui le route per le nuove pagine quando i componenti saranno creati */}
      {/* Esempio: <Route path="/documents" component={DocumentsPage} /> */}
      <Route component={NotFound} /> {/* Fallback per route non trovate */}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout> {/* Layout ora wrappa solo AppNavigation e Toaster */}
        <AppNavigation />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
