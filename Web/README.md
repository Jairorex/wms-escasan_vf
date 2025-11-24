# Backend WMS

Este directorio contiene todos los componentes del backend del sistema WMS.

## Contenido

- **app/**: Lógica de la aplicación (Modelos, Controladores, Servicios, Commands)
- **database/**: Migraciones y seeders
- **routes/**: Definición de rutas API
- **config/**: Archivos de configuración
- **composer.json**: Dependencias del proyecto

## Integración con Laravel

Ver los archivos:
- **`INTEGRACION_LARAVEL.md`** - Guía completa de integración
- **`COMANDOS_INTEGRACION.md`** - Comandos listos para copiar/pegar

### ⚠️ IMPORTANTE

Los comandos de integración deben ejecutarse desde la **raíz de tu proyecto Laravel**, NO desde dentro de `backend/`.

### Resumen Rápido (PowerShell)

**Opción 1: Integrar en proyecto existente**
```powershell
# Desde tu-proyecto-laravel/
$backendPath = "C:\xampp\htdocs\Wms_Propuesta2\backend"
Copy-Item -Path "$backendPath\app\*" -Destination "app\" -Recurse -Force
Copy-Item -Path "$backendPath\database\migrations\*" -Destination "database\migrations\" -Recurse -Force
```

**Opción 2: Proyecto standalone**
```powershell
# Desde wms-backend/ (después de crear proyecto Laravel)
composer install
composer require doctrine/dbal
```

## Instalación de Dependencias

Si estás usando este backend como proyecto independiente:

```bash
composer install
```

Dependencias principales:
- Laravel Framework
- Doctrine DBAL (para SQL Server)
- Microsoft Azure Storage (opcional)

## Namespaces

Todos los componentes usan namespaces estándar de Laravel:
- `App\Models\*`
- `App\Services\*`
- `App\Http\Controllers\Api\*`
- `App\Console\Commands\*`

No incluyen "Backend" en el namespace, ya que están diseñados para integrarse directamente en un proyecto Laravel.

## Comandos Disponibles

Una vez integrado en Laravel:

```bash
php artisan wms:test-connection    # Probar conexión BD
php artisan wms:check-expiry       # Revisar vencimientos
php artisan wms:check-min-stock   # Revisar stock mínimo
```

