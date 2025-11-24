# Ejemplos de Uso de la API WMS

## Autenticación

Nota: Ajusta las rutas según tu sistema de autenticación (Sanctum, Passport, etc.)

## 1. Recepción de Mercancía (Inbound)

### Crear Orden de Compra

```http
POST /api/inbound/orden
Content-Type: application/json

{
    "numero_orden": "OC-2024-001",
    "fecha_orden": "2024-01-15",
    "fecha_esperada": "2024-01-20",
    "observaciones": "Orden de prueba"
}
```

**Respuesta:**
```json
{
    "status": "success",
    "message": "Orden de compra creada",
    "data": {
        "id": 1,
        "numero_orden": "OC-2024-001",
        "tipo": "compra",
        "estado": "pendiente",
        "fecha_orden": "2024-01-15",
        "fecha_esperada": "2024-01-20"
    }
}
```

### Recibir Mercancía y Crear Lote

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

**Respuesta:**
```json
{
    "status": "success",
    "message": "Mercancía recibida y tarea PUTAWAY creada",
    "data": {
        "lote": {
            "id": 1,
            "codigo": "LOTE-2024-001",
            "producto_id": 1,
            "fecha_caducidad": "2024-12-31"
        },
        "tarea": {
            "id": 1,
            "numero_tarea": "PUT-20240115120000-1234",
            "tipo": "putaway",
            "estado": "pendiente",
            "ubicacion_destino_id": 5
        }
    }
}
```

## 2. Validación de Escaneos (Handheld)

### Escenario: Tarea de Picking

#### Paso 1: Escanear Ubicación

```http
POST /api/tasks/validate-scan
Content-Type: application/json

{
    "tarea_id": 1,
    "tipo_escaneo": "location",
    "valor": "A-01-02-03"
}
```

**Respuesta Exitosa:**
```json
{
    "status": "success",
    "message": "Ubicación válida",
    "next_step": "lot",
    "data": {
        "ubicacion_id": 5,
        "ubicacion_codigo": "A-01-02-03"
    }
}
```

**Respuesta de Error:**
```json
{
    "status": "error",
    "message": "Ubicación incorrecta. Se esperaba: A-01-02-04",
    "next_step": null
}
```

#### Paso 2: Escanear Lote

```http
POST /api/tasks/validate-scan
Content-Type: application/json

{
    "tarea_id": 1,
    "tipo_escaneo": "lot",
    "valor": "LOTE-2024-001"
}
```

**Respuesta Exitosa:**
```json
{
    "status": "success",
    "message": "Lote válido",
    "next_step": "quantity",
    "data": {
        "lote_id": 1,
        "lote_codigo": "LOTE-2024-001",
        "cantidad_disponible": 100,
        "cantidad_solicitada": 50
    }
}
```

#### Paso 3: Ingresar Cantidad

```http
POST /api/tasks/validate-scan
Content-Type: application/json

{
    "tarea_id": 1,
    "tipo_escaneo": "quantity",
    "valor": "50",
    "cantidad": 50
}
```

**Respuesta Exitosa:**
```json
{
    "status": "success",
    "message": "Cantidad procesada exitosamente",
    "next_step": "completed",
    "data": {
        "cantidad_procesada": 50,
        "cantidad_solicitada": 50,
        "tarea_completada": true
    }
}
```

## 3. Consulta de Tareas

### Obtener Tareas Pendientes

```http
GET /api/tasks?estado=pendiente
```

**Respuesta:**
```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "numero_tarea": "PUT-20240115120000-1234",
            "tipo": "putaway",
            "estado": "pendiente",
            "ubicacion_destino": {
                "id": 5,
                "codigo": "A-01-02-03",
                "zona": "A"
            },
            "detalle_tareas": [
                {
                    "id": 1,
                    "producto": {
                        "id": 1,
                        "codigo": "PROD-001",
                        "nombre": "Producto Ejemplo"
                    },
                    "lote": {
                        "id": 1,
                        "codigo": "LOTE-2024-001",
                        "fecha_caducidad": "2024-12-31"
                    },
                    "cantidad_solicitada": 100,
                    "cantidad_procesada": 0,
                    "estado": "pendiente"
                }
            ]
        }
    ]
}
```

### Obtener Detalle de una Tarea Específica

```http
GET /api/tasks/1
```

## 4. Flujo Completo: Putaway

1. **Crear Orden de Compra** → `POST /api/inbound/orden`
2. **Recibir Mercancía** → `POST /api/inbound/receive` (crea lote y tarea PUTAWAY)
3. **Operario obtiene tarea** → `GET /api/tasks?estado=pendiente`
4. **Escaneo de ubicación destino** → `POST /api/tasks/validate-scan` (tipo: location)
5. **Escaneo de lote** → `POST /api/tasks/validate-scan` (tipo: lot)
6. **Ingreso de cantidad** → `POST /api/tasks/validate-scan` (tipo: quantity)
7. **Sistema actualiza inventario automáticamente**

## 5. Flujo Completo: Picking (FEFO)

1. **Crear Orden de Venta** (fuera del scope de esta API)
2. **Sistema crea tarea PICKING automáticamente** usando `TaskEngineService->createPickingTask()`
   - Selecciona lote con vencimiento más próximo (FEFO)
   - Asigna ubicación origen
3. **Operario obtiene tarea** → `GET /api/tasks?estado=pendiente`
4. **Escaneo de ubicación origen** → `POST /api/tasks/validate-scan` (tipo: location)
5. **Escaneo de lote** → `POST /api/tasks/validate-scan` (tipo: lot)
6. **Ingreso de cantidad** → `POST /api/tasks/validate-scan` (tipo: quantity)
7. **Sistema descuenta inventario automáticamente**

## Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error de validación (datos incorrectos)
- `422` - Error de validación de formulario
- `500` - Error interno del servidor

## Manejo de Errores

Todas las respuestas de error siguen este formato:

```json
{
    "status": "error",
    "message": "Descripción del error",
    "errors": {
        "campo": ["Mensaje de error específico"]
    }
}
```

