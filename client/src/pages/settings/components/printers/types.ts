import { z } from "zod";

// Tipi di stampante supportati
export const PRINTER_TYPES = {
  FISCAL: "Fiscale/RT",
  RECEIPTS: "Ricevute Cliente", 
  KITCHEN: "Comande Cucina",
  BAR: "Comande Bar",
  LABELS: "Etichette Prodotti",
  REPORTS: "Report Gestionali"
} as const;

// Metodi di connessione
export const CONNECTION_METHODS = {
  USB: "USB",
  ETHERNET: "Ethernet", 
  WIFI: "WiFi",
  BLUETOOTH: "Bluetooth"
} as const;

// Larghezze carta supportate
export const PAPER_WIDTHS = {
  "58": "58mm",
  "80": "80mm", 
  "210": "A4 (210mm)"
} as const;

// Stato connessione
export const CONNECTION_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  TESTING: "testing",
  ERROR: "error"
} as const;

// Schema per la configurazione stampante estesa
export const printerConfigSchema = z.object({
  id: z.number().optional(),
  
  // Informazioni Base
  name: z.string().min(1, "Nome richiesto").max(50, "Nome troppo lungo"),
  type: z.enum([
    PRINTER_TYPES.FISCAL,
    PRINTER_TYPES.RECEIPTS,
    PRINTER_TYPES.KITCHEN,
    PRINTER_TYPES.BAR,
    PRINTER_TYPES.LABELS,
    PRINTER_TYPES.REPORTS
  ]),
  description: z.string().max(200, "Descrizione troppo lunga").optional(),
  
  // Connessione
  connectionMethod: z.enum([
    CONNECTION_METHODS.USB,
    CONNECTION_METHODS.ETHERNET,
    CONNECTION_METHODS.WIFI,
    CONNECTION_METHODS.BLUETOOTH
  ]),
  ipAddress: z.string().ip("Indirizzo IP non valido").optional(),
  port: z.number().min(1).max(65535).default(9100),
  usbPort: z.string().optional(),
  wifiSSID: z.string().optional(),
  wifiPassword: z.string().optional(),
  bluetoothAddress: z.string().optional(),
  
  // Configurazione Carta
  paperWidth: z.enum(["58", "80", "210"]).default("80"),
  marginTop: z.number().min(0).max(10).default(0),
  marginBottom: z.number().min(0).max(10).default(0),
  marginLeft: z.number().min(0).max(10).default(0),
  marginRight: z.number().min(0).max(10).default(0),
  charactersPerLine: z.number().min(20).max(120).optional(),
  autoCut: z.boolean().default(true),
  
  // Layout Stampa
  logoEnabled: z.boolean().default(false),
  logoImage: z.string().optional(),
  logoWidth: z.number().min(50).max(200).default(120),
  logoHeight: z.number().min(20).max(100).default(40),
  headerText: z.string().max(500).optional(),
  footerText: z.string().max(500).optional(),
  qrCodeEnabled: z.boolean().default(false),
  
  // Documenti Assegnati
  printReceipts: z.boolean().default(false),
  printNonFiscalReceipts: z.boolean().default(false),
  printOrders: z.boolean().default(false),
  printReports: z.boolean().default(false),
  printInvoices: z.boolean().default(false),
  printLabels: z.boolean().default(false),
  
  // Metadati
  isActive: z.boolean().default(true),
  lastConnectionTest: z.date().optional(),
  connectionStatus: z.enum([
    CONNECTION_STATUS.ONLINE,
    CONNECTION_STATUS.OFFLINE,
    CONNECTION_STATUS.TESTING,
    CONNECTION_STATUS.ERROR
  ]).default(CONNECTION_STATUS.OFFLINE),
  
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type PrinterConfig = z.infer<typeof printerConfigSchema>;

// Tipo per i dati del form (senza campi auto-generati)
export type PrinterFormData = Omit<PrinterConfig, 'id' | 'createdAt' | 'updatedAt' | 'lastConnectionTest'>;

// Tipo per la risposta del test di connessione
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  duration?: number;
  details?: Record<string, any>;
}

// Tipo per le porte USB disponibili
export interface AvailablePort {
  id: string;
  name: string;
  type: 'USB' | 'COM' | 'LPT';
}

// Configurazione di default per nuovo stampante
export const DEFAULT_PRINTER_CONFIG: PrinterFormData = {
  name: "",
  type: PRINTER_TYPES.RECEIPTS,
  description: "",
  connectionMethod: CONNECTION_METHODS.USB,
  port: 9100,
  paperWidth: "80",
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  charactersPerLine: 48,
  autoCut: true,
  logoEnabled: false,
  logoWidth: 120,
  logoHeight: 40,
  qrCodeEnabled: false,
  printReceipts: true,
  printNonFiscalReceipts: false,
  printOrders: false,
  printReports: false,
  printInvoices: false,
  printLabels: false,
  isActive: true,
  connectionStatus: CONNECTION_STATUS.OFFLINE,
};

// Funzione helper per calcolare caratteri per riga in base alla larghezza
export function calculateCharactersPerLine(paperWidth: string): number {
  const widthMap = {
    "58": 32,
    "80": 48,
    "210": 85
  };
  return widthMap[paperWidth as keyof typeof widthMap] || 48;
}

// Funzione helper per validare IP
export function isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Funzione helper per ottenere l'icona del tipo di stampante
export function getPrinterTypeIcon(type: string) {
  const iconMap = {
    [PRINTER_TYPES.FISCAL]: "🧾",
    [PRINTER_TYPES.RECEIPTS]: "📄", 
    [PRINTER_TYPES.KITCHEN]: "👨‍🍳",
    [PRINTER_TYPES.BAR]: "🍷",
    [PRINTER_TYPES.LABELS]: "🏷️",
    [PRINTER_TYPES.REPORTS]: "📊"
  };
  return iconMap[type as keyof typeof iconMap] || "🖨️";
}

// Funzione helper per ottenere il colore del badge del tipo
export function getPrinterTypeBadgeColor(type: string) {
  const colorMap = {
    [PRINTER_TYPES.FISCAL]: "bg-red-100 text-red-800",
    [PRINTER_TYPES.RECEIPTS]: "bg-blue-100 text-blue-800",
    [PRINTER_TYPES.KITCHEN]: "bg-orange-100 text-orange-800", 
    [PRINTER_TYPES.BAR]: "bg-purple-100 text-purple-800",
    [PRINTER_TYPES.LABELS]: "bg-green-100 text-green-800",
    [PRINTER_TYPES.REPORTS]: "bg-gray-100 text-gray-800"
  };
  return colorMap[type as keyof typeof colorMap] || "bg-gray-100 text-gray-800";
}
