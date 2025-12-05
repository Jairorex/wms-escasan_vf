-- =====================================================
-- Script para EXPORTAR Datos de Base de Datos Local
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script en tu base de datos LOCAL
-- 2. Copia los resultados y ejecútalos en Azure SQL Database
-- 3. O usa SQL Server Management Studio para exportar/importar
--
-- =====================================================

-- =====================================================
-- 1. EXPORTAR ROLES
-- =====================================================
SELECT 
    'INSERT INTO Roles (nombre, descripcion, created_at, updated_at) VALUES (''' + 
    nombre + ''', ''' + 
    ISNULL(descripcion, '') + ''', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Roles;

-- =====================================================
-- 2. EXPORTAR CATEGORIAS_RIESGO
-- =====================================================
SELECT 
    'INSERT INTO Categorias_Riesgo (nombre, descripcion, created_at, updated_at) VALUES (''' + 
    nombre + ''', ''' + 
    ISNULL(descripcion, '') + ''', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Categorias_Riesgo;

-- =====================================================
-- 3. EXPORTAR SUBBODEGAS
-- =====================================================
SELECT 
    'INSERT INTO Subbodegas (codigo, nombre, tipo, descripcion, capacidad_maxima, stock_minimo, created_at, updated_at) VALUES (''' + 
    codigo + ''', ''' + 
    nombre + ''', ''' + 
    tipo + ''', ''' + 
    ISNULL(descripcion, '') + ''', ' + 
    CAST(capacidad_maxima AS VARCHAR) + ', ' + 
    CAST(stock_minimo AS VARCHAR) + ', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Subbodegas;

-- =====================================================
-- 4. EXPORTAR USUARIOS (SIN CONTRASEÑAS - Debes hashearlas manualmente)
-- =====================================================
SELECT 
    'INSERT INTO Usuarios (usuario, nombre, email, password_hash, activo, created_at, updated_at) VALUES (''' + 
    usuario + ''', ''' + 
    nombre + ''', ''' + 
    email + ''', ''' + 
    password_hash + ''', ' + 
    CAST(activo AS VARCHAR) + ', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Usuarios;

-- =====================================================
-- 5. EXPORTAR PRODUCTOS
-- =====================================================
SELECT 
    'INSERT INTO Productos (sku, nombre, descripcion, unidad_medida, categoria_riesgo, requiere_temperatura, rango_min, rango_max, rotacion, tipo_producto_id, created_at, updated_at) VALUES (''' + 
    sku + ''', ''' + 
    nombre + ''', ''' + 
    ISNULL(descripcion, '') + ''', ''' + 
    unidad_medida + ''', ''' + 
    ISNULL(categoria_riesgo, '') + ''', ' + 
    CAST(requiere_temperatura AS VARCHAR) + ', ' + 
    ISNULL(CAST(rango_min AS VARCHAR), 'NULL') + ', ' + 
    ISNULL(CAST(rango_max AS VARCHAR), 'NULL') + ', ' + 
    ISNULL(CAST(rotacion AS VARCHAR), 'NULL') + ', ' + 
    ISNULL(CAST(tipo_producto_id AS VARCHAR), 'NULL') + ', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Productos;

-- =====================================================
-- 6. EXPORTAR UBICACIONES
-- =====================================================
SELECT 
    'INSERT INTO Ubicaciones (codigo, nombre, tipo_ubicacion_id, subbodega_id, capacidad_maxima, disponible, created_at, updated_at) VALUES (''' + 
    codigo + ''', ''' + 
    nombre + ''', ' + 
    CAST(tipo_ubicacion_id AS VARCHAR) + ', ' + 
    CAST(subbodega_id AS VARCHAR) + ', ' + 
    CAST(capacidad_maxima AS VARCHAR) + ', ' + 
    CAST(disponible AS VARCHAR) + ', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Ubicaciones;

-- =====================================================
-- 7. EXPORTAR LOTES
-- =====================================================
SELECT 
    'INSERT INTO Lotes (lote_codigo, producto_id, cantidad_original, cantidad_actual, fecha_fabricacion, fecha_caducidad, ubicacion_id, created_at, updated_at) VALUES (''' + 
    lote_codigo + ''', ' + 
    CAST(producto_id AS VARCHAR) + ', ' + 
    CAST(cantidad_original AS VARCHAR) + ', ' + 
    CAST(cantidad_actual AS VARCHAR) + ', ''' + 
    CONVERT(VARCHAR, fecha_fabricacion, 120) + ''', ''' + 
    CONVERT(VARCHAR, fecha_caducidad, 120) + ''', ' + 
    CAST(ubicacion_id AS VARCHAR) + ', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Lotes;

-- =====================================================
-- 8. EXPORTAR INVENTARIO
-- =====================================================
SELECT 
    'INSERT INTO Inventario (producto_id, lote_id, ubicacion_id, cantidad, created_at, updated_at) VALUES (' + 
    CAST(producto_id AS VARCHAR) + ', ' + 
    CAST(lote_id AS VARCHAR) + ', ' + 
    CAST(ubicacion_id AS VARCHAR) + ', ' + 
    CAST(cantidad AS VARCHAR) + ', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Inventario;

-- =====================================================
-- 9. EXPORTAR TAREAS (si las tienes)
-- =====================================================
SELECT 
    'INSERT INTO Tareas (numero_tarea, tipo, estado, descripcion, usuario_asignado_id, fecha_inicio, fecha_fin, created_at, updated_at) VALUES (''' + 
    numero_tarea + ''', ''' + 
    tipo + ''', ''' + 
    estado + ''', ''' + 
    ISNULL(descripcion, '') + ''', ' + 
    ISNULL(CAST(usuario_asignado_id AS VARCHAR), 'NULL') + ', ' + 
    ISNULL('''' + CONVERT(VARCHAR, fecha_inicio, 120) + '''', 'NULL') + ', ' + 
    ISNULL('''' + CONVERT(VARCHAR, fecha_fin, 120) + '''', 'NULL') + ', ''' + 
    CONVERT(VARCHAR, created_at, 120) + ''', ''' + 
    CONVERT(VARCHAR, updated_at, 120) + ''');' AS SQL_INSERT
FROM Tareas;

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- 1. Ejecuta cada SELECT por separado
-- 2. Copia los resultados (las columnas SQL_INSERT)
-- 3. Ejecuta los INSERT statements en Azure SQL Database
-- 4. Verifica que no haya duplicados antes de insertar
--
-- O mejor aún, usa SQL Server Management Studio:
-- Right-click en la base de datos → Tasks → Generate Scripts
-- Marca "Script data" = True
-- Ejecuta el script en Azure SQL Database
-- =====================================================

