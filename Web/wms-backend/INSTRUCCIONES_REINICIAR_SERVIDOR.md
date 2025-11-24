# Instrucciones: Reiniciar Servidor para Solucionar Error 404

## ⚠️ Problema

El error 404 en `/api/auth/login` puede deberse a que el servidor está corriendo desde un directorio incorrecto o necesita reiniciarse.

## ✅ Solución

### 1. Detener el Servidor Actual

En la terminal donde está corriendo `php artisan serve`, presiona:
```
Ctrl + C
```

### 2. Verificar el Directorio Correcto

Asegúrate de estar en el directorio correcto:
```powershell
cd C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
```

**IMPORTANTE:** 
- ✅ Correcto: `web\wms-backend` (minúscula)
- ❌ Incorrecto: `Web\wms-backend` (mayúscula)

### 3. Limpiar Cachés

```powershell
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### 4. Verificar Rutas

```powershell
php artisan route:list | Select-String "auth"
```

Deberías ver:
```
POST   api/auth/login
POST   api/auth/logout
GET    api/auth/me
POST   api/auth/change-password
```

### 5. Iniciar el Servidor

```powershell
php artisan serve
```

Deberías ver:
```
INFO  Server running on [http://127.0.0.1:8000]
```

### 6. Probar la Ruta

Abre en el navegador o PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"usuario":"admin","password":"admin123"}'
```

O desde el frontend, intenta hacer login nuevamente.

## 🔍 Verificación Adicional

Si el problema persiste:

1. **Verifica que no haya otro servidor corriendo:**
   - Revisa todas las terminales abiertas
   - Busca procesos de PHP en el Administrador de Tareas

2. **Verifica el puerto:**
   - Asegúrate de que el servidor esté corriendo en el puerto 8000
   - Si está en otro puerto, actualiza la URL en el frontend

3. **Verifica la configuración del frontend:**
   - En `web/frontend/src/services/api.js`, verifica que `API_BASE_URL` sea `http://localhost:8000/api`

## 📝 Nota

El error puede indicar que hay un servidor corriendo desde `C:\Users\jairo\Desktop\WMS-v9\backend\` o desde `Web\wms-backend` (con mayúscula). Asegúrate de detener todos los servidores y reiniciar desde el directorio correcto.

