# 🔍 Verificar CORS en Railway

## ✅ Cambios Aplicados

1. **Middleware CORS Personalizado**: Creado `HandleCors` middleware que maneja CORS explícitamente
2. **Origen de Vercel Agregado**: `https://wms-escasan-vf.vercel.app` agregado directamente a `allowed_origins`
3. **Patrón de Vercel Corregido**: Patrón `https://.*\\.vercel\\.app` (sin barra al final)
4. **Middleware Registrado**: Middleware agregado a `bootstrap/app.php`

## 🧪 Verificar que Funciona

### 1. Verificar Headers de CORS

Después del deploy en Railway, prueba con curl:

```bash
curl -X OPTIONS https://wms-escasanvf-production.up.railway.app/api/auth/login \
  -H "Origin: https://wms-escasan-vf.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Deberías ver en la respuesta:
```
< Access-Control-Allow-Origin: https://wms-escasan-vf.vercel.app
< Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH
< Access-Control-Allow-Headers: *
```

### 2. Verificar desde el Navegador

1. Abre `https://wms-escasan-vf.vercel.app`
2. Abre la consola del navegador (F12)
3. Intenta hacer login
4. No deberías ver errores de CORS

### 3. Verificar Logs de Railway

Revisa los logs del deployment para verificar que:
- El middleware se está cargando correctamente
- No hay errores de PHP
- Las variables de entorno se están leyendo

## ⚠️ Si Aún No Funciona

### 1. Verificar Variables de Entorno en Railway

Asegúrate de que estas variables estén configuradas (SIN comillas):
```
CORS_ALLOWED_ORIGINS=https://wms-escasan-vf.vercel.app
FRONTEND_URL=https://wms-escasan-vf.vercel.app
```

### 2. Forzar Nuevo Deploy

1. Ve a Railway → Deployments
2. Click en "Redeploy" en el último deployment
3. Espera a que termine el deploy

### 3. Verificar que el Cache se Limpió

En los logs de Railway deberías ver:
```
🧹 Limpiando cache...
⚠️  NO se cacheará la configuración para permitir cambios dinámicos de ENV
```

### 4. Verificar Middleware

El middleware `HandleCors` debería estar registrado en `bootstrap/app.php`:
```php
$middleware->api(prepend: [
    \App\Http\Middleware\HandleCors::class,
]);
```

## 📝 Notas

- El origen `https://wms-escasan-vf.vercel.app` está hardcodeado en `config/cors.php` como fallback
- El patrón `https://.*\\.vercel\\.app` también debería permitir cualquier subdominio de Vercel
- Las variables de entorno se leen dinámicamente (sin cache)

