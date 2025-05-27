import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MasterDetailLayoutProps {
  // Master Panel (lista sinistra)
  masterTitle: string;
  masterSearch?: boolean;
  masterSearchPlaceholder?: string;
  masterSearchValue?: string;
  onMasterSearchChange?: (value: string) => void;
  masterAddButton?: boolean;
  masterAddButtonText?: string;
  onMasterAdd?: () => void;
  masterContent: ReactNode;
  
  // Detail Panel (form destra)
  detailTitle?: string;
  detailSubtitle?: string;
  detailContent: ReactNode;
  
  // Layout options
  masterWidth?: "narrow" | "normal" | "wide";
  className?: string;
}

export function MasterDetailLayout({
  masterTitle,
  masterSearch = false,
  masterSearchPlaceholder = "Cerca...",
  masterSearchValue = "",
  onMasterSearchChange,
  masterAddButton = false,
  masterAddButtonText = "Aggiungi",
  onMasterAdd,
  masterContent,
  detailTitle,
  detailSubtitle,
  detailContent,
  masterWidth = "normal",
  className = "",
}: MasterDetailLayoutProps) {
  
  const masterWidthClass = {
    narrow: "w-80",
    normal: "w-96", 
    wide: "w-1/2"
  }[masterWidth];

  return (
    <div className={`flex h-full gap-6 ${className}`}>
      {/* Master Panel - Lista */}
      <div className={`${masterWidthClass} flex-shrink-0`}>
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold font-roboto">{masterTitle}</h2>
              {masterAddButton && (
                <Button 
                  onClick={onMasterAdd}
                  className="bg-cassanova-primary hover:bg-cassanova-primary/90 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {masterAddButtonText}
                </Button>
              )}
            </div>
            
            {masterSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={masterSearchPlaceholder}
                  value={masterSearchValue}
                  onChange={(e) => onMasterSearchChange?.(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-0">
            {masterContent}
          </CardContent>
        </Card>
      </div>

      {/* Detail Panel - Form */}
      <div className="flex-1">
        <Card className="h-full flex flex-col">
          {(detailTitle || detailSubtitle) && (
            <CardHeader className="pb-4">
              {detailTitle && (
                <h2 className="text-xl font-semibold font-roboto">{detailTitle}</h2>
              )}
              {detailSubtitle && (
                <p className="text-sm text-muted-foreground">{detailSubtitle}</p>
              )}
            </CardHeader>
          )}
          
          <CardContent className="flex-1 overflow-y-auto">
            {detailContent}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente per gli elementi della lista master
interface MasterListItemProps {
  children: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MasterListItem({ 
  children, 
  isSelected = false, 
  onClick, 
  className = "" 
}: MasterListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 border-b cursor-pointer transition-colors hover:bg-accent/50
        ${isSelected ? 'bg-cassanova-primary/10 border-l-4 border-l-cassanova-primary' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Componente per sezioni del form di dettaglio
interface DetailSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function DetailSection({ 
  title, 
  description, 
  children, 
  className = "" 
}: DetailSectionProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium font-roboto text-cassanova-secondary">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Status indicator per elementi lista
interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "error";
  text?: string;
}

export function StatusIndicator({ status, text }: StatusIndicatorProps) {
  const statusConfig = {
    online: { color: "bg-green-500", label: "Online" },
    offline: { color: "bg-red-500", label: "Offline" },
    warning: { color: "bg-yellow-500", label: "Attenzione" },
    error: { color: "bg-red-600", label: "Errore" }
  };

  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs text-muted-foreground">
        {text || config.label}
      </span>
    </div>
  );
}
