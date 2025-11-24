# Frontend WMS

Frontend del Sistema de Gestión de Almacén (WMS) desarrollado con React + Vite.

## Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **React Query** - Gestión de estado del servidor
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   └── Layout/       # Layout principal con sidebar
│   ├── pages/            # Páginas de la aplicación
│   │   ├── Dashboard/   # Dashboard principal
│   │   ├── Tareas/      # Gestión de tareas
│   │   ├── Inventario/  # Consulta de inventario
│   │   ├── Recepcion/   # Recepción de mercancía
│   │   ├── Alertas/     # Sistema de alertas
│   │   └── Login/       # Página de login
│   ├── services/         # Servicios API
│   │   └── api.js       # Cliente API
│   ├── App.jsx          # Componente principal
│   └── main.jsx         # Punto de entrada
├── public/               # Archivos estáticos
├── index.html           # HTML principal
└── package.json        # Dependencias
```

## Instalación

```bash
cd web/frontend
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

## Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Ajusta la URL según la ubicación de tu backend Laravel.

## Características

### Páginas Implementadas

1. **Dashboard** - Vista general con estadísticas y tareas recientes
2. **Tareas** - Lista y gestión de tareas (PUTAWAY, PICK, etc.)
3. **Inventario** - Consulta de stock disponible
4. **Recepción** - Formulario para recibir mercancía
5. **Alertas** - Sistema de alertas del WMS
6. **Login** - Autenticación (pendiente de implementar)

### Funcionalidades

- ✅ Interfaz moderna y responsive
- ✅ Integración con API del backend
- ✅ Gestión de estado con React Query
- ✅ Navegación con React Router
- ✅ Diseño con Tailwind CSS
- ⏳ Autenticación (pendiente)
- ⏳ Endpoints de Alertas e Inventario (pendiente en backend)

## Próximos Pasos

1. Implementar autenticación completa
2. Agregar más endpoints en el backend
3. Implementar validación de escaneos en tiempo real
4. Agregar gráficos y reportes
5. Implementar notificaciones en tiempo real

