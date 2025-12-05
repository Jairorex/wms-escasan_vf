-- =============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS WMS ESCASAN
-- SQL Server / Azure SQL Database
-- =============================================

USE [WMS_ESCASAN_VF]; -- Cambia por el nombre de tu base de datos
GO

-- =============================================
-- TABLA: Roles
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Roles] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [nombre] NVARCHAR(50) NOT NULL UNIQUE
    );
    PRINT 'Tabla Roles creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Roles ya existe';
END
GO

-- =============================================
-- TABLA: Usuarios
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Usuarios]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Usuarios] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [nombre] NVARCHAR(100) NOT NULL,
        [usuario] NVARCHAR(50) NOT NULL UNIQUE,
        [email] NVARCHAR(100) NULL UNIQUE,
        [password] NVARCHAR(255) NOT NULL,
        [rol_id] BIGINT NULL,
        CONSTRAINT [FK_Usuarios_Roles] FOREIGN KEY ([rol_id]) 
            REFERENCES [dbo].[Roles]([id]) ON DELETE NO ACTION
    );
    PRINT 'Tabla Usuarios creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Usuarios ya existe';
END
GO

-- =============================================
-- TABLA: Tipos_Ubicacion
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tipos_Ubicacion]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Tipos_Ubicacion] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [nombre] NVARCHAR(50) NOT NULL UNIQUE,
        [es_picking] BIT DEFAULT 0,
        [es_reserva] BIT DEFAULT 0,
        [temperatura_min] DECIMAL(5,2) NULL
    );
    PRINT 'Tabla Tipos_Ubicacion creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Tipos_Ubicacion ya existe';
END
GO

-- =============================================
-- TABLA: Subbodegas (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Subbodegas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Subbodegas] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [codigo] NVARCHAR(20) NOT NULL UNIQUE,
        [nombre] NVARCHAR(100) NOT NULL,
        [descripcion] NVARCHAR(255) NULL,
        [tipo] NVARCHAR(50) NOT NULL DEFAULT 'RESGUARDO',
        [temperatura_min] DECIMAL(5,2) NULL,
        [temperatura_max] DECIMAL(5,2) NULL,
        [stock_minimo] INT DEFAULT 0,
        [requiere_temperatura] BIT DEFAULT 0,
        [activa] BIT DEFAULT 1,
        [fecha_creacion] DATETIME DEFAULT GETDATE()
    );
    PRINT 'Tabla Subbodegas creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Subbodegas ya existe';
END
GO

-- =============================================
-- TABLA: Ubicaciones
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Ubicaciones]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Ubicaciones] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [codigo] NVARCHAR(20) NOT NULL UNIQUE,
        [zona] NVARCHAR(10) NULL,
        [pasillo] NVARCHAR(10) NULL,
        [estante] NVARCHAR(10) NULL,
        [nivel] NVARCHAR(10) NULL,
        [tipo_ubicacion_id] BIGINT NULL,
        [subbodega_id] BIGINT NULL,
        [tiene_control_temperatura] BIT DEFAULT 0,
        [temperatura_actual] DECIMAL(5,2) NULL,
        [ultima_lectura_temperatura] DATETIME NULL,
        [estado] NVARCHAR(50) DEFAULT 'DISPONIBLE',
        [max_peso] DECIMAL(10,2) NULL,
        [max_cantidad] INT NULL,
        CONSTRAINT [FK_Ubicaciones_Tipos_Ubicacion] FOREIGN KEY ([tipo_ubicacion_id]) 
            REFERENCES [dbo].[Tipos_Ubicacion]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Ubicaciones_Subbodegas] FOREIGN KEY ([subbodega_id]) 
            REFERENCES [dbo].[Subbodegas]([id]) ON DELETE SET NULL
    );
    PRINT 'Tabla Ubicaciones creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Ubicaciones ya existe';
END
GO

