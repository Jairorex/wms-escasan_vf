# 📱 Guía de Despliegue de la Aplicación Móvil

## 🎯 Opciones de Despliegue

### Opción 1: **EAS Build (Recomendado para Producción)**
- ✅ Builds nativos (APK/IPA)
- ✅ Distribución interna o App Stores
- ✅ Gratis hasta cierto límite, luego $29/mes
- ✅ Builds en la nube

### Opción 2: **Expo Go (Solo para Desarrollo/Testing)**
- ✅ Gratis
- ✅ Rápido para pruebas
- ⚠️ No para producción
- ⚠️ Requiere conexión a internet

---

## 🚀 Despliegue con EAS Build (Producción)

### Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Paso 2: Iniciar Sesión en Expo

```bash
eas login
```

Si no tienes cuenta, créala en: https://expo.dev/signup

### Paso 3: Configurar el Proyecto

```bash
cd Movil/wms-mobile
eas build:configure
```

Esto creará un archivo `eas.json` con la configuración de builds.

### Paso 4: Actualizar `app.json`

Asegúrate de que `app.json` tenga la configuración correcta:

```json
{
  "expo": {
    "name": "WMS ESCASAN",
    "slug": "wms-escasan",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#009245"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.escasan.wms"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundColor": "#009245"
      },
      "package": "com.escasan.wms",
      "permissions": ["CAMERA"]
    },
    "extra": {
      "apiUrl": "https://wms-escasanvf-production.up.railway.app/api"
    }
  }
}
```

### Paso 5: Actualizar la URL de la API

Edita `Movil/wms-mobile/src/api/axiosClient.js` y actualiza la URL base:

```javascript
const API_BASE_URL = 'https://wms-escasanvf-production.up.railway.app/api';
```

### Paso 6: Crear `eas.json` (si no existe)

Crea `Movil/wms-mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
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
      },
      "ios": {
        "bundleIdentifier": "com.escasan.wms"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "service": "google-play"
      },
      "ios": {
        "appleId": "tu-email@ejemplo.com",
        "ascAppId": "tu-app-id"
      }
    }
  }
}
```

### Paso 7: Build para Android (APK)

```bash
cd Movil/wms-mobile
eas build --platform android --profile production
```

Esto:
1. Subirá tu código a Expo
2. Construirá el APK en la nube
3. Te dará un enlace para descargar el APK

**Tiempo estimado:** 15-30 minutos

### Paso 8: Build para iOS (IPA)

```bash
eas build --platform ios --profile production
```

**Nota:** Para iOS necesitas:
- Cuenta de desarrollador de Apple ($99/año)
- Certificados de desarrollo configurados

### Paso 9: Distribuir la App

#### Android (APK):
1. Descarga el APK desde el enlace que te dio EAS
2. Comparte el APK con los usuarios
3. O sube a Google Play Store con `eas submit`

#### iOS (IPA):
1. Descarga el IPA
2. Sube a App Store Connect con `eas submit --platform ios`

---

## 🧪 Despliegue con Expo Go (Solo Testing)

### Paso 1: Iniciar el Servidor de Desarrollo

```bash
cd Movil/wms-mobile
npm start
```

### Paso 2: Escanear el Código QR

1. Instala **Expo Go** en tu teléfono:
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. Escanea el código QR que aparece en la terminal

### Paso 3: Probar la App

La app se cargará en tu teléfono y podrás probarla.

**⚠️ Limitaciones:**
- Requiere conexión a internet
- No es para producción
- Algunas funcionalidades nativas pueden no funcionar

---

## 🔧 Configuración de Variables de Entorno

### Opción 1: Hardcode en `axiosClient.js`

```javascript
const API_BASE_URL = 'https://wms-escasanvf-production.up.railway.app/api';
```

### Opción 2: Usar `expo-constants` (Recomendado)

1. Instala `expo-constants` (ya está instalado):
```bash
npm install expo-constants
```

2. Actualiza `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://wms-escasanvf-production.up.railway.app/api"
    }
  }
}
```

3. Actualiza `axiosClient.js`:
```javascript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api';
```

---

## 📋 Checklist Pre-Despliegue

- [ ] URL de API actualizada a producción
- [ ] `app.json` configurado correctamente
- [ ] Iconos y splash screen listos
- [ ] Permisos de cámara configurados (para escáner)
- [ ] Versión de la app actualizada
- [ ] Bundle identifier/package name configurado
- [ ] CORS configurado en el backend para permitir la app móvil

---

## 🐛 Solución de Problemas

### Error: "No se puede conectar al servidor"
- Verifica que la URL de la API sea correcta
- Verifica que el backend esté funcionando
- Verifica CORS en el backend

### Error: "Camera permission denied"
- Verifica que `permissions: ["CAMERA"]` esté en `app.json`
- En Android, verifica permisos en `AndroidManifest.xml`

### Error: "Build failed"
- Verifica que todas las dependencias estén instaladas
- Verifica que `eas.json` esté configurado correctamente
- Revisa los logs de EAS Build en https://expo.dev

---

## 📱 Distribución Interna (Testing)

### Android (APK):
1. Genera el APK con `eas build --platform android --profile preview`
2. Descarga el APK
3. Comparte el APK con los usuarios
4. Los usuarios deben permitir "Instalar desde fuentes desconocidas"

### iOS (TestFlight):
1. Genera el IPA con `eas build --platform ios --profile production`
2. Sube a TestFlight con `eas submit --platform ios`
3. Invita usuarios desde App Store Connect

---

## 💰 Costos

### EAS Build:
- **Gratis:** 30 builds/mes
- **Pago:** $29/mes para más builds

### Google Play Store:
- **Costo único:** $25 (una vez)

### Apple App Store:
- **Anual:** $99/año

---

## 🔗 Enlaces Útiles

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Expo Dashboard:** https://expo.dev
- **EAS CLI Docs:** https://docs.expo.dev/eas/

---

## ✅ Siguiente Paso

Una vez que tengas el APK/IPA:
1. Prueba la app en dispositivos reales
2. Verifica que la conexión con el backend funcione
3. Distribuye a usuarios de prueba
4. Sube a las tiendas de aplicaciones

