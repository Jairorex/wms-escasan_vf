# 🔧 Solución Error 404 en Railway

## ❌ Problema

Error 404 al intentar acceder a las rutas de la API en Railway.

## 🔍 Posibles Causas

1. **Rutas API no tienen el prefijo `/api`**
2. **Railway no está sirviendo correctamente**
3. **Variables de entorno no configuradas**
4. **Cache de rutas no actualizado**

## ✅ Soluciones

### 1. Verificar que las Rutas API Tengan Prefijo `/api`

En Laravel 11, las rutas en `routes/api.php` automáticamente tienen el prefijo `/api`.

**Verifica en `bootstrap/app.php`:**
```php
->withRouting(
    api: __DIR__.'/../routes/api.php',  // ← Esto agrega automáticamente /api
)
```

### 2. Probar Endpoints Públicos Primero

Prueba estos endpoints que NO requieren autenticación:

```
GET https://tu-app.up.railway.app/api/health
GET https://tu-app.up.railway.app/api/health/simple
GET https://tu-app.up.railway.app/api/test
```

### 3. Verificar Variables de Entorno en Railway

Asegúrate de tener estas variables:

```env
APP_URL=https://tu-app.up.railway.app
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:TU_APP_KEY_AQUI
```

### 4. Limpiar Cache de Rutas

En Railway, ejecuta estos comandos en la terminal:

```bash
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan route:cache
php artisan config:cache
```

### 5. Verificar Logs en Railway

1. Ve a Railway Dashboard
2. Click en tu servicio
3. Click en "Logs"
4. Busca errores relacionados con rutas

### 6. Verificar que el Servidor Esté Corriendo

Prueba el endpoint de health:
```bash
curl https://tu-app.up.railway.app/api/health
```

O desde el navegador:
```
https://tu-app.up.railway.app/api/health
```

### 7. Verificar CORS

Si el error es desde el frontend, verifica CORS en `config/cors.php`:

```php
'allowed_origins' => [
    'https://tu-frontend.vercel.app',
    // ... otras URLs
],
```

### 8. Verificar Rutas Específicas

Lista todas las rutas disponibles:

En Railway terminal:
```bash
php artisan route:list
```

O crea un endpoint temporal para listar rutas:

```php
// En routes/api.php (temporalmente)
Route::get('/routes', function() {
    return collect(\Illuminate\Support\Facades\Route::getRoutes())
        ->map(function ($route) {
            return [
                'method' => implode('|', $route->methods()),
                'uri' => $route->uri(),
                'name' => $route->getName(),
            ];
        });
});
```

## 🧪 Pruebas Paso a Paso

### Paso 1: Probar Health Endpoint
```bash
curl https://tu-app.up.railway.app/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "..."
}
```

### Paso 2: Probar Login (si health funciona)
```bash
curl -X POST https://tu-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"password"}'
```

### Paso 3: Verificar desde Frontend

En el navegador, abre la consola (F12) y ejecuta:

```javascript
fetch('https://tu-app.up.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## 🔧 Configuración Adicional

### Si las Rutas No Funcionan con `/api`

Puedes crear un archivo `routes/web.php` temporal para debugging:

```php
Route::get('/test-api', function() {
    return response()->json([
        'message' => 'API is accessible',
        'routes' => \Illuminate\Support\Facades\Route::getRoutes()->count()
    ]);
});
```

Luego prueba:
```
https://tu-app.up.railway.app/test-api
```

## 📝 Checklist de Verificación

- [ ] Health endpoint responde: `/api/health`
- [ ] Variables de entorno configuradas en Railway
- [ ] APP_URL apunta a la URL de Railway
- [ ] Cache de rutas limpiado
- [ ] Logs de Railway revisados
- [ ] CORS configurado correctamente
- [ ] Frontend tiene la URL correcta del backend

## 🆘 Si Nada Funciona

1. **Verifica que Railway esté desplegado correctamente:**
   - Ve a Deployments en Railway
   - Verifica que el último deployment sea exitoso

2. **Revisa los logs completos:**
   - Railway Dashboard → Service → Logs
   - Busca errores de PHP, Laravel, o conexión a BD

3. **Prueba localmente primero:**
   ```bash
   cd Web/wms-backend
   php artisan serve
   # Luego prueba: http://localhost:8000/api/health
   ```

4. **Verifica la conexión a la base de datos:**
   - Si la BD no está conectada, algunas rutas pueden fallar

¿Qué URL específica está dando 404? Compártela para ayudarte mejor.

