# Sistema WMS (Warehouse Management System)

Sistema de gestión de almacén desarrollado en Laravel con SQL Server.

## Características

### A. Entrada y Almacenamiento (Inbound)
- Recepción de mercancía con validación contra Orden de Compra
- Creación automática de lotes con fecha de caducidad
- Algoritmo de ubicación (Putaway) con 3 reglas:
  - **Regla 1 (Compatibilidad)**: Tipo_Producto debe coincidir con Tipo_Ubicacion
  - **Regla 2 (Capacidad)**: Validación de cantidad y peso máximo
  - **Regla 3 (Overflow)**: Sugerencia de ubicación de desborde cuando no hay espacio
- Generación automática de tareas PUTAWAY

### B. Salida y Preparación (Outbound)
- Estrategia de Picking FEFO (First Expired First Out)
- Validación paso a paso:
  - Escaneo de Ubicación
  - Escaneo de Lote
  - Ingreso de Cantidad
- Consolidación de productos de múltiples zonas

### C. Monitoreo y Alertas
- **Alertas Pasivas**: Jobs nocturnos para revisar fechas de caducidad
- **Alertas Activas**: Bloqueo y redirección cuando se intenta ubicar en posición llena

## Estructura del Proyecto

El backend está organizado en la carpeta `backend/`:

```
backend/
├── app/
│   ├── Console/Commands/
│   │   ├── CheckExpiryAlerts.php      # Job cron para vencimientos
│   │   └── CheckMinStock.php          # Job cron para stock bajo
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── TaskController.php     # Endpoint para Handheld (Validación)
│   │   │   └── InboundController.php  # Recepción de mercancía
│   │   └── Requests/
│   │       └── ValidateScanRequest.php # Reglas de validación
│   ├── Models/                         # Todos los modelos con relaciones
│   └── Services/
│       ├── InventoryService.php       # Gestión de stock
│       ├── TaskEngineService.php      # Asignar, priorizar y validar tareas
│       └── SlottingService.php        # Algoritmo de ubicación
├── database/
│   ├── migrations/                     # Migraciones de base de datos
│   └── seeders/                       # Seeders de datos
├── routes/
│   └── api.php                        # Rutas API
└── config/                            # Archivos de configuración
```

Ver `ESTRUCTURA_PROYECTO.md` para más detalles sobre la organización.

## Instalación

1. **Configurar conexión SQL Server**

   Edita tu archivo `.env`:
   ```env
   DB_CONNECTION=sqlsrv
   DB_HOST=tu_servidor_sql
   DB_PORT=1433
   DB_DATABASE=nombre_base_datos
   DB_USERNAME=tu_usuario
   DB_PASSWORD=tu_contraseña
   ```

2. **Instalar dependencias**
   ```bash
   composer install
   ```

3. **Ejecutar migraciones**
   ```bash
   # Si estás integrando en un proyecto Laravel existente:
   # Copia los archivos de backend/ a tu proyecto Laravel
   
   # Si la base de datos ya existe, NO ejecutes migrate
   # php artisan migrate
   ```

## Uso

### API Endpoints

#### Validar Escaneo (Handheld)
```http
POST /api/tasks/validate-scan
Content-Type: application/json

{
    "tarea_id": 1,
    "tipo_escaneo": "location",  // location, lot, quantity
    "valor": "A-01-02-03",
    "cantidad": 10.5  // Solo requerido si tipo_escaneo es "quantity"
}
```

#### Recibir Mercancía
```http
POST /api/inbound/receive
Content-Type: application/json

{
    "orden_compra_id": 1,
    "producto_id": 1,
    "codigo_lote": "LOTE-2024-001",
    "fecha_caducidad": "2024-12-31",
    "fecha_fabricacion": "2024-01-15",
    "cantidad": 100
}
```

#### Obtener Tareas
```http
GET /api/tasks?estado=pendiente
```

### Comandos de Consola

#### Revisar Vencimientos
```bash
php artisan wms:check-expiry --days=30
```

Este comando:
- Busca lotes que vencen en los próximos 30 días (configurable)
- Verifica que tengan cantidad > 0 en inventario
- Crea alertas en la tabla `alertas`

#### Revisar Stock Mínimo
```bash
php artisan wms:check-min-stock
```

### Programar Jobs Nocturnos

Agrega al archivo `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Revisar vencimientos diariamente a las 2 AM
    $schedule->command('wms:check-expiry --days=30')
             ->dailyAt('02:00');
    
    // Revisar stock mínimo diariamente a las 3 AM
    $schedule->command('wms:check-min-stock')
             ->dailyAt('03:00');
}
```

## Flujo de Datos

### Proceso de Picking (Ejemplo)

1. **Operario escanea ubicación**
   - Handheld envía: `{tarea_id: 1, tipo_escaneo: "location", valor: "A-01-02-03"}`
   - Backend valida contra `tarea.ubicacion_origen_id`
   - Respuesta: `{status: "success", next_step: "lot"}`

2. **Operario escanea lote**
   - Handheld envía: `{tarea_id: 1, tipo_escaneo: "lot", valor: "LOTE-001"}`
   - Backend valida contra `detalle_tarea.lote_id`
   - Respuesta: `{status: "success", next_step: "quantity"}`

3. **Operario ingresa cantidad**
   - Handheld envía: `{tarea_id: 1, tipo_escaneo: "quantity", valor: "10", cantidad: 10}`
   - Backend:
     - Valida cantidad disponible
     - Llama a `InventoryService->removeStock()`
     - Actualiza `detalle_tarea.cantidad_procesada`
     - Crea registro en `movimientos`
   - Respuesta: `{status: "success", next_step: "completed"}`

## Reglas de Negocio

### Algoritmo de Ubicación (Putaway)

1. **Compatibilidad**: Solo ubicaciones con `tipo_ubicacion.nombre = producto.tipo_producto`
2. **Capacidad**: `(cantidad_actual + entrada) <= max_cantidad` Y `(peso_actual + entrada) <= max_peso`
3. **Agrupación**: Prioriza ubicaciones que ya contengan lotes del mismo producto
4. **Overflow**: Si no hay espacio, sugiere ubicación de desborde

### Estrategia FEFO (Picking)

- Selecciona el lote con `fecha_caducidad` más próxima
- Valida que haya stock disponible
- Crea tarea de picking con ubicación origen

## Base de Datos

### Tablas Principales

- `roles` - Roles de usuario
- `usuarios` - Usuarios del sistema
- `tipos_ubicacion` - Tipos de ubicación (Congelado, Refrigerado, etc.)
- `ubicaciones` - Ubicaciones físicas con capacidad
- `productos` - Catálogo de productos
- `lotes` - Lotes con fecha de caducidad
- `ordenes` - Órdenes de compra/venta
- `inventario` - Stock por producto, lote y ubicación
- `tareas` - Tareas de putaway, picking, reubicación
- `detalle_tarea` - Detalles de productos por tarea
- `movimientos` - Historial de movimientos
- `alertas` - Sistema de alertas

## Notas Importantes

- Todas las claves foráneas usan `onDelete('restrict')` para integridad de datos
- Las transacciones DB aseguran atomicidad en operaciones críticas
- El sistema valida en cada paso del proceso de picking/putaway
- Las alertas se generan automáticamente para vencimientos y stock bajo

## Licencia

Este proyecto es privado y de uso interno.

