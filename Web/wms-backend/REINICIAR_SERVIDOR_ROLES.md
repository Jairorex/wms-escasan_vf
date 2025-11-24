# ⚠️ IMPORTANTE: Reiniciar Servidor para Activar Nuevas Rutas

## Problema
Las nuevas rutas de KPIs y Supervisores no están siendo reconocidas porque el servidor necesita reiniciarse y limpiar la caché.

## Solución

### 1. Detener el servidor actual
Presiona `Ctrl+C` en la terminal donde está corriendo `php artisan serve`

### 2. Limpiar todas las cachés
```powershell
cd C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear
```

### 3. Verificar que las rutas estén registradas
```powershell
php artisan route:list | Select-String -Pattern "tareas|supervisores"
```

Deberías ver:
- `GET api/tareas/kpis`
- `GET api/supervisores/stats`
- `GET api/supervisores/{id}/operarios`
- `POST api/supervisores/{supervisorId}/operarios/{operarioId}`

### 4. Reiniciar el servidor
```powershell
php artisan serve
```

## Rutas Nuevas Implementadas

### KPIs de Tareas
- `GET /api/tareas/kpis` - Obtener KPIs y estadísticas de tareas

### Supervisores
- `GET /api/supervisores/stats` - Estadísticas de supervisores (solo admin)
- `GET /api/supervisores/{id}/operarios` - Operarios de un supervisor
- `POST /api/supervisores/{supervisorId}/operarios/{operarioId}` - Asignar operario a supervisor

### Tareas
- `POST /api/tasks/{id}/start` - Iniciar tarea (establece fecha_inicio)
- `POST /api/tasks/{id}/complete` - Completar tarea (establece fecha_fin)

## Nota sobre el Error 500 en Usuarios

El error "Call to undefined relationship [supervisor]" debería estar resuelto porque:
1. El modelo `Usuario` ya tiene la relación `supervisor()` definida
2. El `UsuarioController` ya carga la relación con `with(['rol', 'supervisor'])`

Si persiste, ejecuta las migraciones:
```powershell
php artisan migrate
```

Esto agregará la columna `supervisor_id` a la tabla `Usuarios`.

