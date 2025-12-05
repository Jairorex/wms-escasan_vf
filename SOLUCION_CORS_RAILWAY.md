# 🔧 Solución para Error de CORS en Railway

## ❌ Error

```
Access to XMLHttpRequest at 'https://wms-escasanvf-production.up.railway.app/api/auth/login' 
from origin 'https://wms-escasan-vf.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solución Aplicada

### 1. Configuración de CORS Mejorada

El archivo `config/cors.php` ahora lee las variables de entorno correctamente:
- `CORS_ALLOWED_ORIGINS` - Puede ser una URL o múltiples separadas por coma
- `FRONTEND_URL` - URL del frontend

### 2. Cache de Configuración Deshabilitado

El `entrypoint.sh` ya NO cachea la configuración en producción para permitir que las variables de entorno se lean dinámicamente.

### 3. Variables de Entorno en Railway

Asegúrate de tener estas variables configuradas en Railway:

```env
CORS_ALLOWED_ORIGINS=https://wms-escasan-vf.vercel.app
FRONTEND_URL=https://wms-escasan-vf.vercel.app
```

**IMPORTANTE**: 
- NO incluyas comillas en las variables de entorno en Railway
- Si tienes múltiples URLs, sepáralas por coma: `https://url1.com,https://url2.com`

## 🔄 Pasos para Aplicar la Solución

### 1. Actualizar Variables de Entorno en Railway

1. Ve a tu proyecto en Railway
2. Click en "Variables"
3. Verifica/Actualiza:
   - `CORS_ALLOWED_ORIGINS` = `https://wms-escasan-vf.vercel.app` (sin comillas)
   - `FRONTEND_URL` = `https://wms-escasan-vf.vercel.app` (sin comillas)

### 2. Forzar Nuevo Deploy

Después de actualizar las variables, Railway debería hacer un nuevo deploy automáticamente. Si no:
1. Ve a "Deployments"
2. Click en "Redeploy" en el último deployment

### 3. Verificar que el Cache se Limpió

El `entrypoint.sh` ahora limpia el cache en cada inicio, pero puedes verificar en los logs de Railway que veas:
```
🧹 Limpiando cache...
⚠️  NO se cacheará la configuración para permitir cambios dinámicos de ENV
```

## 🧪 Verificar que Funciona

### Opción 1: Desde el Navegador

1. Abre la consola del navegador (F12)
2. Intenta hacer login desde `https://wms-escasan-vf.vercel.app`
3. No deberías ver errores de CORS

### Opción 2: Desde la Terminal

```bash
curl -X OPTIONS https://wms-escasanvf-production.up.railway.app/api/auth/login \
  -H "Origin: https://wms-escasan-vf.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Deberías ver en los headers de respuesta:
```
Access-Control-Allow-Origin: https://wms-escasan-vf.vercel.app
Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE
```

## ⚠️ Si Aún No Funciona

### 1. Verificar Logs de Railway

Revisa los logs del deployment para ver si hay errores al leer las variables de entorno.

### 2. Verificar que el Middleware de CORS Esté Habilitado

En Laravel 11, el middleware de CORS debería estar habilitado automáticamente. Si no, verifica `bootstrap/app.php`.

### 3. Limpiar Cache Manualmente

Si después de actualizar las variables aún no funciona, puedes forzar la limpieza del cache:

1. En Railway, ve a "Settings" → "Service"
2. Agrega un "Deploy Command" temporal:
   ```bash
   php artisan config:clear && php artisan cache:clear && php artisan route:clear
   ```

### 4. Verificar Formato de Variables

Asegúrate de que las variables NO tengan:
- Comillas dobles al inicio/fin
- Espacios extra
- Caracteres especiales

**Correcto:**
```
CORS_ALLOWED_ORIGINS=https://wms-escasan-vf.vercel.app
```

**Incorrecto:**
```
CORS_ALLOWED_ORIGINS="https://wms-escasan-vf.vercel.app"
CORS_ALLOWED_ORIGINS= https://wms-escasan-vf.vercel.app 
```

## 📝 Notas Adicionales

- El patrón `https://.*\.vercel\.app` en `allowed_origins_patterns` también debería permitir cualquier subdominio de Vercel
- Si usas preview deployments de Vercel, estos también deberían funcionar gracias al patrón
- El cache de configuración está deshabilitado para permitir cambios dinámicos sin necesidad de redeploy

