# 🎨 FASE 1: RESTYLING UI CON TEMPLATE WOWDASH

## 🎯 OBIETTIVO
Applicare lo stile del template WowDash a tutto il dashboard POS esistente, ottimizzando layout e spazi per un'esperienza utente professionale.

## 📁 RISORSE DISPONIBILI
- **Template Source**: `asset_design/wowDashBundle/Bootstrap_Html/`
- **File di riferimento**: `sign-in.html`, componenti sidebar, header
- **Framework**: Bootstrap + CSS personalizzato

## 🔧 TASKS SPECIFICI

### 1.1 Logo e Branding
```typescript
// File: client/src/components/Logo.tsx
// CAMBIARE: "Cassa in Cloud" → "CLOUD3pOS"
// Mantenere dimensioni consistenti tra menu principale e pagina impostazioni
```

### 1.2 Menu Laterale Principale  
```typescript
// File: client/src/App.tsx
// RIMUOVERE: Voce "Aziende" dal navItems array
// MANTENERE: POS, Clienti, Impostazioni, Admin
// APPLICARE: Stile sidebar da WowDash template
```

### 1.3 Header Ottimizzazione
```typescript
// File: client/src/App.tsx
// RIMUOVERE: Header superiore con logo (solo nella pagina POS)
// RIDURRE: Padding e margin per massimizzare area di lavoro
// TARGET: Elemento <div class="bg-white shadow-sm border-b p-3">
```

### 1.4 Pagina POS Layout
```typescript
// File: client/src/pages/pos/index.tsx  
// RIMUOVERE: Barra tab superiore ("Preferiti", "Reparti", "Categoria Pers. 1")
// RIMUOVERE: Display valore sopra tastierino numerico
// MANTENERE: Solo griglia prodotti + tastierino fisso in basso
```

### 1.5 CSS Specifico POS
```css
/* Solo per pagina POS - ridurre spazi e ottimizzare layout */
.pos-container {
  /* Regole specifiche per compattezza */
}
.pos-header {
  display: none; /* Nascondere header nella pagina POS */
}
```

### 1.6 Quick Buttons Responsive
```typescript
// File: client/src/pages/pos/components/QuickButtons.tsx
// PROBLEMA: Aumentando righe, pulsanti non si rimpiccioliscono
// SOLUZIONE: Grid CSS che si adatta automaticamente
// CSS: fr units per dimensioni dinamiche
```

## 📋 VALIDAZIONE
- [ ] Logo cambiato in "CLOUD3pOS" ovunque
- [ ] Menu senza voce "Aziende"  
- [ ] Pagina POS pulita senza header/tab
- [ ] Stile WowDash applicato consistentemente
- [ ] Quick buttons responsive

## 🚨 NOTE CRITICHE
- **Non toccare**: Logica funzionale esistente
- **Focus**: Solo aspetto visivo e layout
- **Test**: Verificare su diversi screen size
- **Compatibilità**: Mantenere TypeScript types