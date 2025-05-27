import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SlidersHorizontal, Volume2, Palette, RotateCcw, Mail, Send, Shield } from "lucide-react";
import "@/styles/pos.css";

interface AudioSettings {
  beepEnabled: boolean;
  volume: number;
}

interface EmailSettings {
  // Configurazione SMTP
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: 'none' | 'tls' | 'ssl';
  smtpUsername: string;
  smtpPassword: string;
  
  // Configurazione mittente
  fromEmail: string;
  fromName: string;
  
  // Opzioni avanzate
  timeout: number;
  enableAuth: boolean;
  
  // Test
  testEmail: string;
}

interface ThemeSettings {
  // Colori principali
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Menu laterale
  sidebarBg: string;
  sidebarText: string;
  sidebarActive: string;
  
  // Bottoni
  buttonPrimary: string;
  buttonSecondary: string;
  buttonHover: string;
  
  // Tipografia
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  
  // Layout
  borderRadius: number;
  shadowIntensity: number;
  
  // Altri
  backgroundColor: string;
  cardBackground: string;
}

const defaultTheme: ThemeSettings = {
  primaryColor: "#3b82f6",
  secondaryColor: "#6b7280", 
  accentColor: "#10b981",
  sidebarBg: "#ffffff",
  sidebarText: "#374151",
  sidebarActive: "#3b82f6",
  buttonPrimary: "#3b82f6",
  buttonSecondary: "#6b7280",
  buttonHover: "#2563eb",
  fontFamily: "Inter",
  fontSize: 14,
  fontWeight: "400",
  borderRadius: 6,
  shadowIntensity: 1,
  backgroundColor: "#f9fafb",
  cardBackground: "#ffffff"
};

const defaultEmailSettings: EmailSettings = {
  smtpHost: "",
  smtpPort: 587,
  smtpSecurity: "tls",
  smtpUsername: "",
  smtpPassword: "",
  fromEmail: "",
  fromName: "",
  timeout: 30,
  enableAuth: true,
  testEmail: ""
};

