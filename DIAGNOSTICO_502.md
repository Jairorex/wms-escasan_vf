# 🔍 Diagnóstico Error 502 en Railway

## 📊 Logs que estás viendo:

```
GET / 502 10s
GET /favicon.ico 502 2ms
GET / 502 15s
```

Esto indica que **el servidor no está iniciando correctamente**.

## 🔧 Pasos Inmediatos

### 1. Verificar Logs Completos en Railway

1. Ve a **Railway Dashboard**
2. Click en tu servicio
3. Click en **"Logs"** (no solo "Deployments")
4. Busca errores al inicio del servidor

**Busca estos errores comunes:**
- `APP_KEY is not set`
- `Class not found`
- `SQLSTATE` (errores de BD)
- `Permission denied`
- `php: command not found`

### 2. Verificar Variables de Entorno

En Railway → Variables, asegúrate de tener:

```env
APP_KEY=base64:TU_CLAVE_AQUI  # ← CRÍTICO
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-app.up.railway.app
```

**Si no tienes APP_KEY:**

1. Genera uno localmente:
   ```bash
   cd Web/wms-backend
   php artisan key:generate --show
   ```

2. Copia el resultado (empieza con `base64:`)

3. Agrégalo en Railway como variable `APP_KEY`

### 3. Verificar que el Build Sea Exitoso

En Railway → Deployments:
- ✅ El último deployment debe estar **"Active"**
- ✅ El estado debe ser **"Success"**
- ❌ Si hay errores, compártelos

### 4. Probar el Servidor Manualmente

En Railway, abre la terminal del servicio y ejecuta:

```bash
php artisan serve --host=0.0.0.0 --port=$PORT
```

Si hay errores, los verás directamente.

### 5. Verificar que las Extensiones PHP Estén Instaladas

En Railway terminal:

```bash
php -m | grep sqlsrv
```

Deberías ver:
```
pdo_sqlsrv
sqlsrv
```

## 🚨 Errores Comunes y Soluciones

### Error: "APP_KEY is not set"

**Solución:**
1. Genera APP_KEY: `php artisan key:generate --show`
2. Agrégalo en Railway como variable de entorno

### Error: "Class not found"

**Solución:**
```bash
composer dump-autoload
```

### Error: "SQLSTATE" (Base de datos)

**Solución:**
- Verifica variables de BD en Railway
- Verifica firewall de Azure SQL
- Verifica credenciales

### Error: "Permission denied"

**Solución:**
El Dockerfile ya crea los directorios con permisos correctos, pero si persiste:
```bash
chmod -R 775 storage bootstrap/cache
```

## 📝 Checklist de Verificación

- [ ] **APP_KEY** está configurado en Railway
- [ ] **Variables de BD** están configuradas
- [ ] **El build** en Railway es exitoso
- [ ] **Los logs** no muestran errores fatales
- [ ] **El script start.sh** está en el repositorio
- [ ] **El Dockerfile** está actualizado

## 🔄 Próximos Pasos

1. **Revisa los logs completos** en Railway (no solo los de HTTP)
2. **Verifica APP_KEY** - este es el error más común
3. **Comparte los logs** si el problema persiste

## 💡 Nota

El script `start.sh` ahora:
- ✅ Verifica APP_KEY y lo genera si falta
- ✅ Limpia cache antes de iniciar
- ✅ Verifica permisos de storage
- ✅ Muestra mensajes informativos
- ✅ Usa `exec` para que el proceso principal sea el servidor

**¿Puedes compartir los logs completos de Railway?** Especialmente los que aparecen cuando el contenedor inicia.