-- =============================================
-- TABLA: Categorias_Riesgo (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Categorias_Riesgo]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Categorias_Riesgo] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [codigo] NVARCHAR(20) NOT NULL UNIQUE,
        [nombre] NVARCHAR(100) NOT NULL,
        [descripcion] NVARCHAR(255) NULL,
        [nivel_riesgo] NVARCHAR(20) DEFAULT 'BAJO',
        [requiere_certificacion] BIT DEFAULT 0,
        [requiere_temperatura] BIT DEFAULT 0,
        [activa] BIT DEFAULT 1
    );
    PRINT 'Tabla Categorias_Riesgo creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Categorias_Riesgo ya existe';
END
GO

-- =============================================
-- TABLA: Productos
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Productos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Productos] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [sku] NVARCHAR(50) NOT NULL UNIQUE,
        [nombre] NVARCHAR(255) NOT NULL,
        [descripcion] NVARCHAR(500) NULL,
        [peso] DECIMAL(10,2) NULL,
        [volumen] DECIMAL(10,2) NULL,
        [categoria_riesgo_id] BIGINT NULL,
        [requiere_temperatura] BIT DEFAULT 0,
        [temperatura_min] DECIMAL(5,2) NULL,
        [temperatura_max] DECIMAL(5,2) NULL,
        [rotacion] NVARCHAR(20) DEFAULT 'MEDIA',
        [stock_minimo] INT DEFAULT 0,
        [stock_maximo] INT NULL,
        [codigo_barras] NVARCHAR(50) NULL,
        [proveedor_principal] NVARCHAR(100) NULL,
        CONSTRAINT [FK_Productos_Categorias_Riesgo] FOREIGN KEY ([categoria_riesgo_id]) 
            REFERENCES [dbo].[Categorias_Riesgo]([id]) ON DELETE SET NULL
    );
    PRINT 'Tabla Productos creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Productos ya existe';
END
GO

-- =============================================
-- TABLA: Lotes
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Lotes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Lotes] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [lote_codigo] NVARCHAR(50) NOT NULL UNIQUE,
        [producto_id] BIGINT NOT NULL,
        [cantidad_original] DECIMAL(10,2) NOT NULL,
        [fecha_fabricacion] DATE NULL,
        [fecha_caducidad] DATE NULL,
        CONSTRAINT [FK_Lotes_Productos] FOREIGN KEY ([producto_id]) 
            REFERENCES [dbo].[Productos]([id]) ON DELETE NO ACTION
    );
    PRINT 'Tabla Lotes creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Lotes ya existe';
END
GO

-- =============================================
-- TABLA: Ordenes
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Ordenes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Ordenes] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [tipo_orden] NVARCHAR(50) NOT NULL,
        [estado] NVARCHAR(50) DEFAULT 'PENDIENTE',
        [referencia_externa] NVARCHAR(100) NULL,
        [fecha_creacion] DATETIME DEFAULT GETDATE(),
        [cliente_proveedor] NVARCHAR(255) NULL
    );
    PRINT 'Tabla Ordenes creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Ordenes ya existe';
END
GO

-- =============================================
-- TABLA: Inventario
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Inventario]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Inventario] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [lote_id] BIGINT NOT NULL,
        [ubicacion_id] BIGINT NOT NULL,
        [cantidad] DECIMAL(10,2) NOT NULL,
        [estado] NVARCHAR(50) DEFAULT 'Disponible',
        CONSTRAINT [FK_Inventario_Lotes] FOREIGN KEY ([lote_id]) 
            REFERENCES [dbo].[Lotes]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Inventario_Ubicaciones] FOREIGN KEY ([ubicacion_id]) 
            REFERENCES [dbo].[Ubicaciones]([id]) ON DELETE NO ACTION,
        CONSTRAINT [UQ_Inventario_Lote_Ubicacion] UNIQUE ([lote_id], [ubicacion_id])
    );
    PRINT 'Tabla Inventario creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Inventario ya existe';
END
GO

