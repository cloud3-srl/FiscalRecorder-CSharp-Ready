-- Crea gruppi favoriti di default basati sui reparti esistenti
INSERT INTO favorite_groups (name, type, original_id, display_order, created_at, updated_at)
SELECT 
    COALESCE(button_description, description) as name,
    'department' as type,
    id as original_id,
    id as display_order,
    NOW() as created_at,
    NOW() as updated_at
FROM departments
WHERE NOT EXISTS (
    SELECT 1 FROM favorite_groups 
    WHERE type = 'department' AND original_id = departments.id
);

-- Se non esistono reparti, crea alcuni gruppi favoriti di default
INSERT INTO favorite_groups (name, type, display_order, created_at, updated_at)
SELECT 'Bevande Calde', 'custom', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM favorite_groups);

INSERT INTO favorite_groups (name, type, display_order, created_at, updated_at)
SELECT 'Snack Dolci', 'custom', 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM favorite_groups WHERE name = 'Snack Dolci');

INSERT INTO favorite_groups (name, type, display_order, created_at, updated_at)
SELECT 'Promozioni', 'custom', 3, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM favorite_groups WHERE name = 'Promozioni');
