# Ajustes Realizados para Coincidir con Base de Datos Existente

## ⚠️ IMPORTANTE

La base de datos `wms_db` ya existe. Las migraciones han sido ajustadas para **coincidir exactamente** con el esquema SQL proporcionado. 

**NO ejecutes `php artisan migrate` si la base de datos ya tiene datos**, ya que intentará crear las tablas que ya existen.

## Cambios Realizados en Migraciones

### 1. Nombres de Tablas (Mayúsculas)
Todas las tablas ahora usan nombres con mayúscula inicial para coincidir con SQL Server:
- `Roles` (antes: `roles`)
- `Usuarios` (antes: `usuarios`)
- `Tipos_Ubicacion` (antes: `tipos_ubicacion`)
- `Ubicaciones` (antes: `ubicaciones`)
- `Productos` (antes: `productos`)
- `Lotes` (antes: `lotes`)
- `Inventario` (antes: `inventario`)
- `Ordenes` (antes: `ordenes`)
- `Tareas` (antes: `tareas`)
- `Detalle_Tarea` (antes: `detalle_tarea`)
- `Movimientos` (antes: `movimientos`)
- `Alertas` (antes: `alertas`)

### 2. Estructura de Tablas Ajustada

#### **Roles**
- ✅ Solo `id` y `nombre` (sin descripcion, activo, timestamps)

#### **Usuarios**
- ✅ Campos: `id`, `nombre`, `usuario`, `email`, `password`, `rol_id`
- ❌ Eliminados: `zona_asignada`, `activo`, `remember_token`, `timestamps`

#### **Tipos_Ubicacion**
- ✅ Campos: `id`, `nombre`, `es_picking`, `es_reserva`, `temperatura_min`
- ❌ Eliminados: `descripcion`, `activo`, `timestamps`

#### **Ubicaciones**
- ✅ Campos: `id`, `codigo`, `zona`, `pasillo`, `estante`, `nivel`, `tipo_ubicacion_id`
- ✅ `max_peso` y `max_cantidad` se agregan después con ALTER TABLE (migración 000018)
- ❌ Eliminados: `cantidad_actual`, `peso_actual`, `activo`, `timestamps`

#### **Productos**
- ✅ Campos: `id`, `sku`, `nombre`, `descripcion`, `peso`, `volumen`
- ✅ `clasificacion_id` y `tipo_producto_id` se agregan después con ALTER TABLE (migración 000017)
- ❌ Eliminados: `codigo`, `tipo_producto`, `peso_unitario`, `unidad_medida`, `activo`, `timestamps`

#### **Lotes**
- ✅ Campos: `id`, `lote_codigo`, `producto_id`, `cantidad_original`, `fecha_fabricacion`, `fecha_caducidad`
- ❌ Eliminados: `codigo`, `orden_compra_id`, `timestamps`

#### **Inventario**
- ✅ Campos: `id`, `lote_id`, `ubicacion_id`, `cantidad`, `estado`
- ✅ Constraint UNIQUE en `(lote_id, ubicacion_id)`
- ❌ Eliminados: `producto_id`, `peso_total`, `timestamps`

#### **Ordenes**
- ✅ Campos: `id`, `tipo_orden`, `estado`, `referencia_externa`, `fecha_creacion`, `cliente_proveedor`
- ✅ `fecha_creacion` usa `GETDATE()` por defecto
- ❌ Eliminados: `numero_orden`, `tipo` (enum), `fecha_orden`, `fecha_esperada`, `observaciones`, `timestamps`

#### **Tareas**
- ✅ Campos: `id`, `orden_id`, `tipo_tarea`, `estado`, `prioridad`, `asignada_a_usuario_id`, `fecha_creacion`, `fecha_finalizacion`
- ❌ Eliminados: `numero_tarea`, `ubicacion_origen_id`, `ubicacion_destino_id`, `zona_consolidacion`, `fecha_asignacion`, `fecha_inicio`, `fecha_completada`, `timestamps`