-- =============================================
-- TABLA: Tareas
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tareas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Tareas] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [orden_id] BIGINT NULL,
        [tipo_tarea] NVARCHAR(50) NOT NULL,
        [estado] NVARCHAR(50) DEFAULT 'CREADA',
        [prioridad] INT DEFAULT 5,
        [asignada_a_usuario_id] BIGINT NULL,
        [fecha_creacion] DATETIME DEFAULT GETDATE(),
        [fecha_inicio] DATETIME NULL,
        [fecha_fin] DATETIME NULL,
        [fecha_finalizacion] DATETIME NULL,
        [numero_tarea] NVARCHAR(50) NULL,
        [descripcion] NVARCHAR(500) NULL,
        CONSTRAINT [FK_Tareas_Ordenes] FOREIGN KEY ([orden_id]) 
            REFERENCES [dbo].[Ordenes]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Tareas_Usuarios] FOREIGN KEY ([asignada_a_usuario_id]) 
            REFERENCES [dbo].[Usuarios]([id]) ON DELETE NO ACTION
    );
    PRINT 'Tabla Tareas creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Tareas ya existe';
END
GO

-- =============================================
-- TABLA: Detalle_Tarea
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Detalle_Tarea]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Detalle_Tarea] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [tarea_id] BIGINT NOT NULL,
        [lote_id] BIGINT NOT NULL,
        [producto_id] BIGINT NULL,
        [cantidad_solicitada] DECIMAL(10,2) NOT NULL,
        [cantidad_completada] DECIMAL(10,2) DEFAULT 0,
        [ubicacion_origen_id] BIGINT NULL,
        [ubicacion_destino_id] BIGINT NULL,
        CONSTRAINT [FK_Detalle_Tarea_Tareas] FOREIGN KEY ([tarea_id]) 
            REFERENCES [dbo].[Tareas]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Detalle_Tarea_Lotes] FOREIGN KEY ([lote_id]) 
            REFERENCES [dbo].[Lotes]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Detalle_Tarea_Ubicaciones_Origen] FOREIGN KEY ([ubicacion_origen_id]) 
            REFERENCES [dbo].[Ubicaciones]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Detalle_Tarea_Ubicaciones_Destino] FOREIGN KEY ([ubicacion_destino_id]) 
            REFERENCES [dbo].[Ubicaciones]([id]) ON DELETE NO ACTION
    );
    PRINT 'Tabla Detalle_Tarea creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Detalle_Tarea ya existe';
END
GO

-- =============================================
-- TABLA: Movimientos
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Movimientos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Movimientos] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [lote_id] BIGINT NOT NULL,
        [cantidad] DECIMAL(10,2) NOT NULL,
        [ubicacion_origen_id] BIGINT NULL,
        [ubicacion_destino_id] BIGINT NULL,
        [usuario_id] BIGINT NULL,
        [tarea_id] BIGINT NULL,
        [fecha_movimiento] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_Movimientos_Lotes] FOREIGN KEY ([lote_id]) 
            REFERENCES [dbo].[Lotes]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Movimientos_Ubicaciones_Origen] FOREIGN KEY ([ubicacion_origen_id]) 
            REFERENCES [dbo].[Ubicaciones]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Movimientos_Ubicaciones_Destino] FOREIGN KEY ([ubicacion_destino_id]) 
            REFERENCES [dbo].[Ubicaciones]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Movimientos_Usuarios] FOREIGN KEY ([usuario_id]) 
            REFERENCES [dbo].[Usuarios]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Movimientos_Tareas] FOREIGN KEY ([tarea_id]) 
            REFERENCES [dbo].[Tareas]([id]) ON DELETE NO ACTION
    );
    PRINT 'Tabla Movimientos creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Movimientos ya existe';
END
GO

-- =============================================
-- TABLA: Alertas
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Alertas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Alertas] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [tipo] NVARCHAR(50) NOT NULL,
        [descripcion] NVARCHAR(500) NOT NULL,
        [nivel_riesgo] NVARCHAR(10) DEFAULT 'MEDIO',
        [referencia_id] INT NULL,
        [tabla_referencia] NVARCHAR(50) NULL,
        [fecha_alerta] DATETIME DEFAULT GETDATE(),
        [estado] NVARCHAR(50) DEFAULT 'PENDIENTE'
    );
    PRINT 'Tabla Alertas creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Alertas ya existe';
END
GO

