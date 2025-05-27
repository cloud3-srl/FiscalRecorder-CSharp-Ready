import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Printer } from "lucide-react";
import { MasterListItem, StatusIndicator } from "../shared/MasterDetailLayout";
import { 
  PrinterConfig, 
  getPrinterTypeIcon, 
  getPrinterTypeBadgeColor,
  CONNECTION_STATUS 
} from "./types";

interface PrintersListProps {
  printers: PrinterConfig[];
  selectedPrinterId?: number;
  onSelectPrinter: (printer: PrinterConfig) => void;
  onEditPrinter: (printer: PrinterConfig) => void;
  onDeletePrinter: (printer: PrinterConfig) => void;
  isLoading?: boolean;
}

export function PrintersList({
  printers,
  selectedPrinterId,
  onSelectPrinter,
  onEditPrinter,
  onDeletePrinter,
  isLoading = false
}: PrintersListProps) {

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (printers.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">Nessuna stampante configurata</p>
        <p className="text-sm">Aggiungi la tua prima stampante per iniziare</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {printers.map((printer) => (
        <PrinterListItem
          key={printer.id}
          printer={printer}
          isSelected={selectedPrinterId === printer.id}
          onSelect={() => onSelectPrinter(printer)}
          onEdit={() => onEditPrinter(printer)}
          onDelete={() => onDeletePrinter(printer)}
        />
      ))}
    </div>
  );
}

interface PrinterListItemProps {
  printer: PrinterConfig;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PrinterListItem({
  printer,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: PrinterListItemProps) {
  
  const getConnectionInfo = () => {
    switch (printer.connectionMethod) {
      case "USB":
        return printer.usbPort || "Porta USB";
      case "Ethernet":
        return printer.ipAddress ? `${printer.ipAddress}:${printer.port}` : "IP non configurato";
      case "WiFi":
        return printer.wifiSSID || "WiFi non configurata";
      case "Bluetooth":
        return printer.bluetoothAddress || "Bluetooth non configurato";
      default:
        return printer.connectionMethod;
    }
  };

  const getStatusFromConnection = () => {
    if (printer.connectionStatus === CONNECTION_STATUS.ONLINE) return "online";
    if (printer.connectionStatus === CONNECTION_STATUS.TESTING) return "warning";
    if (printer.connectionStatus === CONNECTION_STATUS.ERROR) return "error";
    return "offline";
  };

  return (
    <MasterListItem
      isSelected={isSelected}
      onClick={onSelect}
      className="group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header - Nome e Badge Tipo */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">
              {getPrinterTypeIcon(printer.type)}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm font-roboto truncate">
                {printer.name}
              </h3>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getPrinterTypeBadgeColor(printer.type)}`}
              >
                {printer.type}
              </Badge>
            </div>
          </div>

          {/* Informazioni Connessione */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{printer.connectionMethod}</span>
              <StatusIndicator status={getStatusFromConnection()} />
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {getConnectionInfo()}
            </div>
          </div>

          {/* Documenti Assegnati */}
          <div className="mt-2 flex flex-wrap gap-1">
            {printer.printReceipts && (
              <Badge variant="outline" className="text-xs">Scontrini</Badge>
            )}
            {printer.printInvoices && (
              <Badge variant="outline" className="text-xs">Fatture</Badge>
            )}
            {printer.printOrders && (
              <Badge variant="outline" className="text-xs">Ordini</Badge>
            )}
            {printer.printReports && (
              <Badge variant="outline" className="text-xs">Report</Badge>
            )}
            {printer.printLabels && (
              <Badge variant="outline" className="text-xs">Etichette</Badge>
            )}
          </div>

          {/* Descrizione se presente */}
          {printer.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {printer.description}
            </p>
          )}
        </div>

        {/* Azioni - Visibili al hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Indicatore di selezione */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cassanova-primary" />
      )}
    </MasterListItem>
  );
}

// Componente per filtri rapidi della lista
interface PrintersListFiltersProps {
  totalCount: number;
  activeCount: number;
  onlineCount: number;
  currentFilter: "all" | "active" | "online" | "offline";
  onFilterChange: (filter: "all" | "active" | "online" | "offline") => void;
}

export function PrintersListFilters({
  totalCount,
  activeCount,
  onlineCount,
  currentFilter,
  onFilterChange
}: PrintersListFiltersProps) {
  const offlineCount = totalCount - onlineCount;

  return (
    <div className="flex flex-wrap gap-2 p-4 border-b bg-muted/30">
      <FilterButton
        active={currentFilter === "all"}
        onClick={() => onFilterChange("all")}
        count={totalCount}
      >
        Tutte
      </FilterButton>
      
      <FilterButton
        active={currentFilter === "active"}
        onClick={() => onFilterChange("active")}
        count={activeCount}
      >
        Attive
      </FilterButton>
      
      <FilterButton
        active={currentFilter === "online"}
        onClick={() => onFilterChange("online")}
        count={onlineCount}
        variant="success"
      >
        Online
      </FilterButton>
      
      <FilterButton
        active={currentFilter === "offline"}
        onClick={() => onFilterChange("offline")}
        count={offlineCount}
        variant="danger"
      >
        Offline
      </FilterButton>
    </div>
  );
}

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count: number;
  variant?: "default" | "success" | "danger";
}

function FilterButton({ 
  children, 
  active, 
  onClick, 
  count, 
  variant = "default" 
}: FilterButtonProps) {
  const getVariantClasses = () => {
    if (active) {
      return "bg-cassanova-primary text-white";
    }
    
    switch (variant) {
      case "success":
        return "hover:bg-green-50 hover:text-green-700";
      case "danger":
        return "hover:bg-red-50 hover:text-red-700";
      default:
        return "hover:bg-accent";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`h-8 text-xs ${getVariantClasses()}`}
    >
      {children} ({count})
    </Button>
  );
}
