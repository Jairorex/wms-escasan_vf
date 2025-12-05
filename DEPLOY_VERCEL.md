# 🚀 Desplegar Frontend en Vercel

## 📋 Requisitos Previos

1. ✅ Backend desplegado en Railway (ya completado)
2. ✅ Cuenta de Vercel (gratis en https://vercel.com)
3. ✅ Código del frontend en GitHub

## 🔧 Paso 1: Preparar el Proyecto

### 1.1 Verificar package.json

Asegúrate de que `Web/frontend/package.json` tenga un script de build:

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  }
}
```

### 1.2 Verificar vite.config.js

Asegúrate de que `Web/frontend/vite.config.js` esté configurado correctamente.

## 📤 Paso 2: Conectar con Vercel

### Opción A: Desde Vercel Dashboard (Recomendado)

1. **Ve a Vercel:**
   - https://vercel.com
   - Inicia sesión con GitHub

2. **Importar Proyecto:**
   - Click en **"Add New..."** → **"Project"**
   - Selecciona tu repositorio: `wms-escasan_vf`
   - Click en **"Import"**

3. **Configurar el Proyecto:**
   - **Framework Preset:** Vite
   - **Root Directory:** `Web/frontend`
   - **Build Command:** `npm run build` (o `yarn build`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install` (o `yarn install`)

4. **Variables de Entorno:**
   - Click en **"Environment Variables"**
   - Agrega:
     ```
     VITE_API_BASE_URL=https://wms-escasanvf-production.up.railway.app/api
     ```
   - Click en **"Add"**

5. **Deploy:**
   - Click en **"Deploy"**
   - Espera a que termine el build

### Opción B: Desde CLI

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Iniciar sesión:**
   ```bash
   vercel login
   ```

3. **Navegar al directorio del frontend:**
   ```bash
   cd Web/frontend
   ```

4. **Desplegar:**
   ```bash
   vercel
   ```

5. **Seguir las instrucciones:**
   - ¿Set up and deploy? **Y**
   - ¿Which scope? (selecciona tu cuenta)
   - ¿Link to existing project? **N**
   - ¿What's your project's name? `wms-escasan-frontend`
   - ¿In which directory is your code located? `./`
   - ¿Want to override the settings? **Y**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Development Command:** `npm run dev`

6. **Configurar variables de entorno:**
   ```bash
   vercel env add VITE_API_BASE_URL
   # Ingresa: https://wms-escasanvf-production.up.railway.app/api
   ```

7. **Redeploy con las variables:**
   ```bash
   vercel --prod
   ```

## ⚙️ Paso 3: Configurar Variables de Entorno

### Variables Necesarias:

```
VITE_API_BASE_URL=https://wms-escasanvf-production.up.railway.app/api
```

### Cómo Agregarlas en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Click en **"Settings"** → **"Environment Variables"**
3. Agrega:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://wms-escasanvf-production.up.railway.app/api`
   - **Environment:** Production, Preview, Development (marca todas)
4. Click en **"Save"**
5. **Redeploy** el proyecto para que tome las nuevas variables

## 🔄 Paso 4: Configurar CORS en el Backend

Asegúrate de que el backend permita conexiones desde Vercel:

### En `Web/wms-backend/config/cors.php`:

```php
'allowed_origins' => [
    'https://tu-proyecto.vercel.app',
    'https://*.vercel.app', // Para previews
    'http://localhost:3000', // Para desarrollo local
],
```

O si quieres permitir todos los orígenes de Vercel:

```php
'allowed_origins' => [
    env('FRONTEND_URL', 'https://tu-proyecto.vercel.app'),
],
```

Y agrega en Railway:
```
FRONTEND_URL=https://tu-proyecto.vercel.app
```

## 📝 Paso 5: Verificar el Deploy

1. **Espera a que termine el build** en Vercel Dashboard

2. **Prueba la URL:**
   ```
   https://tu-proyecto.vercel.app
   ```

3. **Verifica la consola del navegador:**
   - Abre DevTools (F12)
   - Ve a la pestaña "Console"
   - Verifica que no haya errores de conexión al API

4. **Prueba el login:**
   - Intenta hacer login
   - Verifica que las peticiones al API funcionen

## 🔧 Configuración Avanzada

### vercel.json (Opcional)

Crea `Web/frontend/vercel.json` para configuración personalizada:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Configurar Dominio Personalizado (Opcional)

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS

## 🐛 Solución de Problemas

### Error: "Module not found"

**Solución:**
- Verifica que `package.json` tenga todas las dependencias
- Asegúrate de que `npm install` se ejecute correctamente

### Error: "API_BASE_URL is not defined"

**Solución:**
- Verifica que la variable de entorno esté configurada en Vercel
- Asegúrate de que el nombre sea `VITE_API_BASE_URL` (con prefijo `VITE_`)
- Redeploy después de agregar variables

### Error: CORS

**Solución:**
- Verifica que `config/cors.php` en el backend permita tu dominio de Vercel
- Agrega `https://tu-proyecto.vercel.app` a `allowed_origins`

### Build Falla

**Solución:**
- Revisa los logs de build en Vercel Dashboard
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que el comando de build sea correcto

## 📊 Monitoreo

Vercel proporciona:
- **Analytics:** Estadísticas de tráfico
- **Logs:** Logs de errores y requests
- **Deployments:** Historial de deploys
- **Performance:** Métricas de rendimiento

## ✅ Checklist Final

- [ ] Proyecto conectado a Vercel
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] CORS configurado en backend
- [ ] Frontend accesible en Vercel
- [ ] Login funcionando
- [ ] API conectada correctamente

## 🎉 ¡Listo!

Una vez completado, tu frontend estará disponible en:
```
https://tu-proyecto.vercel.app
```

Y se conectará automáticamente al backend en Railway.

## 📚 Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Vite + Vercel](https://vercel.com/guides/deploying-vite-with-vercel)
- [Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

