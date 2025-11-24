# Endpoints API del WMS

## Base URL
`http://localhost:8000/api`

## Endpoints Disponibles

### Tareas

#### GET /tasks
Obtiene lista de tareas
- **Query params:**
  - `estado` (opcional): Filtrar por estado (CREADA, ASIGNADA, EN_CURSO, COMPLETADA, CANCELADA)

**Ejemplo:**
```
GET /api/tasks?estado=CREADA
```

#### GET /tasks/{id}
Obtiene detalles de una tarea específica

#### POST /tasks
Crea una nueva tarea
- **Body:**
```json
{
  "tipo_tarea": "PUTAWAY",
  "prioridad": "NORMAL",
  "orden_id": 1,
  "usuario_asignado_id": 1,
  "observaciones": "Notas adicionales"
}
```

#### PUT /tasks/{id}
Actualiza una tarea existente

#### POST /tasks/validate-scan
Valida un escaneo durante la ejecución de una tarea

### Productos

#### GET /productos
Lista todos los productos
- **Query params:**
  - `search` (opcional): Buscar por SKU o nombre

#### GET /productos/{id}
Obtiene un producto específico

#### POST /productos
Crea un nuevo producto
- **Body:**
```json
{
  "sku": "PROD-001",
  "nombre": "Producto Ejemplo",
  "descripcion": "Descripción del producto",
  "peso": 1.5,
  "volumen": 0.5,
  "clasificacion_id": 1,
  "tipo_producto_id": 1
}
```

#### PUT /productos/{id}
Actualiza un producto

#### DELETE /productos/{id}
Elimina un producto

### Ubicaciones

#### GET /ubicaciones
Lista todas las ubicaciones
- **Query params:**
  - `search` (opcional): Buscar por código, pasillo, estante

#### GET /ubicaciones/{id}
Obtiene una ubicación específica

#### POST /ubicaciones
Crea una nueva ubicación
- **Body:**
```json
{
  "codigo": "A-01-01-01",
  "pasillo": "A",
  "estante": "01",
  "nivel": "01",
  "tipo_ubicacion_id": 1,
  "max_peso": 1000,
  "max_cantidad": 100
}
```

#### PUT /ubicaciones/{id}
Actualiza una ubicación

#### DELETE /ubicaciones/{id}
Elimina una ubicación

### Catálogos

#### GET /tipos-ubicacion
Obtiene todos los tipos de ubicación

#### GET /clasificaciones
Obtiene todas las clasificaciones

#### GET /tipos-producto
Obtiene todos los tipos de producto

### Lotes

#### GET /lotes
Lista todos los lotes
- **Query params:**
  - `search` (opcional): Buscar por código de lote, producto o SKU

#### GET /lotes/{id}
Obtiene un lote específico

### Usuarios

#### GET /usuarios
Lista todos los usuarios
- **Query params:**
  - `search` (opcional): Buscar por usuario, nombre o email

#### GET /usuarios/{id}
Obtiene un usuario específico

### Inbound (Recepción)

#### POST /inbound/receive
Recibe mercancía y crea lote con tarea PUTAWAY
- **Body:**
```json
{
  "orden_compra_id": 1,
  "producto_id": 1,
  "codigo_lote": "LOTE-2024-001",
  "fecha_caducidad": "2024-12-31",
  "fecha_fabricacion": "2024-01-01",
  "cantidad": 100
}
```

#### POST /inbound/orden
Crea una orden de compra

## Formato de Respuesta

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje opcional"
}
```

### Error
```json
{
  "success": false,
  "message": "Mensaje de error",
  "errors": { ... }
}
```

## Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error de validación
- `404` - No encontrado
- `500` - Error del servidor

