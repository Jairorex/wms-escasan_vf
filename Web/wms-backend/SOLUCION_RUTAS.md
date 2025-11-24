# Solución: Error "The route api/health could not be found"

## Problema

El error indica que la ruta `api/health` no se encuentra:
```
"The route api/health could not be found."
```

## Verificaciones

### 1. Verificar que estás en el directorio correcto

El backend debe estar en:
```
C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
```

**NO** en:
```
C:\Users\jairo\Desktop\WMS-v9\backend\
```

### 2. Limpiar caché de rutas

```bash
cd web/wms-backend
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### 3. Verificar que las rutas estén registradas

```bash
php artisan route:list --path=api/health
```

Deberías ver:
```
GET|HEAD  api/health  Api\HealthController@index
```

### 4. Verificar bootstrap/app.php

Asegúrate de que tenga:
```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',  // ← Esta línea es importante
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

### 5. Verificar routes/api.php

Asegúrate de que tenga:
```php
Route::get('/health', [\App\Http\Controllers\Api\HealthController::class, 'index']);
```

### 6. Verificar que el servidor esté corriendo desde el directorio correcto

```bash
cd web/wms-backend
php artisan serve
```

Deberías ver:
```
INFO  Server running on [http://127.0.0.1:8000]
```

### 7. Probar el endpoint

Abre en el navegador:
```
http://localhost:8000/api/health
```

O desde PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/health" | Select-Object -ExpandProperty Content
```

## Si el problema persiste

1. **Verifica que estés ejecutando el backend correcto**
   - El error muestra una ruta diferente (`C:\Users\jairo\Desktop\WMS-v9\backend\`)
   - Asegúrate de estar en `C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend`

2. **Reinicia el servidor**
   ```bash
   # Detén el servidor (Ctrl+C)
   # Luego inícialo de nuevo
   php artisan serve
   ```

3. **Verifica los logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

4. **Ejecuta el script de verificación**
   ```bash
   php verificar_rutas.php
   ```

## Solución Rápida

```bash
# 1. Ve al directorio correcto
cd C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend

# 2. Limpia todo el caché
php artisan route:clear
php artisan config:clear
php artisan cache:clear

# 3. Reinicia el servidor
php artisan serve
```

Luego prueba: `http://localhost:8000/api/health`

