import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, X, Building2, Percent, Palette, Briefcase, ShoppingCart, 
  Printer, ScanLine, Tv, CreditCard, UserCog, Users, FileText, 
  SlidersHorizontal, UploadCloud 
} from "lucide-react";
import cn from 'classnames';

// Componenti per le diverse sezioni delle impostazioni
import CompanySettings from "./components/CompanySettings";
import VatSettings from "./components/VatSettings";
import DepartmentsSettings from "./components/DepartmentsSettings";
import CategoriesSettings from "./components/CategoriesSettings";
import ProductsSettings from "./components/ProductsSettings";
import {
  SaleModesSettings,
  PrintersSettings,
  BarcodeReadersSettings,
  ClientDisplaySettings,
  PaymentsSettings,
  RolesSettings,
  OperatorsSettings,
  DocumentsSettings,
  OrdersSettings,
  GeneralSettings,
  ImportSettings,
} from "./components/RemainingComponents";

// Logo component (riutilizziamo quello di App.tsx)
const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      <Briefcase className="h-6 w-6 text-primary" />
      <span className="font-bold text-lg">CLOUD3pOS</span>
    </div>
  );
};

// Menu delle impostazioni - lista delle 16 voci
const settingsNavItems = [
  { href: "/settings/company", label: "Ragione sociale", icon: Building2 },
  { href: "/settings/vat", label: "Aliquote IVA", icon: Percent },
  { href: "/settings/departments", label: "Reparti", icon: Palette },
  { href: "/settings/categories", label: "Categorie", icon: Briefcase },
  { href: "/settings/products", label: "Prodotti", icon: Briefcase },
  { href: "/settings/sale-modes", label: "Modalità di vendita", icon: ShoppingCart },
  { href: "/settings/printers", label: "Stampanti", icon: Printer },
  { href: "/settings/barcode-readers", label: "Lettori barcode", icon: ScanLine },
  { href: "/settings/client-display", label: "Display cliente", icon: Tv },
  { href: "/settings/payments", label: "Pagamenti", icon: CreditCard },
  { href: "/settings/roles", label: "Ruoli", icon: UserCog },
  { href: "/settings/operators", label: "Operatori", icon: Users },
  { href: "/settings/documents", label: "Documenti", icon: FileText },
  { href: "/settings/orders", label: "Ordini", icon: ShoppingCart },
  { href: "/settings/general", label: "Generali", icon: SlidersHorizontal },
  { href: "/settings/import", label: "Importazione", icon: UploadCloud },
];

export default function SettingsPage() {
  const [location] = useLocation();
  
  // Determina quale componente visualizzare in base al path
  const renderMainContent = () => {
    const path = location.split('/').pop();
    
    switch (path) {
      case 'company':
        return <CompanySettings />;
      case 'vat':
        return <VatSettings />;
      case 'departments':
        return <DepartmentsSettings />;
      case 'categories':
        return <CategoriesSettings />;
      case 'products':
        return <ProductsSettings />;
      case 'sale-modes':
        return <SaleModesSettings />;
      case 'printers':
        return <PrintersSettings />;
      case 'barcode-readers':
        return <BarcodeReadersSettings />;
      case 'client-display':
        return <ClientDisplaySettings />;
      case 'payments':
        return <PaymentsSettings />;
      case 'roles':
        return <RolesSettings />;
      case 'operators':
        return <OperatorsSettings />;
      case 'documents':
        return <DocumentsSettings />;
      case 'orders':
        return <OrdersSettings />;
      case 'general':
        return <GeneralSettings />;
      case 'import':
        return <ImportSettings />;
      default:
        // Pagina principale delle impostazioni - reindirizza alla prima voce
        if (location === '/settings') {
          return <CompanySettings />;
        }
        return <div className="p-8">Seleziona una sezione dal menu laterale</div>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Menu laterale delle impostazioni */}
      <aside className="w-64 border-r bg-background p-4 space-y-4 flex flex-col">
        {/* Header con logo e controlli di navigazione */}
        <div className="mb-4">
          <Logo />
        </div>
        
        {/* Bottoni di navigazione globali */}
        <div className="flex space-x-2 mb-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Torna al POS
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Menu delle impostazioni */}
        <nav className="flex flex-col flex-grow space-y-1 overflow-y-auto">
          {settingsNavItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Area di contenuto principale */}
      <main className="flex-1 overflow-auto">
        {renderMainContent()}
      </main>
    </div>
  );
}
