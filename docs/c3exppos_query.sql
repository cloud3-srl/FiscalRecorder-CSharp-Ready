-- Query completa per importazione prodotti da C3EXPPOS
-- Include tutti i campi esistenti e quelli aggiuntivi non mappati

SELECT 
    -- Campi già mappati nella funzione esistente
    EACODART,           -- code
    EADESART,           -- name, description
    EAPREZZO,           -- price
    EACODLIS,           -- listCode
    EA__DATA,           -- activationDate
    EAUNIMIS,           -- unitOfMeasure
    cpccchk,            -- controlFlag
    EASCONT1,           -- discount1
    EASCONT2,           -- discount2
    EASCONT3,           -- discount3
    EASCONT4,           -- discount4
    EACODFAM,           -- category
    
    -- Campi aggiuntivi non attualmente mappati
    EACODBAR,           -- Codice a barre (barcode)
    EAPERIVA,           -- Aliquota IVA (VAT rate)
    EACODREP,           -- Codice Reparto (department code)
    EADESFAM,           -- Descrizione Famiglia (family description)
    EACATOMO,           -- Categoria Omogenea (homogeneous category)
    EADESOMO,           -- Descrizione Categoria Omogenea (homogeneous category description)
    EAFLOTT,            -- Flag Lotto (lot flag)
    
    -- Campi usati per filtri (utili per debug/controllo)
    EACODAZI,           -- Codice Azienda (company code)
    EAIMPPOS            -- Flag POS (POS flag)

FROM ${actualProductTableName}
WHERE 
    EACODAZI = @companyCode 
    AND EAIMPPOS = 1
ORDER BY 
    EACODART;

-- Query alternativa con gestione NULL e casting esplicito
SELECT 
    -- Campi obbligatori con controllo NULL
    ISNULL(EACODART, '') AS code,
    ISNULL(EADESART, '') AS name,
    ISNULL(EADESART, '') AS description,
    ISNULL(EAPREZZO, 0.00) AS price,
    ISNULL(EACODLIS, '') AS listCode,
    ISNULL(EA__DATA, GETDATE()) AS activationDate,
    ISNULL(EAUNIMIS, '') AS unitOfMeasure,
    ISNULL(cpccchk, '') AS controlFlag,
    ISNULL(EASCONT1, 0.00) AS discount1,
    ISNULL(EASCONT2, 0.00) AS discount2,
    ISNULL(EASCONT3, 0.00) AS discount3,
    ISNULL(EASCONT4, 0.00) AS discount4,
    ISNULL(EACODFAM, '') AS category,
    
    -- Nuovi campi con gestione NULL
    ISNULL(EACODBAR, '') AS barcode,
    ISNULL(EAPERIVA, 0.00) AS vatRate,
    ISNULL(EACODREP, '') AS departmentCode,
    ISNULL(EADESFAM, '') AS familyDescription,
    ISNULL(EACATOMO, '') AS homogeneousCategory,
    ISNULL(EADESOMO, '') AS homogeneousCategoryDescription,
    ISNULL(EAFLOTT, 0) AS lotFlag,
    
    -- Campi di controllo
    EACODAZI AS companyCode,
    EAIMPPOS AS posFlag

FROM ${actualProductTableName}
WHERE 
    EACODAZI = @companyCode 
    AND EAIMPPOS = 1
    AND EACODART IS NOT NULL  -- Evita prodotti senza codice
    AND TRIM(EACODART) != ''  -- Evita codici vuoti
ORDER BY 
    EACODART;

-- Query per verificare la struttura della tabella (utile per debug)
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH,
    NUMERIC_PRECISION,
    NUMERIC_SCALE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = '${actualProductTableName}'
ORDER BY ORDINAL_POSITION;

-- Query di controllo per contare i record
SELECT 
    COUNT(*) AS TotalProducts,
    COUNT(CASE WHEN EACODBAR IS NOT NULL AND TRIM(EACODBAR) != '' THEN 1 END) AS ProductsWithBarcode,
    COUNT(CASE WHEN EAPERIVA IS NOT NULL THEN 1 END) AS ProductsWithVAT,
    COUNT(CASE WHEN EACODREP IS NOT NULL AND TRIM(EACODREP) != '' THEN 1 END) AS ProductsWithDepartment
FROM ${actualProductTableName}
WHERE 
    EACODAZI = @companyCode 
    AND EAIMPPOS = 1;