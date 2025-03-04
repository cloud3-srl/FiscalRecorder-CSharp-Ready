import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import POS from "@/pages/pos";
import AdminPage from "@/pages/admin";
import DatabaseConfigPage from "@/pages/admin/database";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={POS} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/database" component={DatabaseConfigPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;