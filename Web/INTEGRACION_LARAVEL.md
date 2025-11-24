# Guía de Integración con Proyecto Laravel

Este backend está diseñado para integrarse en un proyecto Laravel existente o nuevo.

## Opción 1: Integrar en Proyecto Laravel Existente

### Paso 1: Copiar Archivos

**IMPORTANTE:** Ejecuta estos comandos desde la **raíz de tu proyecto Laravel**, NO desde dentro de `backend/`.

Si estás en Windows PowerShell y el backend está en `Wms_Propuesta2/backend/`:

```powershell
# Desde la raíz de tu proyecto Laravel (ej: C:\xampp\htdocs\tu-proyecto-laravel)
# Ajusta la ruta según tu ubicación del backend

# Opción A: Si el backend está en otra carpeta
Copy-Item -Path "C:\xampp\htdocs\Wms_Propuesta2\backend\app\*" -Destination "app\" -Recurse -Force
Copy-Item -Path "C:\xampp\htdocs\Wms_Propuesta2\backend\database\migrations\*" -Destination "database\migrations\" -Recurse -Force
Copy-Item -Path "C:\xampp\htdocs\Wms_Propuesta2\backend\routes\api.php" -Destination "routes\api.php" -Force

# Opción B: Si el backend está en la misma carpeta padre
Copy-Item -Path "..\Wms_Propuesta2\backend\app\*" -Destination "app\" -Recurse -Force
Copy-Item -Path "..\Wms_Propuesta2\backend\database\migrations\*" -Destination "database\migrations\" -Recurse -Force
Copy-Item -Path "..\Wms_Propuesta2\backend\routes\api.php" -Destination "routes\api.php" -Force
```

Si estás en Linux/Mac:

```bash
# Desde la raíz de tu proyecto Laravel
cp -r /ruta/al/Wms_Propuesta2/backend/app/* app/
cp -r /ruta/al/Wms_Propuesta2/backend/database/migrations/* database/migrations/
cp /ruta/al/Wms_Propuesta2/backend/routes/api.php routes/api.php
```

**O manualmente:**
1. Copia el contenido de `backend/app/` a `app/` de tu proyecto Laravel
2. Copia las migraciones de `backend/database/migrations/` a `database/migrations/`
3. Integra las rutas de `backend/routes/api.php` en tu `routes/api.php`

### Paso 2: Instalar Dependencias

```bash
composer require doctrine/dbal
```

**Nota para SQL Server:**
Asegúrate de tener el driver de SQL Server instalado. En Windows con XAMPP, generalmente ya está incluido.

### Paso 3: Configurar Base de Datos

Edita tu `.env`:

```env
DB_CONNECTION=sqlsrv
DB_HOST=tu_servidor
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
```

### Paso 4: Verificar

```bash
🔍 Probando conexión con la base de datos wms_db...

1️⃣  Probando conexión PDO...
   ✅ Conexión exitosa

2️⃣  Listando tablas...

❌ Error: SQLSTATE[HY000]: General error: 1 no such table: INFORMATION_SCHEMA.TABLES (Connection: sqlite, SQL: SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME)                                                                                                                                                  
Archivo: C:\xampp\htdocs\Wms_Propuesta2\Web\wms-backend\vendor\laravel\framework\src\Illuminate\Database\Connection.php:824
```

## Opción 2: Usar como Proyecto Standalone

Si quieres usar este backend como un proyecto Laravel independiente:

### Paso 1: Instalar Laravel

```bash
# Desde fuera de la carpeta backend
composer create-project laravel/laravel wms-backend
cd wms-backend
```

### Paso 2: Copiar Archivos del Backend

**IMPORTANTE:** Ejecuta desde la raíz del nuevo proyecto Laravel (`wms-backend/`).

En Windows PowerShell:

```powershell
# Desde wms-backend/
Copy-Item -Path "..\Wms_Propuesta2\backend\app\*" -Destination "app\" -Recurse -Force
Copy-Item -Path "..\Wms_Propuesta2\backend\database\*" -Destination "database\" -Recurse -Force
Copy-Item -Path "..\Wms_Propuesta2\backend\routes\api.php" -Destination "routes\api.php" -Force
```

En Linux/Mac:

```bash
# Desde wms-backend/
cp -r ../Wms_Propuesta2/backend/app/* app/
cp -r ../Wms_Propuesta2/backend/database/* database/
cp ../Wms_Propuesta2/backend/routes/api.php routes/api.php
```

### Paso 3: Instalar Dependencias

```bash
composer install
composer require doctrine/dbal
```

### Paso 4: Configurar

```bash
cp .env.example .env
php artisan key:generate
```

Edita `.env` con tus credenciales de SQL Server.

### Paso 5: Probar

```bash
php artisan wms:test-connection
```

## Estructura de Namespaces

Los namespaces son estándar de Laravel y NO incluyen "Backend":

- `App\Models\*`
- `App\Services\*`
- `App\Http\Controllers\Api\*`
- `App\Console\Commands\*`

## Comandos Disponibles

Una vez integrado, tendrás disponibles estos comandos:

```bash
# Probar conexión
php artisan wms:test-connection

# Revisar vencimientos
php artisan wms:check-expiry --days=30

# Revisar stock mínimo
php artisan wms:check-min-stock
```

## Rutas API

Las rutas estarán disponibles en:

- `POST /api/tasks/validate-scan` - Validar escaneos
- `GET /api/tasks` - Listar tareas
- `GET /api/tasks/{id}` - Detalle de tarea
- `POST /api/inbound/receive` - Recibir mercancía
- `POST /api/inbound/orden` - Crear orden

## Notas Importantes

1. **NO ejecutes migraciones** si la base de datos `wms_db` ya existe
2. Los nombres de tablas usan mayúsculas (Roles, Usuarios, etc.)
3. Asegúrate de que el autoload de Composer esté actualizado:
   ```bash
   composer dump-autoload
   ```

## Solución de Problemas

### Error: Class not found

```bash
composer dump-autoload
```

### Error: SQL Server connection

Verifica:
- Driver de SQL Server instalado
- Credenciales correctas en `.env`
- Servidor SQL Server accesible

### Error: Table not found

Verifica que los nombres de tablas en los modelos coincidan con la BD:
- `protected $table = 'Roles';` (con mayúscula)

