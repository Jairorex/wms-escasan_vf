# Estructura del Proyecto WMS

## Organización

El proyecto está organizado con el backend en una carpeta separada:

```
Wms_Propuesta2/
├── backend/                    # Componentes del backend
│   ├── app/                    # Aplicación Laravel
│   │   ├── Console/
│   │   │   └── Commands/       # Comandos de consola
│   │   ├── Http/
│   │   │   ├── Controllers/    # Controladores API
│   │   │   └── Requests/      # Validaciones de requests
│   │   ├── Models/             # Modelos Eloquent
│   │   └── Services/           # Servicios de negocio
│   ├── config/                 # Archivos de configuración
│   ├── database/               # Base de datos
│   │   ├── migrations/         # Migraciones
│   │   └── seeders/           # Seeders
│   └── routes/                 # Rutas
│       └── api.php            # Rutas API
│
├── README.md                   # Documentación principal
├── API_EXAMPLES.md            # Ejemplos de uso de API
├── IMPLEMENTACION.md          # Detalles de implementación
├── AJUSTES_BD.md              # Ajustes de base de datos
└── PRUEBA_CONEXION.md         # Guía de pruebas
```

## Componentes del Backend

### `backend/app/`
Contiene toda la lógica de la aplicación:

- **Models/**: Modelos Eloquent para todas las tablas
- **Services/**: Lógica de negocio (SlottingService, InventoryService, TaskEngineService)
- **Http/Controllers/Api/**: Controladores para endpoints API
- **Http/Requests/**: Validaciones de formularios
- **Console/Commands/**: Comandos artisan personalizados

### `backend/database/`
- **migrations/**: Migraciones para crear/modificar tablas
- **seeders/**: Seeders para datos iniciales

### `backend/routes/`
- **api.php**: Definición de todas las rutas API

### `backend/config/`
- Archivos de configuración (ejemplo de database.php)

## Integración con Laravel

Si este backend se integra en un proyecto Laravel completo, necesitarás:

1. **Copiar el contenido de `backend/app/` a `app/`** del proyecto Laravel
2. **Copiar las migraciones** de `backend/database/migrations/` a `database/migrations/`
3. **Copiar las rutas** de `backend/routes/api.php` a `routes/api.php`
4. **Actualizar `composer.json`** para incluir el autoload si es necesario

## Estructura de Namespaces

Todos los componentes mantienen los namespaces estándar de Laravel:

- Modelos: `App\Models\*`
- Controladores: `App\Http\Controllers\Api\*`
- Servicios: `App\Services\*`
- Requests: `App\Http\Requests\*`
- Commands: `App\Console\Commands\*`

## Notas Importantes

- Los namespaces **NO** incluyen "Backend" - son los estándar de Laravel
- Si integras esto en un proyecto Laravel existente, simplemente copia el contenido de `backend/` a la raíz del proyecto Laravel
- Las rutas y configuraciones pueden necesitar ajustes según tu setup de Laravel

