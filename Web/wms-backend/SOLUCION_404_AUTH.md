# Solución: Error 404 en /api/auth/login

## 🔍 Problema

El error indica que la ruta `api/auth/login` no se encuentra:
```
POST http://localhost:8000/api/auth/login 404 (Not Found)
The route api/auth/login could not be found.
```

## ✅ Solución Aplicada

Se cambió la definición de rutas de autenticación de usar `Route::prefix()` a rutas directas para evitar problemas de carga.

**Antes:**
```php
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    // ...
});
```

**Después:**
```php
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
```

## 🔧 Pasos para Verificar

1. **Limpiar caché de rutas:**
   ```bash
   cd web\wms-backend
   php artisan route:clear
   php artisan config:clear
   php artisan cache:clear
   ```

2. **Verificar que las rutas estén registradas:**
   ```bash
   php artisan route:list | findstr auth
   ```

   Deberías ver:
   ```
   POST   api/auth/login
   POST   api/auth/logout
   GET    api/auth/me
   POST   api/auth/change-password
   ```

3. **Reiniciar el servidor:**
   ```bash
   # Detener el servidor actual (Ctrl+C)
   # Luego iniciar de nuevo:
   php artisan serve
   ```

4. **Verificar que el servidor esté corriendo desde el directorio correcto:**
   - ✅ Correcto: `C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend`
   - ❌ Incorrecto: `C:\xampp\htdocs\Wms_Propuesta2\Web\wms-backend` (con mayúscula)

## 🧪 Probar la Ruta

### Desde el Navegador
```
http://localhost:8000/api/auth/login
```
(Debería retornar un error de método, no 404)

### Desde PowerShell
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"usuario":"admin","password":"admin123"}'
```

### Desde curl
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"usuario\":\"admin\",\"password\":\"admin123\"}"
```

## ⚠️ Nota Importante

Si el error persiste, verifica que:

1. **El servidor esté corriendo desde el directorio correcto:**
   ```bash
   cd C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
   php artisan serve
   ```

2. **No haya otro servidor corriendo desde otro directorio:**
   - Revisa todas las terminales abiertas
   - Detén cualquier servidor que esté corriendo desde `Web\wms-backend` (con mayúscula)

3. **El archivo `routes/api.php` esté actualizado:**
   - Verifica que las rutas de autenticación estén definidas correctamente

4. **El controlador `AuthController` exista:**
   - Verifica que `app/Http/Controllers/Api/AuthController.php` exista y tenga el método `login()`

## 📝 Archivos Modificados

- `web/wms-backend/routes/api.php` - Rutas de autenticación cambiadas a formato directo

