# 🚂 Despliegue en Railway - Backend Laravel

## 📋 Configuración en Railway

### 1. Variables de Entorno Necesarias

En Railway, ve a tu proyecto → Variables y agrega:

```env
APP_NAME=WMS_ESCASAN
APP_ENV=production
APP_KEY=base64:TU_APP_KEY_AQUI
APP_DEBUG=false
APP_URL=https://tu-app.railway.app

DB_CONNECTION=sqlsrv
DB_HOST=tu-servidor-azure.database.windows.net
DB_PORT=1433
DB_DATABASE=WMS_ESCASAN_VF
DB_USERNAME=tu-usuario
DB_PASSWORD=tu-password

LOG_CHANNEL=stack
LOG_LEVEL=error

CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app,exp://192.168.*.*:*
```

### 2. Comandos de Build y Start

#### Build Command:
```bash
composer install --optimize-autoloader --no-dev
```

#### Start Command:
```bash
php artisan serve --host=0.0.0.0 --port=$PORT
```

### 3. Root Directory

Asegúrate de configurar el **Root Directory** en Railway:
```
Web/wms-backend
```

### 4. Generar APP_KEY

Si no tienes APP_KEY, genera uno:

**Opción A: Desde tu máquina local**
```bash
cd Web/wms-backend
php artisan key:generate --show
```
Copia el resultado y agrégalo como variable de entorno `APP_KEY` en Railway.

**Opción B: Desde Railway (usando Railway CLI)**
```bash
railway run php artisan key:generate --show
```

### 5. Ejecutar Migraciones

**Opción A: Desde Railway Dashboard**
1. Ve a tu servicio
2. Click en "Deployments"
3. Click en el deployment más reciente
4. Abre la terminal
5. Ejecuta:
```bash
php artisan migrate --force
```

**Opción B: Desde Railway CLI**
```bash
railway run php artisan migrate --force
```

**Opción C: Desde tu máquina local (conectado a Railway)**
```bash
railway connect
railway run php artisan migrate --force
```

### 6. Verificar el Despliegue

1. Railway te dará una URL como: `https://tu-app.up.railway.app`
2. Prueba el endpoint de health:
   ```
   https://tu-app.up.railway.app/api/health
   ```
3. Debería responder con un JSON indicando que el servicio está funcionando.

## 🔧 Configuración Adicional

### Cache de Configuración (Opcional pero Recomendado)

Después del primer despliegue, ejecuta:

```bash
railway run php artisan config:cache
railway run php artisan route:cache
railway run php artisan view:cache
```

### Verificar Logs

En Railway Dashboard:
1. Ve a tu servicio
2. Click en "Logs"
3. Revisa los logs en tiempo real

## ⚠️ Problemas Comunes

### Error: "APP_KEY is not set"
- Genera y agrega la variable `APP_KEY` en Railway

### Error: "Database connection failed"
- Verifica que las variables de entorno de la base de datos estén correctas
- Verifica que el firewall de Azure SQL permita las IPs de Railway
- Railway usa IPs dinámicas, considera permitir todas las IPs de Azure o usar un túnel

### Error: "Port already in use"
- Railway asigna el puerto automáticamente con `$PORT`
- Asegúrate de usar `--port=$PORT` en el start command

### Error: "Class not found"
- Ejecuta `composer install` nuevamente
- Verifica que el build command incluya `--optimize-autoloader`

## 📝 Checklist de Despliegue

- [ ] Variables de entorno configuradas
- [ ] Root Directory configurado: `Web/wms-backend`
- [ ] Build Command configurado
- [ ] Start Command configurado
- [ ] APP_KEY generado y configurado
- [ ] Base de datos creada en Azure SQL
- [ ] Firewall de Azure SQL configurado
- [ ] Migraciones ejecutadas
- [ ] Endpoint de health funcionando
- [ ] CORS configurado correctamente

## 🎯 URLs Importantes

- **Railway Dashboard:** https://railway.app
- **Tu API:** `https://tu-app.up.railway.app`
- **Health Check:** `https://tu-app.up.railway.app/api/health`

¡Listo! Tu backend debería estar funcionando en Railway. 🚀

