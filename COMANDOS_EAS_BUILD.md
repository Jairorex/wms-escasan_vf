# 🚀 Comandos Rápidos para EAS Build

## 📋 Pasos para Desplegar la App Móvil

### 1. Instalar EAS CLI (si no lo tienes)

```bash
npm install -g eas-cli
```

### 2. Iniciar Sesión en Expo

```bash
eas login
```

Si no tienes cuenta, créala en: https://expo.dev/signup

### 3. Navegar al Directorio de la App

```bash
cd Movil/wms-mobile
```

### 4. Configurar el Proyecto (solo la primera vez)

```bash
eas build:configure
```

Esto creará/actualizará el archivo `eas.json`.

### 5. Build para Android (APK - Producción)

```bash
eas build --platform android --profile production
```

**Tiempo estimado:** 15-30 minutos

### 6. Build para Android (APK - Preview/Testing)

```bash
eas build --platform android --profile preview
```

### 7. Build para iOS (solo si tienes cuenta de desarrollador)

```bash
eas build --platform ios --profile production
```

**Requisitos:**
- Cuenta de desarrollador de Apple ($99/año)
- Certificados configurados

---

## 📱 Ver Builds

Ver todos tus builds:
```bash
eas build:list
```

Ver detalles de un build específico:
```bash
eas build:view [BUILD_ID]
```

---

## 📥 Descargar APK

Después de que el build termine, EAS te dará un enlace. También puedes descargarlo con:

```bash
eas build:download [BUILD_ID]
```

---

## 🔄 Builds Rápidos (Solo Android)

Para builds más rápidos (pero más grandes):
```bash
eas build --platform android --profile production --local
```

**Nota:** Requiere Android SDK instalado localmente.

---

## 🐛 Solución de Problemas

### Error: "Not logged in"
```bash
eas login
```

### Error: "Project not configured"
```bash
eas build:configure
```

### Error: "Build failed"
Revisa los logs en: https://expo.dev/accounts/[tu-usuario]/projects/wms-escasan/builds

---

## ✅ Checklist Antes de Build

- [ ] URL de API actualizada a producción en `axiosClient.js`
- [ ] `app.json` configurado correctamente
- [ ] Versión de la app actualizada
- [ ] Iconos y splash screen listos
- [ ] Permisos de cámara configurados

---

## 📝 Notas

- **Primera vez:** El build puede tardar más (30-45 min)
- **Builds subsecuentes:** 15-20 min
- **Gratis:** 30 builds/mes
- **Pago:** $29/mes para más builds

---

## 🎯 Comando Completo (Todo en Uno)

```bash
# 1. Instalar EAS
npm install -g eas-cli

# 2. Login
eas login

# 3. Ir al directorio
cd Movil/wms-mobile

# 4. Configurar (solo primera vez)
eas build:configure

# 5. Build Android
eas build --platform android --profile production
```