-- =============================================
-- TABLA: Reglas_Compatibilidad (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Reglas_Compatibilidad]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Reglas_Compatibilidad] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [categoria_riesgo_id] BIGINT NOT NULL,
        [tipo_subbodega] NVARCHAR(50) NOT NULL,
        [permitido] BIT DEFAULT 1,
        [motivo_restriccion] NVARCHAR(255) NULL,
        [activa] BIT DEFAULT 1,
        CONSTRAINT [FK_Reglas_Compatibilidad_Categorias_Riesgo] FOREIGN KEY ([categoria_riesgo_id]) 
            REFERENCES [dbo].[Categorias_Riesgo]([id]) ON DELETE CASCADE
    );
    PRINT 'Tabla Reglas_Compatibilidad creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Reglas_Compatibilidad ya existe';
END
GO

-- =============================================
-- TABLA: Recepciones (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Recepciones]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Recepciones] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [numero_recepcion] NVARCHAR(50) NOT NULL UNIQUE,
        [orden_id] INT NULL,
        [tipo_recepcion] NVARCHAR(50) DEFAULT 'ESTANDAR',
        [proveedor] NVARCHAR(100) NULL,
        [documento_proveedor] NVARCHAR(50) NULL,
        [subbodega_destino_id] BIGINT NULL,
        [temperatura_recibida] DECIMAL(5,2) NULL,
        [temperatura_valida] BIT NULL,
        [observaciones_temperatura] NVARCHAR(255) NULL,
        [estado] NVARCHAR(50) DEFAULT 'PENDIENTE',
        [motivo_rechazo] NVARCHAR(255) NULL,
        [usuario_id] INT NULL,
        [fecha_recepcion] DATETIME DEFAULT GETDATE(),
        [fecha_completada] DATETIME NULL,
        [documentos_adjuntos] NVARCHAR(MAX) NULL,
        [observaciones] NVARCHAR(MAX) NULL,
        CONSTRAINT [FK_Recepciones_Subbodegas] FOREIGN KEY ([subbodega_destino_id]) 
            REFERENCES [dbo].[Subbodegas]([id]) ON DELETE SET NULL
    );
    PRINT 'Tabla Recepciones creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Recepciones ya existe';
END
GO

-- =============================================
-- TABLA: Detalle_Recepciones (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Detalle_Recepciones]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Detalle_Recepciones] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [recepcion_id] BIGINT NOT NULL,
        [producto_id] INT NOT NULL,
        [lote_id] INT NULL,
        [cantidad_esperada] DECIMAL(10,2) DEFAULT 0,
        [cantidad_recibida] DECIMAL(10,2) DEFAULT 0,
        [cantidad_rechazada] DECIMAL(10,2) DEFAULT 0,
        [temperatura_producto] DECIMAL(5,2) NULL,
        [temperatura_aceptable] BIT NULL,
        [estado] NVARCHAR(50) DEFAULT 'PENDIENTE',
        [motivo_rechazo] NVARCHAR(255) NULL,
        [ubicacion_destino_id] INT NULL,
        [codigo_barras_generado] NVARCHAR(100) NULL,
        [observaciones] NVARCHAR(MAX) NULL,
        CONSTRAINT [FK_Detalle_Recepciones_Recepciones] FOREIGN KEY ([recepcion_id]) 
            REFERENCES [dbo].[Recepciones]([id]) ON DELETE CASCADE
    );
    PRINT 'Tabla Detalle_Recepciones creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Detalle_Recepciones ya existe';
END
GO

-- =============================================
-- TABLA: Permisos (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Permisos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Permisos] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [codigo] NVARCHAR(50) NOT NULL UNIQUE,
        [nombre] NVARCHAR(100) NOT NULL,
        [modulo] NVARCHAR(50) NOT NULL,
        [descripcion] NVARCHAR(255) NULL,
        [activo] BIT DEFAULT 1
    );
    PRINT 'Tabla Permisos creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Permisos ya existe';
END
GO

-- =============================================
-- TABLA: Roles_Permisos (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles_Permisos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Roles_Permisos] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [rol_id] INT NOT NULL,
        [permiso_id] BIGINT NOT NULL,
        CONSTRAINT [FK_Roles_Permisos_Permisos] FOREIGN KEY ([permiso_id]) 
            REFERENCES [dbo].[Permisos]([id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_Roles_Permisos] UNIQUE ([rol_id], [permiso_id])
    );
    PRINT 'Tabla Roles_Permisos creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Roles_Permisos ya existe';
