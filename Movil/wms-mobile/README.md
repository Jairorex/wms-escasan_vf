# WMS Mobile App

Aplicación móvil para el Sistema de Gestión de Almacén (WMS) desarrollada con React Native y Expo.

## 📱 Características

### Pantallas Implementadas

#### ✅ Alta Prioridad
1. **Login** - Autenticación de usuarios
2. **Dashboard** - Resumen de tareas y KPIs
3. **Lista de Tareas** - Ver tareas asignadas con filtros
4. **Detalle de Tarea** - Ver detalles y gestionar tareas
5. **Escáner Universal** - Escanear códigos de barras/QR con validación

#### ✅ Media Prioridad
6. **Consulta de Inventario** - Ver stock disponible
7. **Detalle de Producto** - Ver información de productos
8. **Búsqueda de Ubicación** - Buscar ubicaciones de productos
9. **Asignación de Tareas** - Solo Supervisor/Admin
10. **Gestión de Operarios** - Solo Supervisor/Admin
11. **Estadísticas/KPIs** - Solo Supervisor/Admin
12. **Notificaciones** - Ver y gestionar alertas

#### ✅ Baja Prioridad
13. **Perfil de Usuario** - Ver y editar perfil
14. **Configuración** - Cambiar contraseña
15. **Historial de Movimientos** - Ver movimientos registrados

## 🚀 Instalación

```bash
cd Movil/wms-mobile
npm install
```

## 🏃 Ejecutar

```bash
# Iniciar Expo
npm start

# Android
npm run android

# iOS
npm run ios
```

## ⚙️ Configuración

### API Base URL

Edita `src/api/axiosClient.js` y cambia la `BASE_URL`:

```javascript
// Para emulador Android
const BASE_URL = 'http://10.0.2.2:8000/api';

// Para dispositivo físico (usa tu IP local)
const BASE_URL = 'http://192.168.1.2:8000/api';
```

## 🔐 Roles y Permisos

- **Operario**: Acceso a tareas, inventario, escáner, notificaciones
- **Supervisor**: Todo lo del operario + asignación de tareas, gestión de operarios, estadísticas
- **Administrador**: Acceso completo a todas las funcionalidades

## 📦 Dependencias Principales

- React Native
- Expo
- React Navigation
- Axios
- Expo Camera
- AsyncStorage
- Lucide React Native

## 🎨 Estructura

```
src/
├── api/              # Cliente API
├── components/       # Componentes reutilizables
├── context/         # Context API (Auth)
├── navigation/      # Navegación
├── screens/         # Pantallas
└── utils/           # Utilidades
```

## 📝 Notas

- Las rutas están protegidas por roles
- El token se almacena en AsyncStorage
- El escáner soporta múltiples formatos de códigos
- Las pantallas se actualizan automáticamente con pull-to-refresh
