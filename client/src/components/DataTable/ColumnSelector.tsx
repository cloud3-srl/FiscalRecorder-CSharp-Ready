import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, GripVertical, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: number;
  required?: boolean; // Non può essere nascosta
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  tableName: string; // Per persistere le configurazioni
  className?: string;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  onColumnsChange,
  tableName,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Carica configurazione dal localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(`columnConfig_${tableName}`);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        const mergedColumns = columns.map(col => {
          const savedCol = parsedConfig.find((saved: ColumnConfig) => saved.key === col.key);
          return savedCol ? { ...col, ...savedCol } : col;
        });
        setLocalColumns(mergedColumns);
        onColumnsChange(mergedColumns);
      } catch (error) {
        console.error('Errore nel caricamento configurazione colonne:', error);
      }
    }
  }, [tableName, columns]);

  // Salva configurazione nel localStorage
  const saveConfiguration = (newColumns: ColumnConfig[]) => {
    localStorage.setItem(`columnConfig_${tableName}`, JSON.stringify(newColumns));
    onColumnsChange(newColumns);
  };

  const toggleColumnVisibility = (key: string) => {
    const newColumns = localColumns.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(newColumns);
    saveConfiguration(newColumns);
  };

  const resetToDefault = () => {
    const defaultColumns = columns.map(col => ({ ...col, visible: true }));
    setLocalColumns(defaultColumns);
    saveConfiguration(defaultColumns);
    localStorage.removeItem(`columnConfig_${tableName}`);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null) return;

    const newColumns = [...localColumns];
    const draggedColumn = newColumns[draggedItem];
    
    // Rimuovi l'elemento dalla posizione originale
    newColumns.splice(draggedItem, 1);
    
    // Inserisci nella nuova posizione
    newColumns.splice(dropIndex, 0, draggedColumn);
    
    setLocalColumns(newColumns);
    saveConfiguration(newColumns);
    setDraggedItem(null);
  };

  const visibleCount = localColumns.filter(col => col.visible).length;
  const totalCount = localColumns.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${className}`}
          title="Personalizza colonne"
        >
          <Settings size={16} />
          Colonne ({visibleCount}/{totalCount})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={18} />
            Personalizza Colonne
          </DialogTitle>
          <DialogDescription>
            Seleziona le colonne da mostrare e riordinale trascinandole
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{visibleCount} di {totalCount} colonne visibili</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="h-auto p-1 text-xs"
            >
              Ripristina
            </Button>
          </div>

          <ScrollArea className="h-80">
            <div className="space-y-2">
              {localColumns.map((column, index) => (
                <div
                  key={column.key}
                  draggable={!column.required}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`
                    flex items-center gap-3 p-2 rounded border
                    ${draggedItem === index ? 'opacity-50' : ''}
                    ${column.required ? 'bg-muted/50' : 'hover:bg-muted/50 cursor-move'}
                    transition-colors
                  `}
                >
                  {!column.required && (
                    <GripVertical size={14} className="text-muted-foreground" />
                  )}
                  
                  <Checkbox
                    checked={column.visible}
                    onCheckedChange={() => !column.required && toggleColumnVisibility(column.key)}
                    disabled={column.required}
                    className="shrink-0"
                  />
                  
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {column.visible ? (
                      <Eye size={14} className="text-green-600 shrink-0" />
                    ) : (
                      <EyeOff size={14} className="text-muted-foreground shrink-0" />
                    )}
                    
                    <span className={`
                      text-sm truncate
                      ${column.visible ? 'text-foreground' : 'text-muted-foreground'}
                      ${column.required ? 'font-medium' : ''}
                    `}>
                      {column.label}
                      {column.required && ' *'}
                    </span>
                  </div>

                  {column.sortable && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      Ordinabile
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <GripVertical size={12} />
              <span>Trascina per riordinare</span>
            </div>
            <div>* = Colonne obbligatorie (non nascondibili)</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook personalizzato per utilizzare il ColumnSelector
export const useColumnConfig = (
  initialColumns: ColumnConfig[],
  tableName: string
) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(initialColumns);

  useEffect(() => {
    const savedConfig = localStorage.getItem(`columnConfig_${tableName}`);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        const mergedColumns = initialColumns.map(col => {
          const savedCol = parsedConfig.find((saved: ColumnConfig) => saved.key === col.key);
          return savedCol ? { ...col, ...savedCol } : col;
        });
        setColumns(mergedColumns);
      } catch (error) {
        console.error('Errore nel caricamento configurazione colonne:', error);
        setColumns(initialColumns);
      }
    }
  }, [tableName]);

  const visibleColumns = columns.filter(col => col.visible);

  return {
    columns,
    visibleColumns,
    setColumns,
    ColumnSelectorComponent: (props: Omit<ColumnSelectorProps, 'columns' | 'onColumnsChange' | 'tableName'>) => (
      <ColumnSelector
        columns={columns}
        onColumnsChange={setColumns}
        tableName={tableName}
        {...props}
      />
    )
  };
};

export default ColumnSelector;
