import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: number;
  required?: boolean; // Colonne sempre visibili
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  tableId: string; // Identificatore unico per salvare le preferenze
  disabled?: boolean;
}

interface SortableItemProps {
  column: ColumnConfig;
  onToggle: (key: string) => void;
}

function SortableItem({ column, onToggle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center space-x-3 p-3 bg-white border rounded-lg",
        isDragging && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-gray-500"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Checkbox
        checked={column.visible}
        onCheckedChange={() => onToggle(column.key)}
        disabled={column.required}
        className="flex-shrink-0"
      />
      <div className="flex-1">
        <div className="font-medium text-sm">{column.label}</div>
        {column.required && (
          <div className="text-xs text-gray-500">Campo obbligatorio</div>
        )}
      </div>
    </div>
  );
}

export default function ColumnSelector({ 
  columns, 
  onColumnsChange, 
  tableId, 
  disabled = false 
}: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Carica configurazione salvata
  useEffect(() => {
    const saved = localStorage.getItem(`columnConfig_${tableId}`);
    if (saved) {
      try {
        const savedConfig: ColumnConfig[] = JSON.parse(saved);
        // Merge con la configurazione corrente per gestire nuove colonne
        const mergedConfig = columns.map(col => {
          const savedCol = savedConfig.find(s => s.key === col.key);
          return savedCol ? { ...col, ...savedCol } : col;
        });
        setLocalColumns(mergedConfig);
      } catch (error) {
        console.warn('Errore nel caricamento configurazione colonne:', error);
        setLocalColumns(columns);
      }
    } else {
      setLocalColumns(columns);
    }
  }, [columns, tableId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex(item => item.key === active.id);
        const newIndex = items.findIndex(item => item.key === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (key: string) => {
    setLocalColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSave = () => {
    // Salva in localStorage
    localStorage.setItem(`columnConfig_${tableId}`, JSON.stringify(localColumns));
    
    // Applica le modifiche
    onColumnsChange(localColumns);
    setIsOpen(false);
  };

  const handleReset = () => {
    // Ripristina configurazione originale
    const resetConfig = columns.map(col => ({ ...col, visible: true }));
    setLocalColumns(resetConfig);
    localStorage.removeItem(`columnConfig_${tableId}`);
  };

  const visibleCount = localColumns.filter(col => col.visible).length;
  const totalCount = localColumns.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Colonne ({visibleCount}/{totalCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizza Colonne</DialogTitle>
          <DialogDescription>
            Seleziona e riordina le colonne da visualizzare nella tabella.
            Trascina per riordinare, usa i checkbox per mostrare/nascondere.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map(col => col.key)}
              strategy={verticalListSortingStrategy}
            >
              {localColumns.map((column) => (
                <SortableItem
                  key={column.key}
                  column={column}
                  onToggle={handleToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleReset}
            size="sm"
          >
            Ripristina
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              size="sm"
            >
              Annulla
            </Button>
            <Button onClick={handleSave} size="sm">
              Salva
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
