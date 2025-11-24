# ⚠️ URGENTE: Reiniciar Servidor para Solucionar Error 404

## 🔴 Problema Crítico

El error 404 en `/api/auth/login` indica que **el servidor está corriendo desde un directorio incorrecto** o necesita reiniciarse.

**El error muestra:**
```
C:\xampp\htdocs\Wms_Propuesta2\Web\wms-backend\...
```
**Con "Web" en MAYÚSCULA**, pero el proyecto está en:
```
C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend\...
```
**Con "web" en minúscula**

## ✅ SOLUCIÓN INMEDIATA

### 1. Detener TODOS los servidores PHP

En **TODAS** las terminales donde esté corriendo `php artisan serve`, presiona:
```
Ctrl + C
```

### 2. Verificar que NO haya otro servidor corriendo

Abre el **Administrador de Tareas** (Ctrl+Shift+Esc) y busca procesos `php.exe`. Si encuentras alguno relacionado con Laravel, termínalo.

### 3. Ir al directorio CORRECTO

```powershell
cd C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend
```

**IMPORTANTE:** 
- ✅ Correcto: `web\wms-backend` (minúscula)
- ❌ Incorrecto: `Web\wms-backend` (mayúscula)

### 4. Limpiar TODOS los cachés

```powershell
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear
```

### 5. Verificar que las rutas estén correctas

```powershell
php artisan route:list | Select-String "auth"
```

**Deberías ver:**
```
POST   api/auth/login
POST   api/auth/logout
GET    api/auth/me
POST   api/auth/change-password
```

Si NO ves estas rutas, hay un problema. Contacta al desarrollador.

### 6. Iniciar el servidor

```powershell
php artisan serve
```

Deberías ver:
```
INFO  Server running on [http://127.0.0.1:8000]
```

### 7. Probar la ruta

Abre en el navegador:
```
http://localhost:8000/api/auth/login
```

O desde PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"usuario":"admin","password":"admin123"}'
```

## 🔍 Verificación Adicional

Si el problema persiste después de reiniciar:

1. **Verifica que el archivo de rutas esté correcto:**
   - Abre: `web\wms-backend\routes\api.php`
   - Debe tener las rutas de autenticación al principio del archivo

2. **Verifica que el controlador exista:**
   - Abre: `web\wms-backend\app\Http\Controllers\Api\AuthController.php`
   - Debe existir y tener el método `login()`

3. **Verifica la configuración del frontend:**
   - Abre: `web\frontend\src\services\api.js`
   - Debe tener `baseURL: 'http://localhost:8000/api'`

## 📝 Nota Final

**El problema más común es que hay un servidor corriendo desde otro directorio.** Asegúrate de:
- Detener TODOS los servidores
- Verificar que NO haya procesos PHP corriendo
- Iniciar el servidor desde el directorio CORRECTO (`web\wms-backend` en minúscula)

