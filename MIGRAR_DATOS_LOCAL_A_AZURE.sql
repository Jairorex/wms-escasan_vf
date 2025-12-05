-- =====================================================
-- Script para Migrar Datos de Base de Datos Local a Azure SQL
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Exporta los datos de tu base de datos local usando SQL Server Management Studio
-- 2. O usa este script como plantilla para generar INSERT statements
-- 3. Ejecuta este script en Azure SQL Database
--
-- =====================================================

-- =====================================================
-- 1. ROLES (si no existen)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM Roles WHERE nombre = 'Administrador')
BEGIN
    INSERT INTO Roles (nombre, descripcion, created_at, updated_at)
    VALUES ('Administrador', 'Acceso completo al sistema', GETDATE(), GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM Roles WHERE nombre = 'Supervisor de Inventario')
BEGIN
    INSERT INTO Roles (nombre, descripcion, created_at, updated_at)
    VALUES ('Supervisor de Inventario', 'Supervisa inventario y asigna tareas', GETDATE(), GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM Roles WHERE nombre = 'Recepcionista')
BEGIN
    INSERT INTO Roles (nombre, descripcion, created_at, updated_at)
    VALUES ('Recepcionista', 'Gestiona recepciones de mercancía', GETDATE(), GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM Roles WHERE nombre = 'Operario de Picking')
BEGIN
    INSERT INTO Roles (nombre, descripcion, created_at, updated_at)
    VALUES ('Operario de Picking', 'Ejecuta tareas de picking', GETDATE(), GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM Roles WHERE nombre = 'Operario de Cadena Fría')
BEGIN
    INSERT INTO Roles (nombre, descripcion, created_at, updated_at)
    VALUES ('Operario de Cadena Fría', 'Gestiona productos de cadena fría', GETDATE(), GETDATE());
END

-- =====================================================
-- 2. CATEGORIAS_RIESGO (si no existen)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM Categorias_Riesgo WHERE nombre = 'Alto')
BEGIN
    INSERT INTO Categorias_Riesgo (nombre, descripcion, created_at, updated_at)
    VALUES ('Alto', 'Productos de alto riesgo (químicos, tóxicos)', GETDATE(), GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM Categorias_Riesgo WHERE nombre = 'Medio')
BEGIN
    INSERT INTO Categorias_Riesgo (nombre, descripcion, created_at, updated_at)
    VALUES ('Medio', 'Productos de riesgo medio', GETDATE(), GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM Categorias_Riesgo WHERE nombre = 'Bajo')
BEGIN
    INSERT INTO Categorias_Riesgo (nombre, descripcion, created_at, updated_at)
    VALUES ('Bajo', 'Productos de bajo riesgo (alimentos, textiles)', GETDATE(), GETDATE());
END

-- =====================================================
-- 3. SUBBODEGAS (si no existen)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM Subbodegas WHERE codigo = 'SUB-001')
BEGIN
    INSERT INTO Subbodegas (codigo, nombre, tipo, descripcion, capacidad_maxima, stock_minimo, created_at, updated_at)
    VALUES ('SUB-001', 'Almacén Principal', 'Almacenamiento', 'Almacén principal de productos generales', 10000, 100, GETDATE(), GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM Subbodegas WHERE codigo = 'SUB-002')
BEGIN
    INSERT INTO Subbodegas (codigo, nombre, tipo, descripcion, capacidad_maxima, stock_minimo, created_at, updated_at)
    VALUES ('SUB-002', 'Cadena Fría', 'Cadena_Fria', 'Almacén para productos que requieren temperatura controlada', 5000, 50, GETDATE(), GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM Subbodegas WHERE codigo = 'SUB-003')
BEGIN
    INSERT INTO Subbodegas (codigo, nombre, tipo, descripcion, capacidad_maxima, stock_minimo, created_at, updated_at)
    VALUES ('SUB-003', 'Picking', 'Picking', 'Zona de picking para preparación de pedidos', 3000, 30, GETDATE(), GETDATE());
END

