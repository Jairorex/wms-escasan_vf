# Comandos de Integración - Guía Rápida

## ⚠️ IMPORTANTE: Desde dónde ejecutar los comandos

Los comandos deben ejecutarse desde la **raíz de tu proyecto Laravel**, NO desde dentro de `backend/`.

## Escenario 1: Integrar en Proyecto Laravel Existente

### Estructura de Carpetas
```
tu-proyecto-laravel/          ← Ejecuta comandos AQUÍ
├── app/
├── database/
└── routes/

Wms_Propuesta2/
└── backend/                   ← Archivos fuente
    ├── app/
    ├── database/
    └── routes/
```

### Comandos PowerShell (Windows)

```powershell
# 1. Navega a tu proyecto Laravel
cd C:\xampp\htdocs\tu-proyecto-laravel

# 2. Copia los archivos (ajusta la ruta al backend)
$backendPath = "C:\xampp\htdocs\Wms_Propuesta2\backend"

Copy-Item -Path "$backendPath\app\*" -Destination "app\" -Recurse -Force
Copy-Item -Path "$backendPath\database\migrations\*" -Destination "database\migrations\" -Recurse -Force

# 3. Integra las rutas (copia manualmente o usa este comando)
Get-Content "$backendPath\routes\api.php" | Add-Content "routes\api.php"
```

### Comandos Bash (Linux/Mac)

```bash
# 1. Navega a tu proyecto Laravel
cd /ruta/a/tu-proyecto-laravel

# 2. Copia los archivos
BACKEND_PATH="/ruta/a/Wms_Propuesta2/backend"

cp -r $BACKEND_PATH/app/* app/
cp -r $BACKEND_PATH/database/migrations/* database/migrations/
cat $BACKEND_PATH/routes/api.php >> routes/api.php
```

## Escenario 2: Crear Nuevo Proyecto Laravel

### Paso a Paso

```powershell
# 1. Crear proyecto Laravel (desde donde quieras)
composer create-project laravel/laravel wms-backend
cd wms-backend

# 2. Copiar archivos del backend
$backendPath = "C:\xampp\htdocs\Wms_Propuesta2\backend"

Copy-Item -Path "$backendPath\app\*" -Destination "app\" -Recurse -Force
Copy-Item -Path "$backendPath\database\*" -Destination "database\" -Recurse -Force
Copy-Item -Path "$backendPath\routes\api.php" -Destination "routes\api.php" -Force

# 3. Instalar dependencias
composer install
composer require doctrine/dbal

# 4. Configurar
copy .env.example .env
php artisan key:generate

# 5. Editar .env con tus credenciales SQL Server
# DB_CONNECTION=sqlsrv
# DB_HOST=tu_servidor
# DB_DATABASE=wms_db
```

## Verificación

Después de copiar los archivos:

```bash
# Verificar que los archivos se copiaron
ls app/Models/
ls app/Services/
ls database/migrations/

# Probar conexión
php artisan wms:test-connection
```

## Solución de Errores Comunes

### Error: "No se encuentra la ruta de acceso 'backend\backend\app'"

**Causa:** Estás ejecutando los comandos desde dentro de `backend/`.

**Solución:** 
1. Sal de la carpeta `backend/`
2. Navega a tu proyecto Laravel
3. Ejecuta los comandos desde allí

```powershell
# ❌ INCORRECTO (desde backend/)
cd C:\xampp\htdocs\Wms_Propuesta2\backend
cp -r backend/app/* app/  # Busca backend/backend/app (no existe)

# ✅ CORRECTO (desde proyecto Laravel)
cd C:\xampp\htdocs\tu-proyecto-laravel
Copy-Item -Path "C:\xampp\htdocs\Wms_Propuesta2\backend\app\*" -Destination "app\" -Recurse
```

### Error: "Class not found"

**Solución:**
```bash
composer dump-autoload
```

### Error: "Table not found"

**Solución:** Verifica que los nombres de tablas en los modelos coincidan con la BD (mayúsculas):
- `protected $table = 'Roles';` ✅
- `protected $table = 'roles';` ❌

