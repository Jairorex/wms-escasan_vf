# 🔧 Solución Error 500 en Railway

## ✅ Progreso

El error cambió de **502** a **500**, lo que significa:
- ✅ El servidor está iniciando correctamente
- ✅ El Dockerfile funciona
- ✅ El entrypoint.sh se ejecuta
- ❌ Hay un error en la aplicación Laravel

## 🔍 Diagnóstico

Un error 500 generalmente indica:
1. **Error de PHP** (sintaxis, clase no encontrada, etc.)
2. **Error de conexión a base de datos**
3. **APP_KEY no configurado correctamente**
4. **Permisos de archivos incorrectos**
5. **Error en rutas o controladores**

## 📋 Pasos para Diagnosticar

### 1. Ver Logs en Railway

**Railway Dashboard → Service → Logs**

Busca:
- Errores de PHP
- `SQLSTATE` (errores de BD)
- `Class not found`
- `APP_KEY is not set`
- Stack traces completos

### 2. Verificar Variables de Entorno

En Railway → Variables, asegúrate de tener:

```env
APP_KEY=base64:TU_CLAVE_AQUI  # ← Debe estar configurado
APP_ENV=production
APP_DEBUG=false  # En producción debe ser false
APP_URL=https://wms-escasanvf-production.up.railway.app

DB_CONNECTION=sqlsrv
DB_HOST=wms-escasan-server.database.windows.net
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=wmsadmin
DB_PASSWORD=Escasan123
```

### 3. Probar Endpoints Específicos

Prueba estos endpoints en orden:

1. **Health simple (no requiere BD):**
   ```
   https://wms-escasanvf-production.up.railway.app/api/health/simple
   ```

2. **Health completo (requiere BD):**
   ```
   https://wms-escasanvf-production.up.railway.app/api/health
   ```

3. **Ruta raíz:**
   ```
   https://wms-escasanvf-production.up.railway.app/
   ```

### 4. Verificar Logs de Laravel

En Railway terminal, ejecuta:

```bash
tail -f storage/logs/laravel.log
```

O si no tienes acceso a terminal, los logs deberían aparecer en Railway Dashboard → Logs.

## 🔧 Soluciones Comunes

### Error: "APP_KEY is not set"

**Solución:**
1. Genera APP_KEY: `php artisan key:generate --show`
2. Agrégalo en Railway como variable `APP_KEY`

### Error: "SQLSTATE" (Base de datos)

**Verifica:**
1. Variables de BD están correctas
2. Firewall de Azure SQL permite IPs de Railway
3. Credenciales son correctas
4. Nombre de BD es correcto

**Para probar conexión:**
```bash
php artisan tinker
DB::connection()->getPdo();
```

### Error: "Class not found"

**Solución:**
```bash
composer dump-autoload
```

### Error: Permisos

**Solución:**
El Dockerfile ya crea los directorios con permisos correctos, pero si persiste:
```bash
chmod -R 775 storage bootstrap/cache
```

## 🧪 Pruebas Rápidas

### 1. Probar Health Simple (sin BD)

```bash
curl https://wms-escasanvf-production.up.railway.app/api/health/simple
```

**Si esto funciona:** El servidor está bien, el problema es con la BD o rutas específicas.

**Si esto falla:** Hay un error más fundamental en Laravel.

### 2. Verificar que APP_KEY esté en .env

En Railway terminal:
```bash
php artisan tinker
config('app.key')
```

Debería mostrar tu APP_KEY.

### 3. Probar una ruta simple

```bash
curl https://wms-escasanvf-production.up.railway.app/api/test
```

## 📝 Checklist

- [ ] **APP_KEY** está configurado en Railway
- [ ] **Variables de BD** están correctas
- [ ] **Firewall de Azure SQL** permite conexiones
- [ ] **Logs de Railway** revisados para errores específicos
- [ ] **Health simple** funciona (no requiere BD)
- [ ] **Health completo** funciona (requiere BD)

## 🆘 Si Nada Funciona

1. **Comparte los logs completos** de Railway (especialmente los errores)
2. **Comparte el error específico** que aparece en el navegador
3. **Verifica que la BD esté accesible** desde Railway

## 💡 Nota

El entrypoint.sh ahora:
- ✅ Verifica APP_KEY y lo genera si falta
- ✅ Limpia todos los caches
- ✅ Verifica conexión a BD (sin fallar)
- ✅ Muestra información de diagnóstico
- ✅ Configura para producción

**¿Puedes compartir los logs completos de Railway?** Especialmente los errores que aparecen cuando haces una petición.

