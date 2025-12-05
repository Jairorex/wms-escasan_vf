# 🔧 Solución Error 502 Bad Gateway en Railway

## ❌ Problema

Error **502 Bad Gateway** - El servidor no está respondiendo correctamente.

## 🔍 Causas Comunes

1. **APP_KEY no configurado**
2. **Error de PHP que rompe el servidor**
3. **Base de datos no conectada**
4. **Permisos de storage incorrectos**
5. **Variables de entorno faltantes**

## ✅ Soluciones

### 1. Verificar Variables de Entorno en Railway

**CRÍTICO:** Asegúrate de tener estas variables:

```env
APP_NAME=WMS_ESCASAN
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:TU_APP_KEY_AQUI  # ← MUY IMPORTANTE
APP_URL=https://tu-app.up.railway.app

DB_CONNECTION=sqlsrv
DB_HOST=tu-servidor.database.windows.net
DB_PORT=1433
DB_DATABASE=WMS_ESCASAN_VF
DB_USERNAME=tu-usuario
DB_PASSWORD=tu-password

LOG_CHANNEL=stack
LOG_LEVEL=error
```

### 2. Generar APP_KEY

Si no tienes `APP_KEY`, genera uno:

**Opción A: Desde tu máquina local**
```bash
cd Web/wms-backend
php artisan key:generate --show
```
Copia el resultado y agrégalo como variable `APP_KEY` en Railway.

**Opción B: Desde Railway CLI**
```bash
railway run php artisan key:generate --show
```

### 3. Verificar Logs en Railway

1. Ve a Railway Dashboard
2. Click en tu servicio
3. Click en **"Logs"**
4. Busca errores de PHP o Laravel

**Errores comunes a buscar:**
- `APP_KEY is not set`
- `SQLSTATE` (errores de base de datos)
- `Class not found`
- `Permission denied`

### 4. Verificar que el Servidor Esté Corriendo

En Railway, ve a **Deployments** y verifica:
- ✅ El último deployment debe estar **"Active"**
- ✅ No debe haber errores en el build
- ✅ El estado debe ser **"Success"**

### 5. Probar el Servidor Manualmente

En Railway, abre la terminal del servicio y ejecuta:

```bash
php artisan serve --host=0.0.0.0 --port=$PORT
```

Si hay errores, los verás en la terminal.

### 6. Verificar Permisos de Storage

El Dockerfile ya crea los directorios, pero si hay problemas, ejecuta en Railway:

```bash
mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### 7. Verificar Conexión a Base de Datos

En Railway terminal, ejecuta:

```bash
php artisan tinker
```

Luego en tinker:
```php
DB::connection()->getPdo();
```

Si hay error, la base de datos no está conectada.

### 8. Limpiar Cache

En Railway terminal:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### 9. Verificar que las Extensiones PHP Estén Instaladas

El Dockerfile instala `pdo_sqlsrv` y `sqlsrv`. Verifica en Railway:

```bash
php -m | grep sqlsrv
```

Deberías ver:
```
pdo_sqlsrv
sqlsrv
```

## 🔧 Solución Rápida

### Paso 1: Verificar Variables de Entorno

En Railway → Variables, asegúrate de tener:
- ✅ `APP_KEY` (generado)
- ✅ `APP_URL` (URL de Railway)
- ✅ Variables de BD configuradas

### Paso 2: Revisar Logs

Railway Dashboard → Service → Logs

Busca:
- Errores de PHP
- `APP_KEY is not set`
- Errores de conexión a BD

### Paso 3: Si APP_KEY Falta

1. Genera la clave:
   ```bash
   php artisan key:generate --show
   ```

2. Agrega en Railway como variable:
   ```
   APP_KEY=base64:el-resultado-aqui
   ```

3. Reinicia el servicio en Railway

### Paso 4: Verificar Base de Datos

Si la BD no está conectada, algunas rutas pueden fallar. Verifica:
- Firewall de Azure SQL permite IPs de Railway
- Credenciales correctas
- Nombre de base de datos correcto

## 🧪 Pruebas

### 1. Probar Health Endpoint (sin BD)

```
https://tu-app.up.railway.app/api/health/simple
```

Este endpoint NO requiere base de datos, solo verifica que el servidor funcione.

### 2. Probar Ruta Raíz

```
https://tu-app.up.railway.app/
```

Debería responder con JSON.

### 3. Ver Logs en Tiempo Real

Railway Dashboard → Service → Logs

Observa los logs mientras haces una petición.

## 📝 Checklist

- [ ] `APP_KEY` está configurado en Railway
- [ ] `APP_URL` apunta a la URL de Railway
- [ ] Variables de BD están configuradas
- [ ] Firewall de Azure SQL permite conexiones
- [ ] El deployment en Railway es exitoso
- [ ] Logs no muestran errores críticos
- [ ] El servidor está corriendo (verificar en Logs)

## 🆘 Si Nada Funciona

1. **Revisa los logs completos** en Railway
2. **Verifica el último deployment** - ¿fue exitoso?
3. **Prueba localmente primero:**
   ```bash
   cd Web/wms-backend
   php artisan serve
   # Prueba: http://localhost:8000/api/health
   ```

4. **Revisa el Dockerfile** - ¿se está construyendo correctamente?

## 💡 Nota sobre favicon.ico

El error de `/favicon.ico` es normal y no crítico. El navegador lo busca automáticamente. El problema real es el **502**, que indica que el servidor no está respondiendo.

**Comparte los logs de Railway para diagnosticar mejor el problema.**