END
GO

-- =============================================
-- TABLA: Reabastecimientos (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Reabastecimientos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Reabastecimientos] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [numero_reabastecimiento] NVARCHAR(50) NOT NULL UNIQUE,
        [tipo] NVARCHAR(50) DEFAULT 'MANUAL',
        [subbodega_origen_id] BIGINT NOT NULL,
        [subbodega_destino_id] BIGINT NOT NULL,
        [estado] NVARCHAR(50) DEFAULT 'PENDIENTE',
        [prioridad] NVARCHAR(20) DEFAULT 'MEDIA',
        [solicitado_por] INT NULL,
        [aprobado_por] INT NULL,
        [ejecutado_por] INT NULL,
        [fecha_solicitud] DATETIME DEFAULT GETDATE(),
        [fecha_aprobacion] DATETIME NULL,
        [fecha_ejecucion] DATETIME NULL,
        [fecha_completado] DATETIME NULL,
        [fecha_programada] DATE NULL,
        [observaciones] NVARCHAR(MAX) NULL,
        [motivo_cancelacion] NVARCHAR(255) NULL,
        CONSTRAINT [FK_Reabastecimientos_Subbodegas_Origen] FOREIGN KEY ([subbodega_origen_id]) 
            REFERENCES [dbo].[Subbodegas]([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reabastecimientos_Subbodegas_Destino] FOREIGN KEY ([subbodega_destino_id]) 
            REFERENCES [dbo].[Subbodegas]([id]) ON DELETE NO ACTION
    );
    PRINT 'Tabla Reabastecimientos creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Reabastecimientos ya existe';
END
GO

-- =============================================
-- TABLA: Detalle_Reabastecimientos (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Detalle_Reabastecimientos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Detalle_Reabastecimientos] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [reabastecimiento_id] BIGINT NOT NULL,
        [producto_id] INT NOT NULL,
        [lote_id] INT NULL,
        [cantidad_solicitada] DECIMAL(10,2) NOT NULL,
        [cantidad_aprobada] DECIMAL(10,2) NULL,
        [cantidad_enviada] DECIMAL(10,2) DEFAULT 0,
        [ubicacion_origen_id] INT NULL,
        [ubicacion_destino_id] INT NULL,
        [estado] NVARCHAR(50) DEFAULT 'PENDIENTE',
        [observaciones] NVARCHAR(MAX) NULL,
        CONSTRAINT [FK_Detalle_Reabastecimientos_Reabastecimientos] FOREIGN KEY ([reabastecimiento_id]) 
            REFERENCES [dbo].[Reabastecimientos]([id]) ON DELETE CASCADE
    );
    PRINT 'Tabla Detalle_Reabastecimientos creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Detalle_Reabastecimientos ya existe';
END
GO

-- =============================================
-- TABLA: Configuracion_Reabastecimiento (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Configuracion_Reabastecimiento]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Configuracion_Reabastecimiento] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [subbodega_id] BIGINT NOT NULL,
        [producto_id] INT NULL,
        [stock_minimo_trigger] INT DEFAULT 10,
        [cantidad_reabastecimiento] INT DEFAULT 50,
        [dias_entre_reabastecimientos] INT DEFAULT 15,
        [proximo_reabastecimiento] DATE NULL,
        [activo] BIT DEFAULT 1,
        [fecha_creacion] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_Configuracion_Reabastecimiento_Subbodegas] FOREIGN KEY ([subbodega_id]) 
            REFERENCES [dbo].[Subbodegas]([id]) ON DELETE CASCADE
    );
    PRINT 'Tabla Configuracion_Reabastecimiento creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Configuracion_Reabastecimiento ya existe';
END
GO

