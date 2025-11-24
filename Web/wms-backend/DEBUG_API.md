# Debug de Errores 500 en API

## Pasos para Diagnosticar

### 1. Verificar que el Backend esté Corriendo

```bash
cd Web/wms-backend
php artisan serve
```

### 2. Probar Endpoints Básicos

#### Health (sin base de datos)
```bash
curl http://localhost:8000/api/health
```

#### Test (con verificación de tablas)
```bash
curl http://localhost:8000/api/test
```

### 3. Ver Logs en Tiempo Real

En PowerShell:
```powershell
Get-Content Web\wms-backend\storage\logs\laravel.log -Wait -Tail 20
```

### 4. Verificar Errores Específicos

Los errores 500 pueden ser causados por:

1. **Tablas no existen**: Verificar que las migraciones se hayan ejecutado
2. **Relaciones incorrectas**: Verificar que los nombres de tablas y columnas coincidan
3. **Problemas de conexión**: Verificar la configuración de la base de datos

### 5. Endpoints de Prueba Creados

- `GET /api/health` - Endpoint simple sin dependencias
- `GET /api/test` - Verifica tablas y conexión

### 6. Verificar en el Navegador

Abre: `http://localhost:8000/api/health`

Deberías ver JSON con `"success": true`

## Solución Rápida

Si todos los endpoints dan 500:

1. Verifica que la base de datos esté corriendo
2. Verifica la configuración en `.env`
3. Prueba el endpoint `/api/health` que no requiere BD
4. Revisa los logs más recientes

## Comandos Útiles

```bash
# Ver rutas registradas
php artisan route:list --path=api

# Limpiar cache
php artisan config:clear
php artisan route:clear

# Ver logs
tail -f storage/logs/laravel.log
```

