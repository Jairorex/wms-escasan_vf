# 🚀 Guía de Despliegue - WMS ESCASAN

Esta guía te ayudará a desplegar tu sistema WMS en producción.

## 📋 Índice
1. [Backend (Laravel)](#backend-laravel)
2. [Frontend Web (React)](#frontend-web-react)
3. [App Móvil (Expo)](#app-móvil-expo)

---

## 🔧 Backend (Laravel)

### Opción 1: **Vercel** (Recomendado para APIs)
- ✅ Gratis para proyectos pequeños
- ✅ Despliegue automático desde GitHub
- ✅ SSL incluido
- ⚠️ Limitaciones con SQL Server (mejor usar PostgreSQL/MySQL)

**Pasos:**
1. Instala Vercel CLI: `npm i -g vercel`
2. En el directorio `Web/wms-backend`:
   ```bash
   vercel
   ```
3. Configura variables de entorno en el dashboard de Vercel

### Opción 2: **Railway** (Recomendado)
- ✅ Soporte completo para Laravel
- ✅ Base de datos incluida (PostgreSQL/MySQL)
- ✅ $5/mes con crédito gratuito
- ✅ Despliegue desde GitHub

**Pasos:**
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Selecciona "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Railway detectará Laravel automáticamente
6. Agrega una base de datos PostgreSQL o MySQL
7. Configura variables de entorno:
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=(genera con: php artisan key:generate)
   DB_CONNECTION=pgsql (o mysql)
   DB_HOST=(proporcionado por Railway)
   DB_PORT=5432
   DB_DATABASE=(proporcionado por Railway)
   DB_USERNAME=(proporcionado por Railway)
   DB_PASSWORD=(proporcionado por Railway)
   ```

### Opción 3: **DigitalOcean App Platform**
- ✅ $5/mes
- ✅ Soporte completo Laravel
- ✅ Base de datos incluida
- ✅ Escalable

**Pasos:**
1. Ve a [digitalocean.com](https://www.digitalocean.com)
2. Crea cuenta y ve a "App Platform"
3. Conecta tu repositorio de GitHub
4. Selecciona el directorio `Web/wms-backend`
5. Configura build command: `composer install --optimize-autoloader --no-dev`
6. Configura run command: `php artisan serve --host=0.0.0.0 --port=8080`
7. Agrega base de datos PostgreSQL o MySQL
8. Configura variables de entorno

### Opción 4: **Heroku**
- ✅ Plan gratuito limitado (mejor usar plan de pago)
- ✅ Fácil despliegue
- ✅ Add-ons para base de datos

**Pasos:**
1. Instala Heroku CLI
2. Login: `heroku login`
3. Crea app: `heroku create wms-escasan-api`
4. Agrega buildpack: `heroku buildpacks:set heroku/php`
5. Configura variables: `heroku config:set APP_KEY=$(php artisan key:generate --show)`
6. Push: `git push heroku main`

### Opción 5: **VPS (Vultr, DigitalOcean, Linode)**
- ✅ Control total
- ✅ $5-10/mes
- ✅ Mejor para producción

**Pasos:**
1. Crea un VPS Ubuntu 22.04
2. Conecta por SSH
3. Instala LAMP/LEMP stack
4. Clona tu repositorio
5. Configura Nginx/Apache
6. Configura base de datos
7. Configura SSL con Let's Encrypt

---

## 🌐 Frontend Web (React)

### Opción 1: **Vercel** (Recomendado) ⭐
- ✅ Gratis
- ✅ Despliegue automático desde GitHub
- ✅ SSL incluido
- ✅ CDN global
- ✅ Muy rápido

**Pasos:**
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa tu repositorio
4. Configura:
   - **Framework Preset:** Vite
   - **Root Directory:** `Web/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Agrega variables de entorno:
   ```
   VITE_API_URL=https://tu-backend-url.com/api
   ```
6. Deploy!

### Opción 2: **Netlify**
- ✅ Gratis
- ✅ Similar a Vercel
- ✅ Despliegue automático

**Pasos:**
1. Ve a [netlify.com](https://netlify.com)
2. Conecta GitHub
3. Configura:
   - **Base directory:** `Web/frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Agrega variables de entorno
5. Deploy!

### Opción 3: **GitHub Pages**
- ✅ Gratis
- ✅ Integrado con GitHub
- ⚠️ Solo para sitios estáticos

**Pasos:**
1. En `Web/frontend/vite.config.js`, agrega:
   ```js
   export default {
     base: '/wms-escasan_vf/',
     // ... resto de la config
   }
   ```
2. Crea workflow `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - run: npm ci
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

### Opción 4: **Cloudflare Pages**
- ✅ Gratis
- ✅ CDN global
- ✅ Muy rápido

**Pasos:**
1. Ve a [pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecta GitHub
3. Selecciona repositorio
4. Configura build settings
5. Deploy!

---

## 📱 App Móvil (Expo)

### Opción 1: **Expo Application Services (EAS)** (Recomendado) ⭐
- ✅ Servicio oficial de Expo
- ✅ Builds nativos en la nube
- ✅ Distribución fácil

**Pasos:**

1. **Instala EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login:**
   ```bash
   eas login
   ```

3. **Configura el proyecto:**
   ```bash
   cd Movil/wms-mobile
   eas build:configure
   ```

4. **Crea `eas.json`:**
   ```json
   {
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         },
         "ios": {
           "simulator": true
         }
       },
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```

5. **Actualiza `app.json`:**
   ```json
   {
     "expo": {
       "name": "WMS ESCASAN",
       "slug": "wms-escasan",
       "version": "1.0.0",
       "orientation": "portrait",
       "icon": "./assets/icon.png",
       "userInterfaceStyle": "light",
       "splash": {
         "image": "./assets/splash.png",
         "resizeMode": "contain",
         "backgroundColor": "#009245"
       },
       "assetBundlePatterns": [
         "**/*"
       ],
       "ios": {
         "supportsTablet": true,
         "bundleIdentifier": "com.escasan.wms"
       },
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#009245"
         },
         "package": "com.escasan.wms",
         "permissions": ["CAMERA"]
       },
       "web": {
         "favicon": "./assets/favicon.png"
       },
       "extra": {
         "apiUrl": "https://tu-backend-url.com/api"
       }
     }
   }
   ```

6. **Build para Android:**
   ```bash
   eas build --platform android --profile production
   ```

7. **Build para iOS:**
   ```bash
   eas build --platform ios --profile production
   ```

8. **Distribución:**
   - **Android:** Descarga el APK y distribúyelo
   - **iOS:** Sube a App Store Connect con `eas submit`

### Opción 2: **Expo Go** (Solo para desarrollo/testing)
- ✅ Gratis
- ✅ Rápido para pruebas
- ⚠️ No para producción

**Pasos:**
1. Instala Expo Go en tu dispositivo
2. Ejecuta: `npx expo start`
3. Escanea el QR code

### Opción 3: **Build local**
- ✅ Control total
- ⚠️ Requiere configurar Android Studio / Xcode

**Pasos:**
1. **Android:**
   ```bash
   cd Movil/wms-mobile
   npx expo run:android
   ```

2. **iOS (solo Mac):**
   ```bash
   npx expo run:ios
   ```

---

## 🔗 Configuración de URLs

### 1. Actualizar API URL en Frontend

En `Web/frontend/src/services/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tu-backend-url.com/api'
```

### 2. Actualizar API URL en App Móvil

En `Movil/wms-mobile/src/api/axiosClient.js`:
```javascript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tu-backend-url.com/api'
```

### 3. Configurar CORS en Backend

En `Web/wms-backend/config/cors.php`:
```php
'allowed_origins' => [
    'https://tu-frontend-url.vercel.app',
    'exp://192.168.*.*:*', // Para Expo Go
],
```

---

## 📝 Checklist de Despliegue

### Backend:
- [ ] Variables de entorno configuradas
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` generado
- [ ] Base de datos configurada
- [ ] Migraciones ejecutadas: `php artisan migrate`
- [ ] CORS configurado
- [ ] SSL/HTTPS activado

### Frontend:
- [ ] Build ejecutado: `npm run build`
- [ ] Variables de entorno configuradas
- [ ] API URL actualizada
- [ ] Dominio configurado

### App Móvil:
- [ ] `app.json` configurado
- [ ] API URL actualizada
- [ ] Iconos y splash screen agregados
- [ ] Permisos configurados (cámara, etc.)
- [ ] Build generado
- [ ] Probado en dispositivo real

---

## 🆘 Solución de Problemas

### Backend no responde:
- Verifica logs: `php artisan log:show` o en el dashboard de tu proveedor
- Verifica variables de entorno
- Verifica que la base de datos esté accesible

### Frontend no carga:
- Verifica que el build se haya completado
- Verifica la URL de la API
- Revisa la consola del navegador

### App móvil no conecta:
- Verifica que la API URL sea accesible desde el dispositivo
- Verifica CORS en el backend
- Verifica que uses HTTPS (requerido en producción)

---

## 💡 Recomendaciones

1. **Para empezar rápido:** Vercel (Frontend) + Railway (Backend) + EAS (App)
2. **Para producción:** VPS con control total
3. **Para escalar:** Cloudflare + VPS o servicios gestionados

¿Necesitas ayuda con algún paso específico?