-- =============================================
-- TABLA: Lecturas_Temperatura (NUEVA)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Lecturas_Temperatura]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Lecturas_Temperatura] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [ubicacion_id] INT NULL,
        [subbodega_id] BIGINT NULL,
        [temperatura] DECIMAL(5,2) NOT NULL,
        [humedad] DECIMAL(5,2) NULL,
        [dentro_rango] BIT DEFAULT 1,
        [temperatura_min_esperada] DECIMAL(5,2) NULL,
        [temperatura_max_esperada] DECIMAL(5,2) NULL,
        [origen] NVARCHAR(50) DEFAULT 'MANUAL',
        [sensor_id] NVARCHAR(50) NULL,
        [usuario_id] INT NULL,
        [fecha_lectura] DATETIME DEFAULT GETDATE(),
        [alerta_id] INT NULL,
        [observaciones] NVARCHAR(MAX) NULL,
        CONSTRAINT [FK_Lecturas_Temperatura_Subbodegas] FOREIGN KEY ([subbodega_id]) 
            REFERENCES [dbo].[Subbodegas]([id]) ON DELETE CASCADE
    );
    PRINT 'Tabla Lecturas_Temperatura creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Lecturas_Temperatura ya existe';
END
GO

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar Roles básicos
IF NOT EXISTS (SELECT * FROM [dbo].[Roles] WHERE [nombre] = 'Administrador')
    INSERT INTO [dbo].[Roles] ([nombre]) VALUES ('Administrador');
IF NOT EXISTS (SELECT * FROM [dbo].[Roles] WHERE [nombre] = 'Supervisor')
    INSERT INTO [dbo].[Roles] ([nombre]) VALUES ('Supervisor');
IF NOT EXISTS (SELECT * FROM [dbo].[Roles] WHERE [nombre] = 'Operario')
    INSERT INTO [dbo].[Roles] ([nombre]) VALUES ('Operario');
IF NOT EXISTS (SELECT * FROM [dbo].[Roles] WHERE [nombre] = 'Recepcionista')
    INSERT INTO [dbo].[Roles] ([nombre]) VALUES ('Recepcionista');
IF NOT EXISTS (SELECT * FROM [dbo].[Roles] WHERE [nombre] = 'Operario Cadena Fría')
    INSERT INTO [dbo].[Roles] ([nombre]) VALUES ('Operario Cadena Fría');
IF NOT EXISTS (SELECT * FROM [dbo].[Roles] WHERE [nombre] = 'Operario Picking')
    INSERT INTO [dbo].[Roles] ([nombre]) VALUES ('Operario Picking');
IF NOT EXISTS (SELECT * FROM [dbo].[Roles] WHERE [nombre] = 'Supervisor Inventario')
    INSERT INTO [dbo].[Roles] ([nombre]) VALUES ('Supervisor Inventario');
GO

-- Insertar Subbodegas por defecto
IF NOT EXISTS (SELECT * FROM [dbo].[Subbodegas] WHERE [codigo] = 'SB-PICK')
    INSERT INTO [dbo].[Subbodegas] ([codigo], [nombre], [descripcion], [tipo], [stock_minimo], [requiere_temperatura], [activa])
    VALUES ('SB-PICK', 'Subbodega de Picking', 'Área para preparación de pedidos', 'PICKING', 10, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Subbodegas] WHERE [codigo] = 'SB-RESG')
    INSERT INTO [dbo].[Subbodegas] ([codigo], [nombre], [descripcion], [tipo], [stock_minimo], [requiere_temperatura], [activa])
    VALUES ('SB-RESG', 'Subbodega de Resguardo', 'Almacenamiento principal', 'RESGUARDO', 50, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Subbodegas] WHERE [codigo] = 'SB-FRIO')
    INSERT INTO [dbo].[Subbodegas] ([codigo], [nombre], [descripcion], [tipo], [temperatura_min], [temperatura_max], [stock_minimo], [requiere_temperatura], [activa])
    VALUES ('SB-FRIO', 'Cadena Fría', 'Productos refrigerados', 'CADENA_FRIA', -5.00, 8.00, 20, 1, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Subbodegas] WHERE [codigo] = 'SB-QUIM')
    INSERT INTO [dbo].[Subbodegas] ([codigo], [nombre], [descripcion], [tipo], [stock_minimo], [requiere_temperatura], [activa])
    VALUES ('SB-QUIM', 'Químicos y Pesticidas', 'Productos químicos controlados', 'QUIMICOS', 15, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Subbodegas] WHERE [codigo] = 'SB-VALOR')
    INSERT INTO [dbo].[Subbodegas] ([codigo], [nombre], [descripcion], [tipo], [stock_minimo], [requiere_temperatura], [activa])
    VALUES ('SB-VALOR', 'Alto Valor', 'Productos de alto valor', 'ALTO_VALOR', 5, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Subbodegas] WHERE [codigo] = 'SB-CUAR')
    INSERT INTO [dbo].[Subbodegas] ([codigo], [nombre], [descripcion], [tipo], [stock_minimo], [requiere_temperatura], [activa])
    VALUES ('SB-CUAR', 'Cuarentena', 'Productos en observación', 'CUARENTENA', 0, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Subbodegas] WHERE [codigo] = 'SB-DEST')
    INSERT INTO [dbo].[Subbodegas] ([codigo], [nombre], [descripcion], [tipo], [stock_minimo], [requiere_temperatura], [activa])
    VALUES ('SB-DEST', 'Destrucción', 'Productos para destrucción', 'DESTRUCCION', 0, 0, 1);
