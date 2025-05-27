import React from 'react';
import { useDevMode } from '@/contexts/DevModeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings, Code, Eye, EyeOff } from 'lucide-react';

export default function DevModeToggle() {
  const { showDevFeatures, toggleDevFeatures } = useDevMode();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`p-2 ${showDevFeatures ? 'text-orange-600' : 'text-gray-400'}`}
        >
          <Code className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Modalità Sviluppo</h4>
            <p className="text-sm text-muted-foreground">
              Controlla la visibilità delle funzionalità in fase di sviluppo
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {showDevFeatures ? (
                <Eye className="h-4 w-4 text-orange-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <Label htmlFor="dev-mode" className="text-sm font-medium">
                Mostra funzionalità in sviluppo
              </Label>
            </div>
            <Switch
              id="dev-mode"
              checked={showDevFeatures}
              onCheckedChange={toggleDevFeatures}
            />
          </div>
          
          {showDevFeatures && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
              <div className="flex items-start space-x-2">
                <Settings className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-800">
                    Modalità Sviluppo Attiva
                  </p>
                  <p className="text-xs text-orange-700">
                    Le funzionalità in sviluppo sono visibili ma potrebbero non essere completamente funzionanti.
                    Sono contrassegnate con badge "DEV" e appaiono in grigio.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Funzionalità in sviluppo:</p>
            <ul className="space-y-0.5 ml-2">
              <li>• Importazione clienti</li>
              <li>• Sincronizzazione MSSQL</li>
              <li>• Import/Export prodotti</li>
              <li>• Report avanzati</li>
              <li>• Sistema fedeltà POS</li>
              <li>• Integrazioni esterne</li>
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
