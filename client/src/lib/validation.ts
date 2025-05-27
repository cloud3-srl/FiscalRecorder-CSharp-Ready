// Validazione Codice Fiscale e Partita IVA Italiana

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida un codice fiscale italiano
 */
export function validateFiscalCode(fiscalCode: string): ValidationResult {
  if (!fiscalCode) {
    return { isValid: true }; // Campo opzionale
  }

  const cf = fiscalCode.toUpperCase().trim();
  
  // Lunghezza corretta
  if (cf.length !== 16) {
    return { isValid: false, error: "Il codice fiscale deve essere di 16 caratteri" };
  }

  // Pattern: 6 lettere + 2 numeri + 1 lettera + 2 numeri + 1 lettera + 3 caratteri + 1 lettera
  const pattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  if (!pattern.test(cf)) {
    return { isValid: false, error: "Formato codice fiscale non valido" };
  }

  // Validazione carattere di controllo
  const controlChar = calculateFiscalCodeControl(cf.substring(0, 15));
  if (controlChar !== cf.charAt(15)) {
    return { isValid: false, error: "Carattere di controllo del codice fiscale non valido" };
  }

  return { isValid: true };
}

/**
 * Calcola il carattere di controllo del codice fiscale
 */
function calculateFiscalCodeControl(firstFifteen: string): string {
  const oddMap: { [key: string]: number } = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  };

  const evenMap: { [key: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
  };

  const controlChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = firstFifteen.charAt(i);
    if (i % 2 === 0) {
      sum += oddMap[char] || 0;
    } else {
      sum += evenMap[char] || 0;
    }
  }

  return controlChars.charAt(sum % 26);
}

/**
 * Valida una partita IVA italiana
 */
export function validateVatNumber(vatNumber: string): ValidationResult {
  if (!vatNumber) {
    return { isValid: true }; // Campo opzionale
  }

  const vat = vatNumber.replace(/\s/g, '').trim();
  
  // Lunghezza corretta
  if (vat.length !== 11) {
    return { isValid: false, error: "La partita IVA deve essere di 11 cifre" };
  }

  // Solo numeri
  if (!/^\d{11}$/.test(vat)) {
    return { isValid: false, error: "La partita IVA deve contenere solo numeri" };
  }

  // Validazione algoritmo di controllo
  const digits = vat.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  if (checkDigit !== digits[10]) {
    return { isValid: false, error: "Carattere di controllo della partita IVA non valido" };
  }

  return { isValid: true };
}

/**
 * Valida un codice SDI (Sistema di Interscambio)
 */
export function validateSdiCode(sdiCode: string): ValidationResult {
  if (!sdiCode) {
    return { isValid: true }; // Campo opzionale
  }

  const code = sdiCode.toUpperCase().trim();
  
  // Codice univoco: 7 caratteri alfanumerici
  if (code.length !== 7) {
    return { isValid: false, error: "Il codice SDI deve essere di 7 caratteri" };
  }

  if (!/^[A-Z0-9]{7}$/.test(code)) {
    return { isValid: false, error: "Il codice SDI deve contenere solo lettere e numeri" };
  }

  return { isValid: true };
}

/**
 * Valida un indirizzo email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: true }; // Campo opzionale
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Formato email non valido" };
  }

  return { isValid: true };
}

/**
 * Valida un numero di telefono italiano
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: true }; // Campo opzionale
  }

  // Rimuovi spazi e caratteri speciali
  const cleanPhone = phone.replace(/[\s\-\.\(\)]/g, '');
  
  // Telefono italiano: da 6 a 15 cifre, può iniziare con +39
  const phoneRegex = /^(\+39)?[0-9]{6,15}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: "Formato telefono non valido" };
  }

  return { isValid: true };
}

/**
 * Valida tutti i campi di un cliente
 */
export function validateCustomer(customer: {
  name?: string;
  fiscalCode?: string;
  vatNumber?: string;
  sdiCode?: string;
  email?: string;
  phone?: string;
}): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  // Nome è obbligatorio
  if (!customer.name?.trim()) {
    errors.name = "La ragione sociale è obbligatoria";
  }

  // Validazioni specifiche
  const fiscalCodeResult = validateFiscalCode(customer.fiscalCode || '');
  if (!fiscalCodeResult.isValid && fiscalCodeResult.error) {
    errors.fiscalCode = fiscalCodeResult.error;
  }

  const vatResult = validateVatNumber(customer.vatNumber || '');
  if (!vatResult.isValid && vatResult.error) {
    errors.vatNumber = vatResult.error;
  }

  const sdiResult = validateSdiCode(customer.sdiCode || '');
  if (!sdiResult.isValid && sdiResult.error) {
    errors.sdiCode = sdiResult.error;
  }

  const emailResult = validateEmail(customer.email || '');
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  const phoneResult = validatePhone(customer.phone || '');
  if (!phoneResult.isValid && phoneResult.error) {
    errors.phone = phoneResult.error;
  }

  return errors;
}