GO

-- Insertar Categorías de Riesgo
IF NOT EXISTS (SELECT * FROM [dbo].[Categorias_Riesgo] WHERE [codigo] = 'CAT-ALI')
    INSERT INTO [dbo].[Categorias_Riesgo] ([codigo], [nombre], [descripcion], [nivel_riesgo], [requiere_certificacion], [requiere_temperatura], [activa])
    VALUES ('CAT-ALI', 'Alimenticio', 'Productos alimenticios para consumo humano o animal', 'MEDIO', 1, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Categorias_Riesgo] WHERE [codigo] = 'CAT-QUIM')
    INSERT INTO [dbo].[Categorias_Riesgo] ([codigo], [nombre], [descripcion], [nivel_riesgo], [requiere_certificacion], [requiere_temperatura], [activa])
    VALUES ('CAT-QUIM', 'Químico/Pesticida', 'Productos químicos, pesticidas y agroquímicos', 'ALTO', 1, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Categorias_Riesgo] WHERE [codigo] = 'CAT-FARM')
    INSERT INTO [dbo].[Categorias_Riesgo] ([codigo], [nombre], [descripcion], [nivel_riesgo], [requiere_certificacion], [requiere_temperatura], [activa])
    VALUES ('CAT-FARM', 'Farmacéutico', 'Medicamentos y productos farmacéuticos', 'CRITICO', 1, 1, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Categorias_Riesgo] WHERE [codigo] = 'CAT-VALOR')
    INSERT INTO [dbo].[Categorias_Riesgo] ([codigo], [nombre], [descripcion], [nivel_riesgo], [requiere_certificacion], [requiere_temperatura], [activa])
    VALUES ('CAT-VALOR', 'Alto Valor', 'Productos de alto valor económico', 'ALTO', 0, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Categorias_Riesgo] WHERE [codigo] = 'CAT-GEN')
    INSERT INTO [dbo].[Categorias_Riesgo] ([codigo], [nombre], [descripcion], [nivel_riesgo], [requiere_certificacion], [requiere_temperatura], [activa])
    VALUES ('CAT-GEN', 'General', 'Productos generales sin riesgo especial', 'BAJO', 0, 0, 1);
IF NOT EXISTS (SELECT * FROM [dbo].[Categorias_Riesgo] WHERE [codigo] = 'CAT-REFRI')
    INSERT INTO [dbo].[Categorias_Riesgo] ([codigo], [nombre], [descripcion], [nivel_riesgo], [requiere_certificacion], [requiere_temperatura], [activa])
    VALUES ('CAT-REFRI', 'Refrigerado', 'Productos que requieren cadena de frío', 'ALTO', 1, 1, 1);
GO

PRINT '========================================';
PRINT 'SCRIPT COMPLETADO EXITOSAMENTE';
PRINT '========================================';
PRINT 'Todas las tablas han sido creadas o verificadas.';
PRINT 'Datos iniciales insertados.';
GO

