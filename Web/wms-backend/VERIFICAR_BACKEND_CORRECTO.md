# ⚠️ IMPORTANTE: Verificar que estés ejecutando el Backend Correcto

## Problema

El error muestra que estás ejecutando el backend desde:
```
C:\Users\jairo\Desktop\WMS-v9\backend\
```

Pero el proyecto actual está en:
```
C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
```

## Solución

### 1. Detén el servidor actual

Si tienes un servidor corriendo, deténlo con `Ctrl+C` en la terminal donde está corriendo.

### 2. Ve al directorio correcto

```powershell
cd C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
```

### 3. Verifica que estás en el lugar correcto

```powershell
pwd
# Debería mostrar: C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend

# Verifica que existan estos archivos:
Test-Path routes\api.php
Test-Path app\Http\Controllers\Api\HealthController.php
```

Ambos deberían retornar `True`.

### 4. Verifica que las rutas estén registradas

```powershell
php artisan route:list --path=api/health
```

Deberías ver:
```
GET|HEAD  api/health  Api\HealthController@index
```

### 5. Limpia el caché

```powershell
php artisan route:clear
php artisan config:clear
```

### 6. Inicia el servidor desde el directorio correcto

```powershell
php artisan serve
```

Deberías ver:
```
INFO  Server running on [http://127.0.0.1:8000]
```

### 7. Prueba el endpoint

Abre en el navegador:
```
http://localhost:8000/api/health
```

O desde PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/health"
```

## Verificación Rápida

Ejecuta este comando para verificar todo:

```powershell
cd C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Cyan
Write-Host "`nVerificando archivos..." -ForegroundColor Yellow
Write-Host "routes\api.php: $(Test-Path routes\api.php)" -ForegroundColor $(if (Test-Path routes\api.php) { 'Green' } else { 'Red' })
Write-Host "HealthController: $(Test-Path app\Http\Controllers\Api\HealthController.php)" -ForegroundColor $(if (Test-Path app\Http\Controllers\Api\HealthController.php) { 'Green' } else { 'Red' })
Write-Host "`nRutas registradas:" -ForegroundColor Yellow
php artisan route:list --path=api/health
```

## Si el problema persiste

1. **Verifica que no tengas múltiples servidores corriendo**
   - Cierra todas las terminales con `php artisan serve`
   - Inicia solo uno desde el directorio correcto

2. **Verifica el puerto**
   - Asegúrate de que el puerto 8000 esté libre
   - O usa otro puerto: `php artisan serve --port=8001`

3. **Revisa los logs**
   ```powershell
   Get-Content storage\logs\laravel.log -Tail 20
   ```

## Nota Importante

**NO** ejecutes el backend desde:
- `C:\Users\jairo\Desktop\WMS-v9\backend\` ❌

**SÍ** ejecuta el backend desde:
- `C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend` ✅

