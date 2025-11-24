# Instrucciones para Conectar Frontend y Backend

## ⚠️ IMPORTANTE: Ubicación del Backend

El backend debe estar en:
```
C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
```

**NO** uses:
```
C:\Users\jairo\Desktop\WMS-v9\backend\
```

## Pasos para Conectar

### 1. Verificar Ubicación del Backend

Abre PowerShell y ejecuta:
```powershell
cd C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
pwd
```

Deberías ver: `C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend`

### 2. Limpiar Caché

```powershell
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### 3. Verificar Rutas

```powershell
php artisan route:list --path=api/health
```

Deberías ver:
```
GET|HEAD  api/health  Api\HealthController@index
```

### 4. Iniciar el Backend

```powershell
php artisan serve
```

Deberías ver:
```
INFO  Server running on [http://127.0.0.1:8000]
```

### 5. Probar el Endpoint

Abre en el navegador:
```
http://localhost:8000/api/health
```

O desde PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/health" | Select-Object -ExpandProperty Content
```

Deberías recibir JSON con `"success": true`

### 6. Iniciar el Frontend

En otra terminal:
```powershell
cd C:\xampp\htdocs\Wms_Propuesta2\web\frontend
npm run dev
```

### 7. Verificar Conexión

1. Abre `http://localhost:3000` en el navegador
2. Deberías ver un indicador en la esquina inferior derecha:
   - ✅ Verde = Backend conectado
   - ❌ Rojo = Error de conexión
3. Abre la consola del navegador (F12) y verifica:
   - Pestaña **Network**: Deberías ver peticiones a `localhost:8000/api/*`
   - Pestaña **Console**: Deberías ver logs de las peticiones

## Solución de Problemas

### Error: "The route api/health could not be found"

**Causa**: Estás ejecutando el backend desde una ubicación incorrecta o el caché está desactualizado.

**Solución**:
1. Asegúrate de estar en `C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend`
2. Ejecuta: `php artisan route:clear && php artisan config:clear`
3. Reinicia el servidor: `php artisan serve`

### Error: 500 Internal Server Error

**Causa**: Error en el código del controlador o en la base de datos.

**Solución**:
1. Revisa los logs: `Get-Content storage\logs\laravel.log -Tail 50`
2. Prueba primero `/api/health` que no requiere BD
3. Luego prueba `/api/test` para verificar tablas

### Error: CORS

**Causa**: El frontend no está en los orígenes permitidos.

**Solución**:
1. Verifica `config/cors.php`
2. Asegúrate de que `allowed_origins` incluya `http://localhost:3000`
3. Limpia caché: `php artisan config:clear`

## Endpoints Disponibles

- `GET /api/health` - Health check (sin BD)
- `GET /api/test` - Verificar tablas y conexión
- `GET /api/tasks` - Listar tareas
- `GET /api/productos` - Listar productos
- `GET /api/ubicaciones` - Listar ubicaciones

## Ver Logs en Tiempo Real

```powershell
Get-Content web\wms-backend\storage\logs\laravel.log -Wait -Tail 20
```

Cada petición del frontend debería aparecer en los logs.

