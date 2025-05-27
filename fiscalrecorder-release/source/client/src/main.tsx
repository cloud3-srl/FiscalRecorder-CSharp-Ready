import React from 'react'; // Necessario per JSX
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext"; // Importa AuthProvider
import { QueryClientProvider } from "@tanstack/react-query"; // Importa QueryClientProvider
import { queryClient } from "./lib/queryClient"; // Importa queryClient

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
