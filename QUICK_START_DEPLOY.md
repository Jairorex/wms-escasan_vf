# 🚀 Inicio Rápido - Despliegue WMS ESCASAN

## Opción Rápida (Recomendada para empezar)

### 1️⃣ Backend en Railway (5 minutos)

1. Ve a [railway.app](https://railway.app) y crea cuenta
2. Click en "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio `wms-escasan_vf`
4. Railway detectará Laravel automáticamente
5. Agrega una base de datos PostgreSQL:
   - Click en "New" → "Database" → "PostgreSQL"
6. Configura variables de entorno:
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=(ejecuta: php artisan key:generate --show)
   DB_CONNECTION=pgsql
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_DATABASE=${{Postgres.PGDATABASE}}
   DB_USERNAME=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```
7. Railway desplegará automáticamente
8. Copia la URL de tu API (ej: `https://wms-api.railway.app`)

### 2️⃣ Frontend en Vercel (3 minutos)

1. Ve a [vercel.com](https://vercel.com) y crea cuenta
2. Click en "Add New" → "Project"
3. Importa tu repositorio de GitHub
4. Configura:
   - **Framework Preset:** Vite
   - **Root Directory:** `Web/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Agrega variable de entorno:
   ```
   VITE_API_BASE_URL=https://tu-backend-url.railway.app/api
   ```
6. Click "Deploy"
7. Copia la URL de tu frontend (ej: `https://wms-escasan.vercel.app`)

### 3️⃣ App Móvil con EAS (10 minutos)

1. Instala EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login:
   ```bash
   eas login
   ```

3. Configura el proyecto:
   ```bash
   cd Movil/wms-mobile
   eas build:configure
   ```

4. Actualiza `app.json` con:
   ```json
   {
     "expo": {
       "name": "WMS ESCASAN",
       "slug": "wms-escasan",
       "extra": {
         "apiUrl": "https://tu-backend-url.railway.app/api"
       }
     }
   }
   ```

5. Crea archivo `.env`:
   ```
   EXPO_PUBLIC_API_URL=https://tu-backend-url.railway.app/api
   ```

6. Build para Android:
   ```bash
   eas build --platform android --profile production
   ```

7. Descarga el APK cuando termine el build

### 4️⃣ Configurar CORS en Backend

En Railway, agrega esta variable de entorno:
```
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app,exp://192.168.*.*:*
```

O edita `Web/wms-backend/config/cors.php`:
```php
'allowed_origins' => [
    'https://tu-frontend.vercel.app',
    'exp://192.168.*.*:*',
],
```

---

## ✅ Verificación

1. **Backend:** Visita `https://tu-backend.railway.app/api/tasks` (debe responder JSON)
2. **Frontend:** Visita `https://tu-frontend.vercel.app` (debe cargar la app)
3. **App:** Instala el APK en tu dispositivo Android y prueba

---

## 💰 Costos

- **Railway:** $5/mes (con crédito gratuito inicial)
- **Vercel:** Gratis (hasta cierto límite)
- **EAS:** Gratis para builds (pago solo para distribución en stores)

**Total estimado: $5/mes** para empezar

---

## 🔄 Actualizaciones Automáticas

Ambos servicios (Railway y Vercel) se actualizan automáticamente cuando haces push a GitHub en la rama `main`.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Railway/Vercel
2. Verifica las variables de entorno
3. Revisa `DEPLOYMENT_GUIDE.md` para más detalles

