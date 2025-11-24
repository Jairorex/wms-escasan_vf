# Verificación de Conexión Frontend-Backend

## Pasos para Verificar la Conexión

### 1. Verificar que el Backend esté corriendo

```bash
cd Web/wms-backend
php artisan serve
```

El backend debería estar disponible en: `http://localhost:8000`

### 2. Verificar que el Frontend esté corriendo

```bash
cd web/frontend
npm run dev
```

El frontend debería estar disponible en: `http://localhost:3000`

### 3. Probar el Endpoint de Health

Abre en tu navegador o usa curl:

```bash
curl http://localhost:8000/api/health
```

Deberías recibir una respuesta JSON con información del estado del backend.

### 4. Verificar en el Frontend

En el frontend, verás un indicador en la esquina inferior derecha que muestra:
- ✅ **Verde**: Backend conectado correctamente
- ❌ **Rojo**: Error de conexión
- 🔄 **Azul**: Verificando conexión

## Configuración de CORS

El backend está configurado para aceptar peticiones desde:
- `http://localhost:3000` (Vite dev server)
- `http://localhost:5173` (Vite alternativo)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

## Verificar Logs del Backend

Para ver las peticiones que llegan al backend:

```bash
cd Web/wms-backend
tail -f storage/logs/laravel.log
```

O en tiempo real:
```bash
php artisan serve --verbose
```

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

## Solución de Problemas

### Error: CORS
Si ves errores de CORS en la consola del navegador:
1. Verifica que `config/cors.php` esté configurado correctamente
2. Asegúrate de que el frontend esté en uno de los orígenes permitidos
3. Limpia la caché: `php artisan config:clear`

### Error: Connection Refused
- Verifica que el backend esté corriendo en el puerto 8000
- Verifica que no haya firewall bloqueando la conexión
- Prueba acceder directamente a `http://localhost:8000/api/health`

### Error: 404 Not Found
- Verifica que las rutas API estén registradas en `routes/api.php`
- Verifica que el prefijo `/api` esté configurado correctamente

### Error: 500 Internal Server Error
- Revisa los logs en `storage/logs/laravel.log`
- Verifica la conexión a la base de datos
- Verifica que todas las dependencias estén instaladas

## Verificar en la Consola del Navegador

Abre las DevTools (F12) y ve a la pestaña **Network**:
1. Deberías ver peticiones a `http://localhost:8000/api/*`
2. Las peticiones deberían tener status 200 (éxito)
3. Revisa la pestaña **Console** para ver errores de JavaScript

## Prueba Manual desde el Frontend

Abre la consola del navegador (F12) y ejecuta:

```javascript
fetch('http://localhost:8000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Deberías ver la respuesta del backend en la consola.