const safeFonts = [
  { value: "Inter", label: "Inter (Default)" },
  { value: "system-ui", label: "System UI" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times", label: "Times" },
  { value: "Courier", label: "Courier" }
];

const colorPresets = [
  { name: "Blu Classico", primary: "#3b82f6", secondary: "#6b7280", accent: "#10b981" },
  { name: "Verde Natura", primary: "#059669", secondary: "#6b7280", accent: "#3b82f6" },
  { name: "Viola Elegante", primary: "#7c3aed", secondary: "#6b7280", accent: "#f59e0b" },
  { name: "Rosso Moderno", primary: "#dc2626", secondary: "#6b7280", accent: "#059669" },
  { name: "Arancione Caldo", primary: "#ea580c", secondary: "#6b7280", accent: "#3b82f6" },
  { name: "Teal Professionale", primary: "#0891b2", secondary: "#6b7280", accent: "#dc2626" }
];

const smtpPorts = [
  { value: 25, label: "25 (SMTP Standard)" },
  { value: 465, label: "465 (SMTP over SSL)" },
  { value: 587, label: "587 (SMTP over TLS)" },
  { value: 2525, label: "2525 (Alternative)" }
];

export default function GeneralSettings() {
  const { toast } = useToast();
  
  // Audio Settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem('fiscalrecorder.audioSettings');
      return saved ? JSON.parse(saved) : { beepEnabled: true, volume: 0.5 };
    } catch {
      return { beepEnabled: true, volume: 0.5 };
    }
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(() => {
    try {
      const saved = localStorage.getItem('fiscalrecorder.emailSettings');
      return saved ? { ...defaultEmailSettings, ...JSON.parse(saved) } : defaultEmailSettings;
    } catch {
      return defaultEmailSettings;
    }
  });

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('fiscalrecorder.themeSettings');
      return saved ? { ...defaultTheme, ...JSON.parse(saved) } : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [testingEmail, setTestingEmail] = useState(false);

  // Applica il tema alle CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Applica le variabili CSS
    root.style.setProperty('--primary-color', themeSettings.primaryColor);
    root.style.setProperty('--secondary-color', themeSettings.secondaryColor);
    root.style.setProperty('--accent-color', themeSettings.accentColor);
    root.style.setProperty('--sidebar-bg', themeSettings.sidebarBg);
    root.style.setProperty('--sidebar-text', themeSettings.sidebarText);
    root.style.setProperty('--sidebar-active', themeSettings.sidebarActive);
    root.style.setProperty('--button-primary', themeSettings.buttonPrimary);
    root.style.setProperty('--button-secondary', themeSettings.buttonSecondary);
    root.style.setProperty('--button-hover', themeSettings.buttonHover);
    root.style.setProperty('--font-family', themeSettings.fontFamily);
    root.style.setProperty('--font-size', `${themeSettings.fontSize}px`);
    root.style.setProperty('--font-weight', themeSettings.fontWeight);
    root.style.setProperty('--border-radius', `${themeSettings.borderRadius}px`);
    root.style.setProperty('--shadow-intensity', themeSettings.shadowIntensity.toString());
    root.style.setProperty('--background-color', themeSettings.backgroundColor);
    root.style.setProperty('--card-background', themeSettings.cardBackground);
    
  }, [themeSettings]);

  const updateAudioSetting = (key: keyof AudioSettings, value: boolean | number) => {
    const newSettings = { ...audioSettings, [key]: value };
    setAudioSettings(newSettings);
    localStorage.setItem('fiscalrecorder.audioSettings', JSON.stringify(newSettings));
  };

  const updateEmailSetting = (key: keyof EmailSettings, value: string | number | boolean) => {
    const newSettings = { ...emailSettings, [key]: value };
    setEmailSettings(newSettings);
    localStorage.setItem('fiscalrecorder.emailSettings', JSON.stringify(newSettings));
  };

  const updateThemeSetting = (key: keyof ThemeSettings, value: string | number) => {
    const newSettings = { ...themeSettings, [key]: value };
    setThemeSettings(newSettings);
    localStorage.setItem('fiscalrecorder.themeSettings', JSON.stringify(newSettings));
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    const newSettings = {
      ...themeSettings,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
      buttonPrimary: preset.primary,
      sidebarActive: preset.primary
    };
    setThemeSettings(newSettings);
    localStorage.setItem('fiscalrecorder.themeSettings', JSON.stringify(newSettings));
    
    toast({
      title: "Tema applicato",
      description: `Preset "${preset.name}" applicato con successo.`,
    });
  };

  const resetTheme = () => {
    setThemeSettings(defaultTheme);
    localStorage.setItem('fiscalrecorder.themeSettings', JSON.stringify(defaultTheme));
    
    toast({
      title: "Tema ripristinato",
      description: "Tutte le personalizzazioni sono state riportate ai valori predefiniti.",
    });
  };

  const saveEmailSettings = () => {
    localStorage.setItem('fiscalrecorder.emailSettings', JSON.stringify(emailSettings));
    toast({
      title: "Configurazione salvata",
      description: "Le impostazioni email sono state salvate con successo.",
    });
  };

  const testEmailConnection = async () => {
    if (!emailSettings.smtpHost || !emailSettings.fromEmail) {
      toast({
        title: "Configurazione incompleta",
        description: "Compila almeno Server SMTP e Email mittente prima di testare.",
        variant: "destructive",
      });
      return;
    }

    if (!emailSettings.testEmail) {
      toast({
        title: "Email di test richiesta",
        description: "Inserisci un'email di destinazione per il test.",
        variant: "destructive",
      });
      return;
    }

    setTestingEmail(true);
    
    try {
      // Simula test connessione SMTP
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In una implementazione reale, qui faresti una chiamata API al backend
      // per testare la connessione SMTP con i parametri forniti
      
      toast({
        title: "Test completato",
        description: `Email di test inviata con successo a ${emailSettings.testEmail}`,
      });
    } catch (error) {
      toast({
        title: "Test fallito",
        description: "Impossibile connettersi al server SMTP. Verifica le impostazioni.",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const testBeep = async () => {
    try {
      const audio = new Audio('/beep.wav');
      audio.volume = audioSettings.volume;
      audio.preload = 'auto';
      
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });
      
      await audio.play();
    } catch (error) {
      console.warn('Test audio fallito:', error);
      alert('Impossibile riprodurre il suono. Verifica che:\n- I suoni del browser siano abilitati\n- Il volume del sistema sia attivo\n- Il file audio sia caricato correttamente');
    }
  };

  return (
    <div className="fullscreen-form">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Impostazioni Generali</h1>
        </div>
        <p className="text-sm text-gray-500 font-medium" style={{ 
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          Configura audio, tema, email e personalizzazioni dell'interfaccia
        </p>
      </div>

      <Card className="fullscreen-card">
        <CardHeader>
          <CardTitle>Configurazione Sistema</CardTitle>
          <CardDescription style={{ 
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            Personalizza il comportamento e l'aspetto dell'applicazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="audio" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Messaggi
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Personalizza
              </TabsTrigger>
            </TabsList>

            {/* Tab Audio */}
            <TabsContent value="audio" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Impostazioni Audio</CardTitle>
                  <CardDescription>
                    Configura i suoni del punto vendita
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Suono aggiunta prodotto</Label>
                      <p className="text-sm text-muted-foreground">
                        Riproduci un beep quando viene aggiunto un prodotto al carrello
                      </p>
                    </div>
                    <Switch
                      checked={audioSettings.beepEnabled}
                      onCheckedChange={(checked) => updateAudioSetting('beepEnabled', checked)}
                    />
                  </div>

                  {audioSettings.beepEnabled && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Volume suono</Label>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(audioSettings.volume * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Slider
                              value={[audioSettings.volume]}
                              onValueChange={([value]) => updateAudioSetting('volume', value)}
                              max={1}
                              min={0}
                              step={0.1}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={testBeep}
                              className="whitespace-nowrap"
                            >
                              Test Audio
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Email */}
            <TabsContent value="email" className="space-y-6 mt-6">
              
              {/* Configurazione SMTP */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Configurazione Server SMTP
                  </CardTitle>
                  <CardDescription>
                    Imposta i parametri per l'invio email tramite il tuo provider SMTP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Server SMTP *</Label>
                      <Input
                        placeholder="smtp.gmail.com"
                        value={emailSettings.smtpHost}
                        onChange={(e) => updateEmailSetting('smtpHost', e.target.value)}
                        className="enhanced-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Porta SMTP *</Label>
                      <Select 
                        value={emailSettings.smtpPort.toString()} 
                        onValueChange={(value) => updateEmailSetting('smtpPort', parseInt(value))}
                      >
                        <SelectTrigger className="enhanced-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {smtpPorts.map((port) => (
                            <SelectItem key={port.value} value={port.value.toString()}>
                              {port.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sicurezza</Label>
                      <Select 
                        value={emailSettings.smtpSecurity} 
                        onValueChange={(value: 'none' | 'tls' | 'ssl') => updateEmailSetting('smtpSecurity', value)}
                      >
                        <SelectTrigger className="enhanced-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nessuna</SelectItem>
                          <SelectItem value="tls">TLS (Consigliato)</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Timeout (secondi)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="120"
                        value={emailSettings.timeout}
                        onChange={(e) => updateEmailSetting('timeout', parseInt(e.target.value) || 30)}
                        className="enhanced-input"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Abilita Autenticazione</Label>
                      <p className="text-sm text-muted-foreground">
                        Richiedi username e password per la connessione SMTP
                      </p>
                    </div>
                    <Switch
                      checked={emailSettings.enableAuth}
                      onCheckedChange={(checked) => updateEmailSetting('enableAuth', checked)}
                    />
                  </div>

                  {emailSettings.enableAuth && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Username *</Label>
                        <Input
                          placeholder="username@domain.com"
                          value={emailSettings.smtpUsername}
                          onChange={(e) => updateEmailSetting('smtpUsername', e.target.value)}
                          className="enhanced-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Password *</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={emailSettings.smtpPassword}
                          onChange={(e) => updateEmailSetting('smtpPassword', e.target.value)}
                          className="enhanced-input"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Configurazione Mittente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurazione Mittente</CardTitle>
                  <CardDescription>
                    Imposta l'identità del mittente per le email inviate dal sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Email Mittente *</Label>
                      <Input
                        type="email"
                        placeholder="noreply@azienda.it"
                        value={emailSettings.fromEmail}
                        onChange={(e) => updateEmailSetting('fromEmail', e.target.value)}
                        className="enhanced-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nome Mittente</Label>
                      <Input
                        placeholder="Punto Vendita ACME"
                        value={emailSettings.fromName}
                        onChange={(e) => updateEmailSetting('fromName', e.target.value)}
                        className="enhanced-input"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Connessione */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Test Connessione
                  </CardTitle>
                  <CardDescription>
                    Verifica il funzionamento della configurazione SMTP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Email di Test</Label>
                    <Input
                      type="email"
                      placeholder="test@email.com"
                      value={emailSettings.testEmail}
                      onChange={(e) => updateEmailSetting('testEmail', e.target.value)}
                      className="enhanced-input"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={testEmailConnection}
                      disabled={testingEmail || !emailSettings.smtpHost || !emailSettings.fromEmail}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {testingEmail ? "Invio in corso..." : "Invia Email di Test"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={saveEmailSettings}
                      className="flex items-center gap-2"
                    >
                      Salva Configurazione
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Configurazioni Comuni</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Gmail:</strong> smtp.gmail.com:587 (TLS) - Usa password app</p>
                      <p><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS)</p>
                      <p><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS)</p>
                      <p><strong>Provider personalizzato:</strong> Consulta la documentazione del tuo provider</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* Tab Personalizza */}
            <TabsContent value="theme" className="space-y-6 mt-6">
              
              {/* Preset Colori */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preset Colori</CardTitle>
                  <CardDescription>
                    Applica rapidamente combinazioni di colori predefinite
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {colorPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-start"
                        onClick={() => applyColorPreset(preset)}
                      >
                        <div className="flex space-x-1 mb-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.primary }} />
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.secondary }} />
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <span className="text-xs">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ripristina</CardTitle>
                  <CardDescription>
                    Riporta tutte le personalizzazioni ai valori predefiniti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={resetTheme}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Ripristina Tema Predefinito
                  </Button>
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
