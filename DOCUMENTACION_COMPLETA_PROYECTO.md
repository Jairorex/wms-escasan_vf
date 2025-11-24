              # Documentación Completa del Sistema WMS (Warehouse Management System)

              ## 📋 Índice
              1. [Descripción del Proyecto](#descripción-del-proyecto)
              2. [Arquitectura del Sistema](#arquitectura-del-sistema)
              3. [Base de Datos - Estructura Completa](#base-de-datos---estructura-completa)
              4. [Queries SQL de la Base de Datos](#queries-sql-de-la-base-de-datos)
              5. [API Endpoints](#api-endpoints)
              6. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
              7. [Documento para Aplicación Móvil](#documento-para-aplicación-móvil)

              ---

              ## 📖 Descripción del Proyecto

              ### Propósito
              Sistema de Gestión de Almacén (WMS) desarrollado para optimizar las operaciones de almacenamiento, picking, packing y movimiento de productos. El sistema permite gestionar inventario, lotes, ubicaciones, tareas y usuarios con control de roles y permisos.

              ### Tecnologías Utilizadas

              #### Backend
              - **Framework**: Laravel 11.x
              - **Base de Datos**: SQL Server (sqlsrv)
              - **Lenguaje**: PHP 8.2+
              - **Autenticación**: Sistema personalizado con tokens

              #### Frontend
              - **Framework**: React 18.x
              - **Build Tool**: Vite
              - **Estado**: TanStack Query (React Query)
              - **Routing**: React Router DOM
              - **Estilos**: Tailwind CSS
              - **Iconos**: Lucide React

              ### Características Principales

              1. **Gestión de Inventario**
                - Control de productos, lotes y ubicaciones
                - Seguimiento de stock en tiempo real
                - Gestión de fechas de caducidad (FEFO)

              2. **Gestión de Tareas**
                - Picking (selección de productos)
                - Packing (empaque)
                - Movimiento de productos
                - Control de tiempos y KPIs

              3. **Sistema de Roles**
                - **Administrador**: Acceso completo al sistema
                - **Supervisor**: Gestión de operarios y monitoreo de tareas
                - **Operario**: Ejecución de tareas asignadas

              4. **Catálogos**
                - Productos con clasificaciones y tipos
                - Ubicaciones con tipos y capacidades
                - Lotes con fechas de fabricación y caducidad
                - Usuarios y roles

              5. **KPIs y Estadísticas**
                - Tiempo promedio de tareas
                - Productividad por operario
                - Estadísticas por supervisor

              ---

              ## 🏗️ Arquitectura del Sistema

              ### Estructura de Directorios

              ```
              Wms_Propuesta2/
              ├── web/
              │   ├── wms-backend/          # Backend Laravel
              │   │   ├── app/
              │   │   │   ├── Http/
              │   │   │   │   ├── Controllers/Api/
              │   │   │   │   └── Middleware/
              │   │   │   ├── Models/
              │   │   │   └── Services/
              │   │   ├── database/
              │   │   │   └── migrations/
              │   │   └── routes/
              │   │       └── api.php
              │   └── frontend/             # Frontend React
              │       └── src/
              │           ├── components/
              │           ├── pages/
              │           ├── contexts/
              │           └── services/
              ```

              ### Flujo de Datos

              1. **Frontend** → Realiza peticiones HTTP a la API
              2. **Middleware** → Valida autenticación y roles
              3. **Controller** → Procesa la lógica de negocio
              4. **Model** → Interactúa con la base de datos
              5. **Response** → Devuelve JSON al frontend

              ---

              ## 🗄️ Base de Datos - Estructura Completa

              ### Diagrama de Relaciones

              ```
              Roles (1) ──< (N) Usuarios (1) ──< (N) Tareas
                                            │
                                            └──< (N) Movimientos

              Tipos_Ubicacion (1) ──< (N) Ubicaciones (1) ──< (N) Inventario
                                                            └──< (N) Detalle_Tarea
                                                            └──< (N) Movimientos
                                                            └──< (N) Alertas

              Clasificaciones (1) ──< (N) Productos (1) ──< (N) Lotes
              Tipos_Producto (1) ──< (N) Productos      │
                                                          └──< (N) Inventario
                                                          └──< (N) Detalle_Tarea
                                                          └──< (N) Movimientos

              Ordenes (1) ──< (N) Tareas (1) ──< (N) Detalle_Tarea
                                            └──< (N) Movimientos

              Lotes (1) ──< (N) Inventario
                    └──< (N) Detalle_Tarea
                    └──< (N) Movimientos
                    └──< (N) Alertas
                    └──< (N) Incidencias
              ```

              ### Tablas Principales

              #### 1. Roles
              Almacena los roles del sistema (Administrador, Supervisor, Operario).

              #### 2. Usuarios
              Usuarios del sistema con autenticación y asignación de roles. Incluye relación con supervisor.

              #### 3. Tipos_Ubicacion
              Tipos de ubicaciones (Congelado, Refrigerado, Seco, etc.) con características especiales.

              #### 4. Ubicaciones
              Ubicaciones físicas del almacén con capacidad máxima (peso y cantidad).

              #### 5. Productos
              Catálogo de productos con SKU, nombre, descripción, peso, volumen y clasificaciones.

              #### 6. Lotes
              Lotes de productos con código único, cantidad original y fechas de fabricación/caducidad.

              #### 7. Ordenes
              Órdenes de recepción, picking o transferencia.

              #### 8. Inventario
              Stock actual por lote y ubicación con estado (Disponible, Cuarentena, etc.).

              #### 9. Tareas
              Tareas de picking, putaway, reabastecimiento o conteo con estados y prioridades.

              #### 10. Detalle_Tarea
              Detalles de productos/lotes por tarea con cantidades solicitadas y completadas.

              #### 11. Movimientos
              Historial de movimientos de productos entre ubicaciones.

              #### 12. Alertas
              Sistema de alertas para stock mínimo, vencimientos, capacidad excedida, etc.

              #### 13. Clasificaciones
              Clasificaciones de productos (Perecedero, No Perecedero, etc.).

              #### 14. Tipos_Producto
              Tipos de productos con manejo especial.

              #### 15. Incidencias
              Registro de incidencias reportadas por usuarios.

              ---

              ## 📊 Queries SQL de la Base de Datos

              ### Scripts de Creación de Tablas

              ```sql
              -- =============================================
              -- TABLA: Roles
              -- =============================================
              CREATE TABLE Roles (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  nombre NVARCHAR(50) NOT NULL UNIQUE
              );

              -- =============================================
              -- TABLA: Usuarios
              -- =============================================
              CREATE TABLE Usuarios (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  nombre NVARCHAR(100) NOT NULL,
                  usuario NVARCHAR(50) NOT NULL UNIQUE,
                  email NVARCHAR(100) NULL UNIQUE,
                  password NVARCHAR(255) NOT NULL,
                  rol_id BIGINT NULL,
                  supervisor_id BIGINT NULL,
                  FOREIGN KEY (rol_id) REFERENCES Roles(id) ON DELETE NO ACTION,
                  FOREIGN KEY (supervisor_id) REFERENCES Usuarios(id) ON DELETE NO ACTION
              );

              -- =============================================
              -- TABLA: Tipos_Ubicacion
              -- =============================================
              CREATE TABLE Tipos_Ubicacion (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  nombre NVARCHAR(50) NOT NULL UNIQUE,
                  es_picking BIT DEFAULT 0,
                  es_reserva BIT DEFAULT 0,
                  temperatura_min DECIMAL(5,2) NULL
              );

              -- =============================================
              -- TABLA: Ubicaciones
              -- =============================================
              CREATE TABLE Ubicaciones (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  codigo NVARCHAR(20) NOT NULL UNIQUE,
                  zona NVARCHAR(10) NULL,
                  pasillo NVARCHAR(10) NULL,
                  estante NVARCHAR(10) NULL,
                  nivel NVARCHAR(10) NULL,
                  tipo_ubicacion_id BIGINT NULL,
                  max_peso DECIMAL(10,2) NULL,
                  max_cantidad INT NULL,
                  FOREIGN KEY (tipo_ubicacion_id) REFERENCES Tipos_Ubicacion(id) ON DELETE NO ACTION
              );

              -- =============================================
              -- TABLA: Clasificaciones
              -- =============================================
              CREATE TABLE Clasificaciones (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  nombre NVARCHAR(50) NOT NULL UNIQUE
              );

              -- =============================================
              -- TABLA: Tipos_Producto
              -- =============================================
              CREATE TABLE Tipos_Producto (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  nombre NVARCHAR(50) NOT NULL UNIQUE,
                  manejo_especial BIT DEFAULT 0
              );

              -- =============================================
              -- TABLA: Productos
              -- =============================================
              CREATE TABLE Productos (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  sku NVARCHAR(50) NOT NULL UNIQUE,
                  nombre NVARCHAR(255) NOT NULL,
                  descripcion NVARCHAR(500) NULL,
                  peso DECIMAL(10,2) NULL,
                  volumen DECIMAL(10,2) NULL,
                  clasificacion_id BIGINT NULL,
                  tipo_producto_id BIGINT NULL,
                  FOREIGN KEY (clasificacion_id) REFERENCES Clasificaciones(id) ON DELETE NO ACTION,
                  FOREIGN KEY (tipo_producto_id) REFERENCES Tipos_Producto(id) ON DELETE NO ACTION
              );

              -- =============================================
              -- TABLA: Lotes
              -- =============================================
              CREATE TABLE Lotes (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  lote_codigo NVARCHAR(50) NOT NULL UNIQUE,
                  producto_id BIGINT NOT NULL,
                  cantidad_original DECIMAL(10,2) NOT NULL,
                  fecha_fabricacion DATE NULL,
                  fecha_caducidad DATE NULL,
                  FOREIGN KEY (producto_id) REFERENCES Productos(id) ON DELETE NO ACTION
              );

              -- =============================================
              -- TABLA: Ordenes
              -- =============================================
              CREATE TABLE Ordenes (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  tipo_orden NVARCHAR(50) NOT NULL,
                  estado NVARCHAR(50) DEFAULT 'PENDIENTE',
                  referencia_externa NVARCHAR(100) NULL,
                  fecha_creacion DATETIME DEFAULT GETDATE(),
                  cliente_proveedor NVARCHAR(255) NULL
              );

              -- =============================================
              -- TABLA: Inventario
              -- =============================================
              CREATE TABLE Inventario (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  lote_id BIGINT NOT NULL,
                  ubicacion_id BIGINT NOT NULL,
                  cantidad DECIMAL(10,2) NOT NULL,
                  estado NVARCHAR(50) DEFAULT 'Disponible',
                  FOREIGN KEY (lote_id) REFERENCES Lotes(id) ON DELETE NO ACTION,
                  FOREIGN KEY (ubicacion_id) REFERENCES Ubicaciones(id) ON DELETE NO ACTION,
                  UNIQUE (lote_id, ubicacion_id)
              );

              -- =============================================
              -- TABLA: Tareas
              -- =============================================
              CREATE TABLE Tareas (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  orden_id BIGINT NULL,
                  tipo_tarea NVARCHAR(50) NOT NULL,
                  estado NVARCHAR(50) DEFAULT 'CREADA',
                  prioridad INT DEFAULT 5,
                  asignada_a_usuario_id BIGINT NULL,
                  fecha_creacion DATETIME DEFAULT GETDATE(),
                  fecha_inicio DATETIME NULL,
                  fecha_fin DATETIME NULL,
                  fecha_finalizacion DATETIME NULL,
                  FOREIGN KEY (orden_id) REFERENCES Ordenes(id) ON DELETE NO ACTION,
                  FOREIGN KEY (asignada_a_usuario_id) REFERENCES Usuarios(id) ON DELETE NO ACTION
              );

              -- =============================================
              -- TABLA: Detalle_Tarea
              -- =============================================
              CREATE TABLE Detalle_Tarea (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  tarea_id BIGINT NOT NULL,
                  lote_id BIGINT NOT NULL,
                  cantidad_solicitada DECIMAL(10,2) NOT NULL,
                  cantidad_completada DECIMAL(10,2) DEFAULT 0,
                  ubicacion_origen_id BIGINT NULL,
                  ubicacion_destino_id BIGINT NULL,
                  FOREIGN KEY (tarea_id) REFERENCES Tareas(id) ON DELETE NO ACTION,
                  FOREIGN KEY (lote_id) REFERENCES Lotes(id) ON DELETE NO ACTION,
                  FOREIGN KEY (ubicacion_origen_id) REFERENCES Ubicaciones(id) ON DELETE NO ACTION,
                  FOREIGN KEY (ubicacion_destino_id) REFERENCES Ubicaciones(id) ON DELETE NO ACTION
              );

              -- =============================================
              -- TABLA: Movimientos
              -- =============================================
              CREATE TABLE Movimientos (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  lote_id BIGINT NOT NULL,
                  cantidad DECIMAL(10,2) NOT NULL,
                  ubicacion_origen_id BIGINT NULL,
                  ubicacion_destino_id BIGINT NULL,
                  usuario_id BIGINT NULL,
                  tarea_id BIGINT NULL,
                  fecha_movimiento DATETIME DEFAULT GETDATE(),
                  FOREIGN KEY (lote_id) REFERENCES Lotes(id) ON DELETE NO ACTION,
                  FOREIGN KEY (ubicacion_origen_id) REFERENCES Ubicaciones(id) ON DELETE NO ACTION,
                  FOREIGN KEY (ubicacion_destino_id) REFERENCES Ubicaciones(id) ON DELETE NO ACTION,
                  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE NO ACTION,
                  FOREIGN KEY (tarea_id) REFERENCES Tareas(id) ON DELETE NO ACTION
              );

              -- =============================================
              -- TABLA: Alertas
              -- =============================================
              CREATE TABLE Alertas (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  tipo NVARCHAR(50) NOT NULL,
                  descripcion NVARCHAR(500) NOT NULL,
                  nivel_riesgo NVARCHAR(10) DEFAULT 'MEDIO',
                  referencia_id INT NULL,
                  tabla_referencia NVARCHAR(50) NULL,
                  fecha_alerta DATETIME DEFAULT GETDATE(),
                  estado NVARCHAR(50) DEFAULT 'PENDIENTE'
              );

              -- =============================================
              -- TABLA: Incidencias
              -- =============================================
              CREATE TABLE Incidencias (
                  id BIGINT IDENTITY(1,1) PRIMARY KEY,
                  tipo_incidencia NVARCHAR(50) NOT NULL,
                  descripcion NVARCHAR(500) NOT NULL,
                  fecha_reporte DATETIME DEFAULT GETDATE(),
                  estado NVARCHAR(50) DEFAULT 'ABIERTA',
                  reportada_por_usuario_id BIGINT NULL,
                  ubicacion_id BIGINT NULL,
                  lote_id BIGINT NULL,
                  FOREIGN KEY (reportada_por_usuario_id) REFERENCES Usuarios(id) ON DELETE NO ACTION,
                  FOREIGN KEY (ubicacion_id) REFERENCES Ubicaciones(id) ON DELETE NO ACTION,
                  FOREIGN KEY (lote_id) REFERENCES Lotes(id) ON DELETE NO ACTION
              );
              ```

              ### Queries Útiles

              ```sql
              -- Obtener inventario por producto
              SELECT 
                  p.sku,
                  p.nombre,
                  l.lote_codigo,
                  u.codigo AS ubicacion,
                  i.cantidad,
                  i.estado
              FROM Inventario i
              INNER JOIN Lotes l ON i.lote_id = l.id
              INNER JOIN Productos p ON l.producto_id = p.id
              INNER JOIN Ubicaciones u ON i.ubicacion_id = u.id
              WHERE p.id = @producto_id;

              -- Obtener tareas pendientes de un usuario
              SELECT 
                  t.id,
                  t.tipo_tarea,
                  t.estado,
                  t.prioridad,
                  o.tipo_orden,
                  COUNT(dt.id) AS items_pendientes
              FROM Tareas t
              LEFT JOIN Ordenes o ON t.orden_id = o.id
              LEFT JOIN Detalle_Tarea dt ON t.id = dt.tarea_id
              WHERE t.asignada_a_usuario_id = @usuario_id
                  AND t.estado IN ('CREADA', 'ASIGNADA', 'EN_CURSO')
              GROUP BY t.id, t.tipo_tarea, t.estado, t.prioridad, o.tipo_orden;

              -- Obtener lotes próximos a vencer
              SELECT 
                  l.lote_codigo,
                  p.sku,
                  p.nombre,
                  l.fecha_caducidad,
                  DATEDIFF(day, GETDATE(), l.fecha_caducidad) AS dias_restantes,
                  SUM(i.cantidad) AS cantidad_disponible
              FROM Lotes l
              INNER JOIN Productos p ON l.producto_id = p.id
              LEFT JOIN Inventario i ON l.id = i.lote_id
              WHERE l.fecha_caducidad IS NOT NULL
                  AND l.fecha_caducidad <= DATEADD(day, 30, GETDATE())
                  AND l.fecha_caducidad >= GETDATE()
              GROUP BY l.id, l.lote_codigo, p.sku, p.nombre, l.fecha_caducidad
              ORDER BY l.fecha_caducidad ASC;

              -- Obtener KPIs de productividad por operario
              SELECT 
                  u.id,
                  u.nombre,
                  COUNT(t.id) AS total_tareas,
                  SUM(CASE WHEN t.estado = 'COMPLETADA' THEN 1 ELSE 0 END) AS tareas_completadas,
                  AVG(DATEDIFF(minute, t.fecha_inicio, t.fecha_fin)) AS tiempo_promedio_minutos
              FROM Usuarios u
              INNER JOIN Tareas t ON u.id = t.asignada_a_usuario_id
              WHERE t.fecha_inicio IS NOT NULL
                  AND t.fecha_fin IS NOT NULL
                  AND t.fecha_creacion >= DATEADD(day, -30, GETDATE())
              GROUP BY u.id, u.nombre;

              -- Obtener estadísticas de supervisor
              SELECT 
                  s.id AS supervisor_id,
                  s.nombre AS supervisor_nombre,
                  COUNT(DISTINCT o.id) AS total_operarios,
                  COUNT(t.id) AS total_tareas_asignadas,
                  SUM(CASE WHEN t.estado = 'COMPLETADA' THEN 1 ELSE 0 END) AS tareas_completadas
              FROM Usuarios s
              LEFT JOIN Usuarios o ON s.id = o.supervisor_id
              LEFT JOIN Tareas t ON o.id = t.asignada_a_usuario_id
              WHERE s.rol_id = (SELECT id FROM Roles WHERE nombre = 'Supervisor')
              GROUP BY s.id, s.nombre;
              ```

              ---

              ## 🔌 API Endpoints

              ### Autenticación
              - `POST /api/auth/login` - Iniciar sesión
              - `POST /api/auth/logout` - Cerrar sesión
              - `GET /api/auth/me` - Obtener usuario actual
              - `POST /api/auth/change-password` - Cambiar contraseña

              ### Productos
              - `GET /api/productos` - Listar productos
              - `GET /api/productos/{id}` - Obtener producto
              - `POST /api/productos` - Crear producto
              - `PUT /api/productos/{id}` - Actualizar producto
              - `DELETE /api/productos/{id}` - Eliminar producto

              ### Lotes
              - `GET /api/lotes` - Listar lotes
              - `GET /api/lotes/{id}` - Obtener lote
              - `POST /api/lotes` - Crear lote
              - `PUT /api/lotes/{id}` - Actualizar lote
              - `DELETE /api/lotes/{id}` - Eliminar lote

              ### Ubicaciones
              - `GET /api/ubicaciones` - Listar ubicaciones
              - `GET /api/ubicaciones/{id}` - Obtener ubicación
              - `POST /api/ubicaciones` - Crear ubicación
              - `PUT /api/ubicaciones/{id}` - Actualizar ubicación
              - `DELETE /api/ubicaciones/{id}` - Eliminar ubicación

              ### Tareas
              - `GET /api/tasks` - Listar tareas
              - `GET /api/tasks/{id}` - Obtener tarea
              - `POST /api/tasks` - Crear tarea
              - `PUT /api/tasks/{id}` - Actualizar tarea
              - `POST /api/tasks/{id}/start` - Iniciar tarea
              - `POST /api/tasks/{id}/complete` - Completar tarea

              ### Usuarios
              - `GET /api/usuarios` - Listar usuarios
              - `GET /api/usuarios/{id}` - Obtener usuario
              - `POST /api/usuarios` - Crear usuario
              - `PUT /api/usuarios/{id}` - Actualizar usuario
              - `DELETE /api/usuarios/{id}` - Eliminar usuario
              - `POST /api/usuarios/{id}/reset-password` - Resetear contraseña

              ### Catálogos
              - `GET /api/catalogos/tipos-ubicacion` - Tipos de ubicación
              - `POST /api/catalogos/tipos-ubicacion` - Crear tipo ubicación
              - `GET /api/catalogos/clasificaciones` - Clasificaciones
              - `POST /api/catalogos/clasificaciones` - Crear clasificación
              - `GET /api/catalogos/tipos-producto` - Tipos de producto
              - `POST /api/catalogos/tipos-producto` - Crear tipo producto

              ### KPIs y Estadísticas
              - `GET /api/tareas/kpis` - KPIs de tareas
              - `GET /api/supervisores/stats` - Estadísticas de supervisores
              - `GET /api/supervisores/{id}/operarios` - Operarios de supervisor

              ---

              ## 👥 Sistema de Roles y Permisos

              ### Roles

              #### Administrador
              - Acceso completo al sistema
              - Gestión de usuarios, productos, ubicaciones, lotes
              - Visualización de todas las estadísticas
              - Configuración del sistema

              #### Supervisor
              - Gestión de operarios asignados
              - Asignación y monitoreo de tareas
              - Visualización de KPIs de sus operarios
              - No puede crear catálogos ni productos

              #### Operario
              - Visualización de tareas asignadas
              - Ejecución de tareas (picking, packing, movimiento)
              - Cambio de estado de tareas
              - No puede crear ni modificar catálogos

              ### Permisos por Módulo

              | Módulo | Administrador | Supervisor | Operario |
              |--------|--------------|------------|----------|
              | Usuarios | CRUD completo | Ver operarios | - |
              | Productos | CRUD completo | Ver | Ver |
              | Lotes | CRUD completo | Ver | Ver |
              | Ubicaciones | CRUD completo | Ver | Ver |
              | Tareas | CRUD completo | Asignar/Ver | Ver/Editar propias |
              | Estadísticas | Todas | De operarios | Propias |

              ---

              ## 📱 Documento para Aplicación Móvil

              # Especificación Técnica: Aplicación Móvil WMS

              ## 1. Información General del Proyecto

              ### Objetivo
              Desarrollar una aplicación móvil nativa o multiplataforma para el Sistema de Gestión de Almacén (WMS) que permita a los operarios y supervisores gestionar tareas, escanear productos y realizar operaciones de almacén desde dispositivos móviles.

              ### Tecnologías Recomendadas
              - **React Native** (recomendado para reutilizar lógica del frontend)
              - **Flutter** (alternativa multiplataforma)
              - **Ionic** (alternativa con web components)

              ### Plataformas Objetivo
              - Android (prioritario)
              - iOS (opcional)

              ---

              ## 2. Arquitectura de la Aplicación

              ### Estructura de Carpetas
              ```
              wms-mobile/
              ├── src/
              │   ├── api/              # Servicios de API
              │   ├── components/       # Componentes reutilizables
              │   ├── screens/         # Pantallas de la app
              │   ├── navigation/      # Navegación
              │   ├── context/         # Context API / Estado global
              │   ├── utils/           # Utilidades
              │   └── hooks/           # Custom hooks
              ├── assets/              # Imágenes, iconos
              └── config/              # Configuración
              ```

              ### Stack Tecnológico Recomendado

              #### React Native
              - **Framework**: React Native 0.72+
              - **Navegación**: React Navigation 6.x
              - **Estado**: React Context API / Zustand
              - **HTTP**: Axios
              - **Almacenamiento**: AsyncStorage
              - **Cámara/Escáner**: react-native-camera / react-native-vision-camera
              - **Notificaciones**: react-native-push-notification
              - **UI**: React Native Paper / NativeBase

              #### Flutter
              - **Framework**: Flutter 3.x
              - **Estado**: Provider / Riverpod
              - **HTTP**: Dio
              - **Almacenamiento**: SharedPreferences
              - **Cámara/Escáner**: camera / mobile_scanner
              - **Notificaciones**: flutter_local_notifications
              - **UI**: Material Design 3

              ---

              ## 3. Funcionalidades Principales

              ### 3.1 Autenticación
              - **Login**: Usuario y contraseña
              - **Logout**: Cerrar sesión
              - **Token Storage**: Guardar token de autenticación
              - **Auto-login**: Recordar sesión

              ### 3.2 Dashboard
              - **Resumen de tareas**: Tareas pendientes, en curso, completadas
              - **KPIs rápidos**: Tiempo promedio, productividad del día
              - **Notificaciones**: Alertas y notificaciones importantes

              ### 3.3 Gestión de Tareas

              #### Para Operarios
              - **Lista de tareas asignadas**: Filtros por estado, tipo, prioridad
              - **Detalle de tarea**: Ver información completa
              - **Iniciar tarea**: Botón para iniciar con timestamp
              - **Completar tarea**: Botón para finalizar con timestamp
              - **Escaneo de productos**: Escanear SKU/lote para validar
              - **Búsqueda de ubicaciones**: Buscar ubicación por código

              #### Para Supervisores
              - **Lista de tareas de operarios**: Ver tareas de operarios asignados
              - **Asignar tareas**: Asignar tareas a operarios
              - **Monitoreo en tiempo real**: Ver estado de tareas
              - **Estadísticas de operarios**: KPIs por operario

              ### 3.4 Escaneo de Códigos
              - **Escáner de barras/QR**: Usar cámara para escanear
              - **Validación**: Validar SKU, lote, ubicación
              - **Feedback visual**: Confirmación de escaneo exitoso
              - **Historial**: Ver últimos escaneos

              ### 3.5 Inventario
              - **Consulta de stock**: Buscar producto por SKU
              - **Ver ubicaciones**: Ver dónde está ubicado un producto
              - **Ver lotes**: Ver lotes disponibles de un producto
              - **Alertas**: Ver alertas de stock bajo o vencimientos

              ### 3.6 Recepción (Solo Supervisores)
              - **Crear orden de recepción**: Crear nueva orden
              - **Escanear productos recibidos**: Escanear productos al recibir
              - **Registrar lotes**: Crear lotes nuevos
              - **Asignar ubicaciones**: Asignar ubicación a productos recibidos

              ---

              ## 4. Diseño de Pantallas

              ### 4.1 Pantalla de Login
              ```
              ┌─────────────────────┐
              │   [Logo WMS]         │
              │                      │
              │   Usuario: [____]    │
              │   Pass:    [____]    │
              │   [👁️]              │
              │                      │
              │   [Iniciar Sesión]   │
              │                      │
              │   ¿Olvidaste pass?   │
              └─────────────────────┘
              ```

              ### 4.2 Dashboard
              ```
              ┌─────────────────────┐
              │ ☰  WMS    🔔        │
              ├─────────────────────┤
              │ Hola, [Nombre]      │
              │ Rol: [Operario]      │
              ├─────────────────────┤
              │ 📊 Resumen del Día  │
              │ ┌─────┐ ┌─────┐     │
              │ │  5  │ │  3  │     │
              │ │Pend.│ │En   │     │
              │ │     │ │Curso│     │
              │ └─────┘ └─────┘     │
              ├─────────────────────┤
              │ 📋 Mis Tareas       │
              │ [Ver Todas →]       │
              │ • Tarea #123        │
              │ • Tarea #124        │
              └─────────────────────┘
              ```

              ### 4.3 Lista de Tareas
              ```
              ┌─────────────────────┐
              │ ← Tareas            │
              │ [🔍] [Filtros ▼]    │
              ├─────────────────────┤
              │ ┌─────────────────┐ │
              │ │ PICK-001        │ │
              │ │ Tipo: Picking   │ │
              │ │ Prioridad: Alta │ │
              │ │ [Iniciar]       │ │
              │ └─────────────────┘ │
              │ ┌─────────────────┐ │
              │ │ PACK-002        │ │
              │ │ Tipo: Packing   │ │
              │ │ Prioridad: Media│ │
              │ │ [Iniciar]       │ │
              │ └─────────────────┘ │
              └─────────────────────┘
              ```

              ### 4.4 Detalle de Tarea
              ```
              ┌─────────────────────┐
              │ ← Tarea #123        │
              ├─────────────────────┤
              │ Tipo: Picking       │
              │ Estado: En Curso    │
              │ Iniciada: 10:30 AM  │
              │                     │
              │ ┌─────────────────┐ │
              │ │ Producto: SKU01 │ │
              │ │ Lote: LOTE-001  │ │
              │ │ Cantidad: 10    │ │
              │ │ Origen: A-01-01 │ │
              │ │ [Escanear]       │ │
              │ └─────────────────┘ │
              │                     │
              │ [Completar Tarea]   │
              └─────────────────────┘
              ```

              ### 4.5 Escáner
              ```
              ┌─────────────────────┐
              │ ← Escanear          │
              ├─────────────────────┤
              │                     │
              │   ┌─────────────┐   │
              │   │             │   │
              │   │  [Cámara]   │   │
              │   │             │   │
              │   └─────────────┘   │
              │                     │
              │ [📷 Activar Cámara] │
              │                     │
              │ Último escaneo:     │
              │ SKU-001 ✓           │
              └─────────────────────┘
              ```

              ---

              ## 5. Integración con API

              ### Configuración Base
              ```javascript
              // config/api.js
              const API_BASE_URL = 'http://tu-servidor:8000/api';

              const apiClient = axios.create({
                baseURL: API_BASE_URL,
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
              });

              // Interceptor para agregar token
              apiClient.interceptors.request.use((config) => {
                const token = AsyncStorage.getItem('auth_token');
                if (token) {
                  config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
              });
              ```

              ### Endpoints Principales
              - Autenticación: `/api/auth/login`, `/api/auth/logout`
              - Tareas: `/api/tasks`, `/api/tasks/{id}/start`, `/api/tasks/{id}/complete`
              - Productos: `/api/productos`
              - Lotes: `/api/lotes`
              - Ubicaciones: `/api/ubicaciones`

              ---

              ## 6. Funcionalidades Técnicas

              ### 6.1 Escaneo de Códigos
              ```javascript
              // Ejemplo React Native
              import { Camera } from 'react-native-camera';

              const ScannerScreen = () => {
                const handleBarCodeRead = async (data) => {
                  try {
                    const response = await api.validateScan(data);
                    if (response.success) {
                      // Mostrar confirmación
                      showSuccess('Código válido');
                    }
                  } catch (error) {
                    showError('Código inválido');
                  }
                };

                return (
                  <Camera
                    onBarCodeRead={handleBarCodeRead}
                    style={styles.camera}
                  />
                );
              };
              ```

              ### 6.2 Notificaciones Push
              - Configurar Firebase Cloud Messaging (FCM) para Android
              - Configurar Apple Push Notification Service (APNs) para iOS
              - Notificar cuando se asigna una nueva tarea
              - Notificar alertas importantes

              ### 6.3 Modo Offline
              - Guardar tareas en caché local
              - Sincronizar cuando vuelva la conexión
              - Indicador de estado de conexión

              ### 6.4 Geolocalización (Opcional)
              - Validar que el usuario esté en el almacén
              - Registrar ubicación al completar tareas

              ---

              ## 7. Seguridad

              ### Consideraciones
              - Almacenar token de forma segura (Keychain/Keystore)
              - Validar certificados SSL
              - No almacenar contraseñas en texto plano
              - Implementar timeout de sesión
              - Validar permisos de cámara y ubicación

              ---

              ## 8. Testing

              ### Pruebas Recomendadas
              - Unit tests para lógica de negocio
              - Integration tests para API
              - E2E tests para flujos principales
              - Pruebas de escaneo de códigos
              - Pruebas de conectividad offline/online

              ---

              ## 9. Despliegue

              ### Android
              - Generar APK/AAB
              - Subir a Google Play Store
              - Configurar versiones

              ### iOS
              - Generar IPA
              - Subir a App Store
              - Configurar certificados

              ---

              ## 10. Mantenimiento

              ### Monitoreo
              - Crash reporting (Sentry, Firebase Crashlytics)
              - Analytics (Firebase Analytics, Mixpanel)
              - Performance monitoring

              ### Actualizaciones
              - Sistema de actualización OTA (opcional)
              - Versionado de API
              - Compatibilidad con versiones anteriores

              ---

              ## 11. Prompt para Desarrollo con IA

              ```
              Necesito desarrollar una aplicación móvil para un Sistema de Gestión de Almacén (WMS) con las siguientes características:

              TECNOLOGÍA: React Native (o Flutter)

              FUNCIONALIDADES PRINCIPALES:
              1. Autenticación de usuarios (login/logout)
              2. Dashboard con resumen de tareas
              3. Lista y gestión de tareas (picking, packing, movimiento)
              4. Escáner de códigos de barras/QR para productos, lotes y ubicaciones
              5. Consulta de inventario y productos
              6. Notificaciones push

              API BACKEND:
              - Base URL: http://localhost:8000/api
              - Autenticación: Bearer Token
              - Endpoints principales:
                - POST /auth/login
                - GET /tasks
                - POST /tasks/{id}/start
                - POST /tasks/{id}/complete
                - GET /productos
                - GET /lotes
                - GET /ubicaciones

              REQUISITOS:
              - Diseño moderno y limpio
              - Soporte offline básico
              - Validación de escaneos
              - Feedback visual claro
              - Navegación intuitiva

              ROLES:
              - Operario: Ver y ejecutar tareas asignadas
              - Supervisor: Ver tareas de operarios, asignar tareas, estadísticas

              Por favor, genera:
              1. Estructura de proyecto
              2. Configuración de navegación
              3. Pantallas principales con diseño
              4. Integración con API
              5. Componente de escáner
              6. Manejo de estado global
              ```

              ---

              ## 12. Recursos Adicionales

              ### Documentación de Referencia
              - API Documentation: Ver sección "API Endpoints" en este documento
              - Base de Datos: Ver sección "Queries SQL" en este documento
              - Diseño UI: Ver sección "Diseño de Pantallas" en este documento

              ### Herramientas Recomendadas
              - **Postman**: Para probar endpoints de API
              - **React Native Debugger**: Para debugging
              - **Flipper**: Para inspección de red y estado
              - **CodePush**: Para actualizaciones OTA (opcional)

              ---

              ## Conclusión

              Este documento proporciona toda la información necesaria para desarrollar una aplicación móvil completa para el sistema WMS. La aplicación debe ser intuitiva, eficiente y permitir a los usuarios realizar sus tareas de manera rápida y precisa desde dispositivos móviles.

              Para cualquier duda o aclaración sobre la implementación, consultar la documentación de la API y la estructura de la base de datos proporcionadas en este documento.

