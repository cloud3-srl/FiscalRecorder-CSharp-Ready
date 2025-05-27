import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, Redirect } from 'wouter'; // Aggiunto Redirect

// Definisci il tipo per l'utente e il contesto di autenticazione
interface AuthUser {
  id: number;
  username: string;
  roleId: number; // O un tipo più specifico per i ruoli se definito
  // Aggiungi altri campi utente se necessario
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (userData: AuthUser, token: string) => void;
  logout: () => void;
  isLoading: boolean; // Per gestire il caricamento iniziale dello stato di autenticazione
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Inizia come true
  const [, navigate] = useLocation();

  useEffect(() => {
    // Prova a caricare l'utente e il token dal localStorage all'avvio
    const storedUser = localStorage.getItem('authUser');
    const storedToken = localStorage.getItem('authToken');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        // Potresti voler validare il token qui con un endpoint API
      } catch (error) {
        console.error("Errore nel parsing dell'utente salvato:", error);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false); // Finito il caricamento iniziale
  }, []);

  const login = (userData: AuthUser, token: string) => {
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
    localStorage.setItem('authToken', token);
    // Non reindirizzare qui, lascia che sia il componente LoginPage a farlo
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    // Reindirizza alla pagina di login dopo il logout
    navigate('/login', { replace: true }); 
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};

// Componente HOC per proteggere le route
export const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string, [key: string]: any }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation(); // Per il redirect

  if (isLoading) {
    // Mostra un loader o null mentre si verifica lo stato di autenticazione
    return <div>Caricamento autenticazione...</div>; // O un componente spinner più carino
  }

  if (!isAuthenticated) {
    // Salva la location attuale per reindirizzare dopo il login
    // Nota: wouter non ha un modo diretto per passare lo stato come react-router,
    // quindi potresti dover gestire il redirect post-login in modo diverso,
    // ad esempio salvando `location` in localStorage o in un parametro query.
    console.log(`Utente non autenticato, tentativo di accesso a: ${location}. Reindirizzamento a /login.`);
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return <Component {...rest} />;
};
