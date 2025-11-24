# Frontend WMS - Guía Rápida

## Estructura

El frontend está ubicado en `web/frontend/` y está desarrollado con:

- **React 18** + **Vite**
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **React Query** para gestión de estado del servidor

## Instalación Rápida

```bash
cd web/frontend
npm install
npm run dev
```

## Páginas Implementadas

1. **Dashboard** (`/`) - Vista general con estadísticas
2. **Tareas** (`/tareas`) - Gestión de tareas de almacén
3. **Inventario** (`/inventario`) - Consulta de stock
4. **Recepción** (`/recepcion`) - Formulario de recepción
5. **Alertas** (`/alertas`) - Sistema de alertas
6. **Login** (`/login`) - Autenticación

## Configuración

1. Crea `.env` desde `.env.example`
2. Configura `VITE_API_BASE_URL` con la URL de tu backend
3. Asegúrate de que el backend esté corriendo

## Integración con Backend

El frontend consume la API del backend Laravel a través de:
- `src/services/api.js` - Cliente API configurado

Endpoints utilizados:
- `GET /api/tasks` - Listar tareas
- `GET /api/tasks/{id}` - Detalle de tarea
- `POST /api/tasks/validate-scan` - Validar escaneos
- `POST /api/inbound/receive` - Recibir mercancía
- `POST /api/inbound/orden` - Crear orden

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Notas

- El frontend usa React Query v5 (TanStack Query)
- Los estilos están con Tailwind CSS
- El proxy está configurado para desarrollo (Vite)
- La autenticación está pendiente de implementar

