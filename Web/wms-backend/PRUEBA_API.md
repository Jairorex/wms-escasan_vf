# Prueba de Conexión API

## Verificar que el Backend esté Corriendo

```bash
cd Web/wms-backend
php artisan serve
```

Deberías ver:
```
INFO  Server running on [http://127.0.0.1:8000]
```

## Probar el Endpoint de Health

### Desde el Navegador
Abre: `http://localhost:8000/api/health`

### Desde PowerShell
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/health" | Select-Object -ExpandProperty Content
```

### Desde curl (si está disponible)
```bash
curl http://localhost:8000/api/health
```

## Verificar Logs en Tiempo Real

En otra terminal, ejecuta:
```bash
cd Web/wms-backend
Get-Content storage/logs/laravel.log -Wait -Tail 20
```

O en Linux/Mac:
```bash
tail -f storage/logs/laravel.log
```

## Probar desde el Frontend

1. Inicia el frontend:
```bash
cd web/frontend
npm run dev
```

2. Abre `http://localhost:3000`

3. Deberías ver un indicador en la esquina inferior derecha:
   - ✅ Verde = Backend conectado
   - ❌ Rojo = Error de conexión

4. Abre la consola del navegador (F12) y verifica:
   - Pestaña **Network**: Deberías ver peticiones a `localhost:8000/api/*`
   - Pestaña **Console**: Deberías ver logs de las peticiones API

## Endpoints de Prueba

### Health Check
```
GET http://localhost:8000/api/health
```

### Listar Tareas
```
GET http://localhost:8000/api/tasks
```

### Listar Productos
```
GET http://localhost:8000/api/productos
```

## Verificar en los Logs del Backend

Cada petición API debería aparecer en `storage/logs/laravel.log` con:
- Método HTTP
- URL
- IP del cliente
- Origin (de dónde viene la petición)
- Headers

Ejemplo de log:
```
[2024-01-01 12:00:00] local.INFO: API Request {"method":"GET","url":"http://localhost:8000/api/health","ip":"127.0.0.1","origin":"http://localhost:3000",...}
```

## Solución de Problemas

### No aparecen logs en el backend
- Verifica que el middleware `LogApiRequests` esté registrado
- Verifica permisos de escritura en `storage/logs/`
- Verifica que las rutas API estén registradas en `bootstrap/app.php`

### Error CORS
- Verifica `config/cors.php`
- Asegúrate de que `allowed_origins` incluya `http://localhost:3000`
- Limpia cache: `php artisan config:clear`

### 404 Not Found
- Verifica que las rutas estén en `routes/api.php`
- Verifica que `bootstrap/app.php` tenga `api: __DIR__.'/../routes/api.php'`
- Limpia cache de rutas: `php artisan route:clear`

