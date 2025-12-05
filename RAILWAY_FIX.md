# 🔧 Solución de Error en Railway - Dockerfile

## ❌ Error Encontrado

```
failed to calculate checksum of ref: "/Web/wms-backend": not found
MultipleInstructionsDisallowed: Multiple CMD instructions
```

## ✅ Solución Aplicada

### 1. Dockerfile Corregido

El Dockerfile ahora:
- ✅ Copia desde el directorio actual (`.`) en lugar de `Web/wms-backend/`
- ✅ Eliminado el CMD duplicado
- ✅ Usa `${PORT}` que Railway inyecta automáticamente
- ✅ Limpia archivos temporales de apt para reducir tamaño

### 2. Opciones de Despliegue en Railway

Tienes **2 opciones**:

#### Opción A: Usar Dockerfile (Recomendado) ✅

Railway detectará automáticamente el Dockerfile y lo usará.

**Configuración en Railway:**
- **Root Directory:** `Web/wms-backend`
- **Build Command:** (dejar vacío, Railway usará Dockerfile)
- **Start Command:** (dejar vacío, Railway usará CMD del Dockerfile)

#### Opción B: Usar Nixpacks (Sin Dockerfile)

Si prefieres no usar Dockerfile:

1. **Elimina o renombra el Dockerfile:**
   ```bash
   mv Web/wms-backend/Dockerfile Web/wms-backend/Dockerfile.backup
   ```

2. **Configura en Railway:**
   - **Root Directory:** `Web/wms-backend`
   - **Build Command:** `composer install --optimize-autoloader --no-dev`
   - **Start Command:** `php artisan serve --host=0.0.0.0 --port=$PORT`

3. **Actualiza railway.json:**
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "php artisan serve --host=0.0.0.0 --port=$PORT"
     }
   }
   ```

## 🚀 Pasos para Desplegar

### Si usas Dockerfile (Opción A):

1. **Verifica que el Dockerfile esté corregido** (ya lo está)
2. **En Railway Dashboard:**
   - Ve a tu servicio
   - Settings → Service Settings
   - **Root Directory:** `Web/wms-backend`
   - **Build Command:** (dejar vacío)
   - **Start Command:** (dejar vacío)
3. **Variables de entorno:** (ya las tienes configuradas)
4. **Deploy:** Railway detectará el Dockerfile automáticamente

### Si usas Nixpacks (Opción B):

1. **Renombra el Dockerfile:**
   ```bash
   cd Web/wms-backend
   mv Dockerfile Dockerfile.backup
   ```

2. **En Railway Dashboard:**
   - **Root Directory:** `Web/wms-backend`
   - **Build Command:** `composer install --optimize-autoloader --no-dev`
   - **Start Command:** `php artisan serve --host=0.0.0.0 --port=$PORT`

3. **Deploy**

## ⚠️ Importante

- Railway inyecta automáticamente la variable `$PORT`
- No necesitas definir `$PORT` en las variables de entorno
- El puerto se asigna dinámicamente por Railway

## 🔍 Verificar el Despliegue

Después del deploy, prueba:
```
https://tu-app.up.railway.app/api/health
```

Debería responder con:
```json
{
  "status": "ok",
  "message": "API is running"
}
```

## 📝 Notas Adicionales

- El `.dockerignore` ahora excluye archivos innecesarios
- El Dockerfile está optimizado para producción
- Las extensiones de SQL Server están incluidas

¡El error debería estar resuelto! 🎉

