import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevModeContextType {
  showDevFeatures: boolean;
  toggleDevFeatures: () => void;
  isFeatureInDev: (featureKey: string) => boolean;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

// Lista delle funzionalità in sviluppo
const DEV_FEATURES = {
  'customers.import': true,
  'customers.mssql_sync': true,
  'products.import': true,
  'products.export': true,
  'reports.advanced': true,
  'pos.loyalty': true,
  'settings.integrations': true,
  'settings.automations': true,
  'inventory.lots': true,
} as const;

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [showDevFeatures, setShowDevFeatures] = useState(() => {
    const saved = localStorage.getItem('fiscalrecorder.showDevFeatures');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('fiscalrecorder.showDevFeatures', JSON.stringify(showDevFeatures));
  }, [showDevFeatures]);

  const toggleDevFeatures = () => {
    setShowDevFeatures((prev: boolean) => !prev);
  };

  const isFeatureInDev = (featureKey: string) => {
    return DEV_FEATURES[featureKey as keyof typeof DEV_FEATURES] || false;
  };

  return (
    <DevModeContext.Provider value={{
      showDevFeatures,
      toggleDevFeatures,
      isFeatureInDev,
    }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
}

// Componente per wrappare funzionalità in sviluppo
interface DevFeatureProps {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function DevFeature({ featureKey, children, fallback = null }: DevFeatureProps) {
  const { showDevFeatures, isFeatureInDev } = useDevMode();
  
  if (!isFeatureInDev(featureKey)) {
    return <>{children}</>;
  }
  
  if (!showDevFeatures) {
    return <>{fallback}</>;
  }
  
  // Wrapper con stile per funzionalità in sviluppo
  return (
    <div className="dev-feature relative">
      <div className="absolute -top-1 -right-1 z-10">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          DEV
        </span>
      </div>
      <div className="opacity-75 pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

// Hook per ottenere le classi CSS per elementi in sviluppo
export function useDevStyles(featureKey: string) {
  const { showDevFeatures, isFeatureInDev } = useDevMode();
  
  if (!isFeatureInDev(featureKey)) {
    return {};
  }
  
  if (!showDevFeatures) {
    return { display: 'none' };
  }
  
  return {
    opacity: 0.7,
    filter: 'grayscale(20%)',
    position: 'relative' as const,
  };
}
