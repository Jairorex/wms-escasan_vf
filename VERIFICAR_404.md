# 🔍 Verificación de Error 404

## 📋 Información Necesaria

Para ayudarte mejor, necesito saber:

1. **¿Qué URL está dando 404?**
   - Ejemplo: `https://tu-app.up.railway.app/api/health`
   - O desde el frontend: ¿qué endpoint está fallando?

2. **¿Dónde ocurre el error?**
   - [ ] En Railway (al probar directamente)
   - [ ] Desde el frontend (Vercel/local)
   - [ ] Desde la app móvil

3. **¿Qué mensaje exacto ves?**
   - ¿"404 Not Found"?
   - ¿"Failed to load resource"?
   - ¿Algún otro mensaje?

## 🧪 Pruebas Rápidas

### 1. Probar Health Endpoint (Público)

Abre en tu navegador o usa curl:

```
https://tu-app.up.railway.app/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "message": "API is running"
}
```

### 2. Probar Ruta Raíz

```
https://tu-app.up.railway.app/
```

**Respuesta esperada:**
```json
{
  "message": "WMS ESCASAN API",
  "version": "2.0",
  "status": "running"
}
```

### 3. Probar Test Endpoint

```
https://tu-app.up.railway.app/api/test
```

### 4. Verificar desde Frontend

En la consola del navegador (F12), ejecuta:

```javascript
// Probar health
fetch('https://tu-app.up.railway.app/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ Health:', data))
  .catch(err => console.error('❌ Error:', err))
```

## 🔧 Soluciones Comunes

### Si `/api/health` da 404:

1. **Verifica que Railway esté corriendo:**
   - Railway Dashboard → Service → Deployments
   - Verifica que el último deployment sea exitoso

2. **Verifica variables de entorno:**
   - `APP_URL` debe ser: `https://tu-app.up.railway.app`
   - `APP_KEY` debe estar configurado

3. **Limpia cache en Railway:**
   ```bash
   php artisan route:clear
   php artisan config:clear
   php artisan cache:clear
   ```

### Si el Frontend no puede conectar:

1. **Verifica la URL en el frontend:**
   - Variable de entorno: `VITE_API_BASE_URL`
   - Debe ser: `https://tu-app.up.railway.app/api`

2. **Verifica CORS:**
   - En `config/cors.php`, agrega tu URL de frontend

3. **Verifica que el backend esté accesible:**
   - Prueba directamente en el navegador primero

## 📝 Comparte Esta Información

Para diagnosticar mejor, comparte:

1. La URL exacta que está fallando
2. El mensaje de error completo
3. Si funciona `/api/health` o no
4. Los logs de Railway (si es posible)

¡Con esta información podré ayudarte mejor! 🚀

