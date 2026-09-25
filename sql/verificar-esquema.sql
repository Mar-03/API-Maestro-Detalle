-- Verifica las tablas disponibles sin modificar nada.
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('Estudiantes', 'Misiones', 'EstudianteMisiones')
ORDER BY TABLE_NAME;

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('Estudiantes', 'Misiones', 'EstudianteMisiones')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT MisionID, Nombre, Descripcion
FROM dbo.Misiones
ORDER BY MisionID;
