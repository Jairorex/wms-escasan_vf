# Solución al Error de Cache

## Problema

Al ejecutar `php artisan cache:clear`, aparece el error:
```
SQLSTATE[42S02]: Invalid object name 'cache'
```

## Causa

El archivo `.env` tiene `CACHE_STORE=database`, lo que hace que Laravel intente usar la base de datos para el cache, pero la tabla `cache` no existe en SQL Server.

## Solución Rápida

### Opción 1: Usar el Script PowerShell (Más Fácil)

Ejecuta desde `web/wms-backend`:
```powershell
.\fix_cache.ps1
```

Este script:
- Cambia `CACHE_STORE=database` a `CACHE_STORE=file` en `.env`
- Elimina el caché de configuración
- Limpia todos los cachés
- Prueba que `cache:clear` funcione

### Opción 2: Cambio Manual

1. Abre `web/wms-backend/.env`
2. Busca la línea: `CACHE_STORE=database`
3. Cámbiala a: `CACHE_STORE=file`
4. Guarda el archivo
5. Ejecuta:
   ```powershell
   cd web\wms-backend
   Remove-Item bootstrap\cache\config.php -ErrorAction SilentlyContinue
   php artisan config:clear
   php artisan cache:clear
   ```

## Verificar que Funcionó

Ejecuta:
```powershell
php artisan cache:clear
```

Deberías ver:
```
INFO  Application cache cleared successfully.
```

**Sin errores de base de datos.**

## Verificar Configuración

Para verificar qué driver de cache está usando:

```powershell
php artisan tinker --execute="echo config('cache.default');"
```

Debería mostrar: `file`

## Comandos de Cache

Una vez configurado correctamente, puedes ejecutar:

```powershell
php artisan cache:clear      # Limpiar cache de aplicación
php artisan config:clear      # Limpiar cache de configuración
php artisan route:clear       # Limpiar cache de rutas
php artisan view:clear        # Limpiar cache de vistas
```

## Ubicación del Cache de Archivos

El cache de archivos se almacena en:
```
storage/framework/cache/data/
```

Este directorio se crea automáticamente y no requiere configuración adicional.

## Nota Importante

El archivo `config/cache.php` ya está configurado correctamente con:
```php
'default' => env('CACHE_STORE', 'file'),
```

Pero si el `.env` tiene `CACHE_STORE=database`, Laravel usará la base de datos. Por eso es importante cambiar el `.env`.

Para desarrollo, **file cache es más simple y recomendado** porque no requiere tablas adicionales en la base de datos.