-- =====================================================
-- 4. USUARIOS (Ajusta según tus datos locales)
-- =====================================================
-- NOTA: Reemplaza los valores con los de tu base de datos local
-- Ejemplo:
/*
INSERT INTO Usuarios (usuario, nombre, email, password_hash, activo, created_at, updated_at)
SELECT 
    usuario,
    nombre,
    email,
    password_hash,  -- Asegúrate de que las contraseñas estén hasheadas
    activo,
    created_at,
    updated_at
FROM [TU_BD_LOCAL].dbo.Usuarios
WHERE NOT EXISTS (
    SELECT 1 FROM Usuarios u2 
    WHERE u2.usuario = [TU_BD_LOCAL].dbo.Usuarios.usuario
);
*/

-- =====================================================
-- 5. PRODUCTOS (Ajusta según tus datos locales)
-- =====================================================
-- NOTA: Reemplaza los valores con los de tu base de datos local
/*
INSERT INTO Productos (sku, nombre, descripcion, unidad_medida, categoria_riesgo, requiere_temperatura, rango_min, rango_max, rotacion, tipo_producto_id, created_at, updated_at)
SELECT 
    sku,
    nombre,
    descripcion,
    unidad_medida,
    categoria_riesgo,
    requiere_temperatura,
    rango_min,
    rango_max,
    rotacion,
    tipo_producto_id,
    created_at,
    updated_at
FROM [TU_BD_LOCAL].dbo.Productos
WHERE NOT EXISTS (
    SELECT 1 FROM Productos p2 
    WHERE p2.sku = [TU_BD_LOCAL].dbo.Productos.sku
);
*/

-- =====================================================
-- 6. UBICACIONES (Ajusta según tus datos locales)
-- =====================================================
/*
INSERT INTO Ubicaciones (codigo, nombre, tipo_ubicacion_id, subbodega_id, capacidad_maxima, disponible, created_at, updated_at)
SELECT 
    codigo,
    nombre,
    tipo_ubicacion_id,
    subbodega_id,
    capacidad_maxima,
    disponible,
    created_at,
    updated_at
FROM [TU_BD_LOCAL].dbo.Ubicaciones
WHERE NOT EXISTS (
    SELECT 1 FROM Ubicaciones u2 
    WHERE u2.codigo = [TU_BD_LOCAL].dbo.Ubicaciones.codigo
);
*/

-- =====================================================
-- 7. LOTES (Ajusta según tus datos locales)
-- =====================================================
/*
INSERT INTO Lotes (lote_codigo, producto_id, cantidad_original, cantidad_actual, fecha_fabricacion, fecha_caducidad, ubicacion_id, created_at, updated_at)
SELECT 
    lote_codigo,
    producto_id,
    cantidad_original,
    cantidad_actual,
    fecha_fabricacion,
    fecha_caducidad,
    ubicacion_id,
    created_at,
    updated_at
FROM [TU_BD_LOCAL].dbo.Lotes
WHERE NOT EXISTS (
    SELECT 1 FROM Lotes l2 
    WHERE l2.lote_codigo = [TU_BD_LOCAL].dbo.Lotes.lote_codigo
);
*/

-- =====================================================
-- 8. INVENTARIO (Ajusta según tus datos locales)
-- =====================================================
/*
INSERT INTO Inventario (producto_id, lote_id, ubicacion_id, cantidad, created_at, updated_at)
SELECT 
    producto_id,
    lote_id,
    ubicacion_id,
    cantidad,
    created_at,
    updated_at
FROM [TU_BD_LOCAL].dbo.Inventario
WHERE NOT EXISTS (
    SELECT 1 FROM Inventario i2 
    WHERE i2.producto_id = [TU_BD_LOCAL].dbo.Inventario.producto_id
    AND i2.lote_id = [TU_BD_LOCAL].dbo.Inventario.lote_id
    AND i2.ubicacion_id = [TU_BD_LOCAL].dbo.Inventario.ubicacion_id
);
*/

-- =====================================================
-- MÉTODO RECOMENDADO: Usar SQL Server Management Studio
-- =====================================================
-- 
-- 1. Conéctate a tu base de datos LOCAL
-- 2. Click derecho en la base de datos → Tasks → Export Data
-- 3. Selecciona las tablas que quieres exportar
-- 4. Conéctate a Azure SQL Database
-- 5. Importa los datos
--
-- O usa este comando desde SQL Server Management Studio:
-- 
-- Right-click en la base de datos local → Tasks → Generate Scripts
-- Selecciona "Script data" = True
-- Ejecuta el script generado en Azure SQL Database
--
-- =====================================================

