# Sistema de Roles y Permisos

## 📋 Roles Implementados

### 1. Administrador
- **Acceso completo** a todas las funcionalidades
- Puede crear, editar y eliminar catálogos (productos, ubicaciones, usuarios)
- Puede ver todas las tareas del sistema
- Puede ver estadísticas de todos los supervisores y operarios
- Puede asignar operarios a supervisores

### 2. Supervisor
- **Puede monitorear y gestionar tareas** de sus operarios asignados
- Puede asignar tareas a operarios de su equipo
- Puede ver estadísticas de su equipo
- **NO puede** crear catálogos (productos, ubicaciones, etc.)
- Puede ver inventario y recepción
- Tiene acceso a pestañas de picking, packing, movimiento

### 3. Operario
- **Solo puede ver sus tareas asignadas**
- Puede cambiar el estado de sus tareas (iniciar, completar)
- Puede acceder a pestañas de picking, packing, movimiento
- **NO puede** ver catálogos
- **NO puede** ver inventario o recepción
- **NO puede** crear tareas

## 🔐 Permisos por Funcionalidad

| Funcionalidad | Administrador | Supervisor | Operario |
|--------------|---------------|-------------|----------|
| Dashboard | ✅ | ✅ | ✅ |
| Tareas (ver todas) | ✅ | ✅ (solo de su equipo) | ❌ |
| Tareas (ver propias) | ✅ | ✅ | ✅ |
| Crear Tareas | ✅ | ✅ | ❌ |
| Asignar Tareas | ✅ | ✅ (solo a su equipo) | ❌ |
| Picking/Packing/Movimiento | ✅ | ✅ | ✅ |
| Inventario | ✅ | ✅ | ❌ |
| Recepción | ✅ | ✅ | ❌ |
| Alertas | ✅ | ✅ | ✅ |
| Catálogos | ✅ | ❌ | ❌ |
| Usuarios | ✅ | ❌ | ❌ |
| Estadísticas | ✅ | ✅ (solo de su equipo) | ❌ |

## 👥 Asignación Supervisor-Operario

### Estructura
- Cada **Operario** puede estar asignado a un **Supervisor**
- Un **Supervisor** puede tener múltiples **Operarios**
- Un **Operario** solo puede tener un **Supervisor**

### Funcionalidad
- **Admin** puede asignar operarios a cualquier supervisor
- **Supervisor** puede asignar operarios solo a sí mismo
- Al crear/editar un usuario con rol "Operario", se puede seleccionar su supervisor

## ⏱️ Sistema de Tiempos

### Campos en Tareas
- `fecha_creacion` - Cuando se crea la tarea
- `fecha_inicio` - Cuando se inicia (estado EN_PROCESO)
- `fecha_fin` - Cuando se finaliza (estado COMPLETADA)
- `fecha_finalizacion` - Alias de fecha_fin

### Cálculo de Tiempos
- **Tiempo transcurrido**: Diferencia entre `fecha_inicio` y `fecha_fin` (o ahora si está en proceso)
- **Tiempo promedio**: Promedio de tiempos de tareas completadas
- **Formato**: "Xh Ym" (horas y minutos)

### Acciones que Actualizan Tiempos
- **Iniciar tarea**: Establece `fecha_inicio` cuando cambia a `EN_PROCESO`
- **Completar tarea**: Establece `fecha_fin` cuando cambia a `COMPLETADA`

## 📊 KPIs y Estadísticas

### Endpoint: GET /api/tareas/kpis

Retorna:
- Resumen general (total, completadas, en proceso, pendientes)
- Tiempo promedio de completación
- Tareas por tipo (PICK, PACK, MOVE, PUTAWAY)
- Tareas por operario (solo para supervisor/admin)

### Filtros por Rol
- **Operario**: Solo ve sus propias tareas
- **Supervisor**: Ve tareas de sus operarios
- **Admin**: Ve todas las tareas

## 🎯 Pestañas de Operaciones

### Picking
- Muestra solo tareas de tipo `PICK`
- Permite iniciar y completar tareas
- Muestra contador de tiempo

### Packing
- Muestra solo tareas de tipo `PACK`
- Permite iniciar y completar tareas
- Muestra contador de tiempo

### Movimiento
- Muestra solo tareas de tipo `MOVE`
- Permite iniciar y completar tareas
- Muestra contador de tiempo

## 🔧 Endpoints Nuevos

### Tareas
- `POST /api/tasks/{id}/start` - Iniciar tarea
- `POST /api/tasks/{id}/complete` - Completar tarea
- `GET /api/tareas/kpis` - Obtener KPIs

### Supervisores
- `GET /api/supervisores/stats` - Estadísticas de supervisores (solo admin)
- `GET /api/supervisores/{id}/operarios` - Operarios de un supervisor
- `POST /api/supervisores/{supervisorId}/operarios/{operarioId}` - Asignar operario

## 📝 Migraciones Necesarias

Ejecutar:
```bash
php artisan migrate
```

Esto creará:
- Columna `supervisor_id` en tabla `Usuarios`
- Columnas `fecha_inicio` y `fecha_fin` en tabla `Tareas`

## 🚀 Crear Usuarios

Ejecutar:
```bash
php artisan wms:create-users
```

Esto creará:
- **admin** / admin123 (Administrador)
- **supervisor** / supervisor123 (Supervisor)
- **operario** / operario123 (Operario)

## 📱 Navegación Frontend

La navegación se ajusta automáticamente según el rol:
- **Admin**: Ve todo
- **Supervisor**: Ve todo excepto catálogos
- **Operario**: Solo ve Dashboard, Tareas propias, Picking, Packing, Movimiento, Alertas