#### **Detalle_Tarea**
- ✅ Campos: `id`, `tarea_id`, `lote_id`, `cantidad_solicitada`, `cantidad_completada`, `ubicacion_origen_id`, `ubicacion_destino_id`
- ❌ Eliminados: `producto_id`, `cantidad_procesada`, `estado`, `timestamps`

#### **Movimientos**
- ✅ Campos: `id`, `lote_id`, `cantidad`, `ubicacion_origen_id`, `ubicacion_destino_id`, `usuario_id`, `tarea_id`, `fecha_movimiento`
- ✅ `fecha_movimiento` usa `GETDATE()` por defecto
- ❌ Eliminados: `tipo`, `producto_id`, `peso_total`, `observaciones`, `timestamps`

#### **Alertas**
- ✅ Campos: `id`, `tipo`, `descripcion`, `nivel_riesgo`, `referencia_id`, `tabla_referencia`, `fecha_alerta`, `estado`
- ✅ `fecha_alerta` usa `GETDATE()` por defecto
- ❌ Eliminados: `titulo`, `mensaje`, `lote_id`, `ubicacion_id`, `producto_id`, `nivel`, `leida`, `timestamps`

### 3. Nuevas Tablas Creadas

#### **Clasificaciones** (Migración 000014)
- Campos: `id`, `nombre`

#### **Tipos_Producto** (Migración 000015)
- Campos: `id`, `nombre`, `manejo_especial`

#### **Incidencias** (Migración 000016)
- Campos: `id`, `tipo_incidencia`, `descripcion`, `fecha_reporte`, `estado`, `reportada_por_usuario_id`, `ubicacion_id`, `lote_id`

### 4. Migraciones ALTER TABLE

#### **000017: Alter Productos** - Agrega Foreign Keys
- `clasificacion_id` → `Clasificaciones(id)`
- `tipo_producto_id` → `Tipos_Producto(id)`

#### **000018: Alter Ubicaciones** - Agrega Capacidad
- `max_peso` (decimal 10,2)
- `max_cantidad` (integer)

## Configuración de Modelos

⚠️ **IMPORTANTE**: Los modelos también necesitan ser actualizados para usar los nombres de tablas correctos. Debes agregar `protected $table` en cada modelo con el nombre exacto de la tabla.

Ejemplo:
```php
protected $table = 'Roles'; // En lugar de 'roles'
```

## Autenticación Windows

Como mencionaste que la autenticación es con Windows, asegúrate de configurar en `.env`:

```env
DB_CONNECTION=sqlsrv
DB_HOST=tu_servidor
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=
DB_PASSWORD=
```

O usar autenticación integrada de Windows en la cadena de conexión.

## Próximos Pasos

1. ✅ Migraciones ajustadas - **COMPLETADO**
2. ✅ Actualizar modelos con nombres de tablas correctos - **COMPLETADO**
3. ✅ Ajustar servicios para nueva estructura - **COMPLETADO**
4. ✅ Actualizar relaciones en modelos - **COMPLETADO**
5. ✅ Comando de prueba de conexión creado - **COMPLETADO**

### Para Probar la Conexión

Ejecuta el comando de prueba:

```bash
php artisan wms:test-connection
```

O consulta el archivo `PRUEBA_CONEXION.md` para una guía completa de pruebas.

## Nota sobre Migraciones

Si necesitas ejecutar las migraciones en un entorno nuevo (sin datos), el orden correcto es:

1. Roles
2. Usuarios
3. Tipos_Ubicacion
4. Ubicaciones
5. Clasificaciones
6. Tipos_Producto
7. Productos
8. Lotes
9. Inventario
10. Ordenes
11. Tareas
12. Detalle_Tarea
13. Movimientos
14. Alertas
15. Incidencias
16. Alter Productos (FK)
17. Alter Ubicaciones (capacidad)

