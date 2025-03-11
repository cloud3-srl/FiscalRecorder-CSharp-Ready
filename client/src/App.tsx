import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/ui/layout";
import POS from "@/pages/pos";
import AdminPage from "@/pages/admin";
import DatabaseConfigPage from "@/pages/admin/database";
import ReportPage from "@/pages/report";
import NotFound from "@/pages/not-found";
import { Home, Settings, Database, FileText } from "lucide-react";
import cn from 'classnames';

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex space-x-4 text-sm font-medium">
          <Link href="/">
            <a className={cn(
              "flex items-center space-x-2 transition-colors hover:text-primary",
              location === "/" ? "text-primary" : "text-muted-foreground"
            )}>
              <Home className="h-4 w-4" />
              <span>POS</span>
            </a>
          </Link>
          <Link href="/admin">
            <a className={cn(
              "flex items-center space-x-2 transition-colors hover:text-primary",
              location === "/admin" ? "text-primary" : "text-muted-foreground"
            )}>
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </a>
          </Link>
          <Link href="/admin/database">
            <a className={cn(
              "flex items-center space-x-2 transition-colors hover:text-primary",
              location === "/admin/database" ? "text-primary" : "text-muted-foreground"
            )}>
              <Database className="h-4 w-4" />
              <span>Database</span>
            </a>
          </Link>
          <Link href="/report">
            <a className={cn(
              "flex items-center space-x-2 transition-colors hover:text-primary",
              location === "/report" ? "text-primary" : "text-muted-foreground"
            )}>
              <FileText className="h-4 w-4" />
              <span>Report</span>
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={POS} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/database" component={DatabaseConfigPage} />
      <Route path="/report" component={ReportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Navigation />
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;