# Guía de Instalación del Frontend

## Requisitos Previos

- Node.js 18+ y npm
- Backend Laravel corriendo en `http://localhost:8000`

## Instalación

### Paso 1: Instalar Dependencias

```bash
cd web/frontend
npm install
```

### Paso 2: Configurar Variables de Entorno

Crea un archivo `.env`:

```bash
cp .env.example .env
```

Edita `.env` y configura la URL de tu API:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Paso 3: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura de Carpetas

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── pages/          # Páginas de la aplicación
│   ├── services/       # Servicios API
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Punto de entrada
├── public/             # Archivos estáticos
└── package.json        # Dependencias
```

## Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run preview` - Previsualiza build de producción
- `npm run lint` - Ejecuta el linter

## Configuración del Proxy

El archivo `vite.config.js` está configurado para hacer proxy de las peticiones `/api` al backend Laravel en `http://localhost:8000`.

Si tu backend está en otro puerto, ajusta la configuración:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:TU_PUERTO',
      changeOrigin: true,
    }
  }
}
```

## Solución de Problemas

### Error: Cannot find module

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Port 3000 already in use

Cambia el puerto en `vite.config.js`:

```js
server: {
  port: 3001, // O cualquier otro puerto disponible
}
```

### Error: CORS en el backend

Asegúrate de que tu backend Laravel tenga configurado CORS para permitir peticiones desde `http://localhost:3000`.

En `config/cors.php`:

```php
'allowed_origins' => ['http://localhost:3000'],
```

