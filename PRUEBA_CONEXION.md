# Guía para Probar la Conexión con la Base de Datos

## 1. Configuración Inicial

### Configurar `.env`

Asegúrate de tener la siguiente configuración en tu archivo `.env`:

```env
DB_CONNECTION=sqlsrv
DB_HOST=tu_servidor_sql
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
```

**Para autenticación Windows (Integrated Security):**

Si usas autenticación de Windows, puedes dejar `DB_USERNAME` y `DB_PASSWORD` vacíos y configurar la conexión en `config/database.php`:

```php
'sqlsrv' => [
    'driver' => 'sqlsrv',
    'host' => env('DB_HOST', 'localhost'),
    'port' => env('DB_PORT', '1433'),
    'database' => env('DB_DATABASE', 'wms_db'),
    'username' => env('DB_USERNAME', ''),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8',
    'prefix' => '',
    'options' => [
        'TrustServerCertificate' => true,
        'ConnectionPooling' => false,
        'Encrypt' => false,
    ],
],
```

## 2. Verificar Conexión Básica

### Opción A: Usando Tinker (Recomendado)

```bash
php artisan tinker
```

Luego ejecuta:

```php
// Probar conexión básica
DB::connection()->getPdo();

// Listar tablas
DB::select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");

// Contar registros en una tabla
\App\Models\Rol::count();
\App\Models\Usuario::count();
\App\Models\Producto::count();
```

### Opción B: Crear un Comando de Prueba

Crea un comando simple para verificar la conexión:

```bash
php artisan make:command TestDatabaseConnection
```

Luego edita `app/Console/Commands/TestDatabaseConnection.php`:

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Rol;
use App\Models\Usuario;
use App\Models\Producto;
use App\Models\Lote;
use App\Models\Ubicacion;

class TestDatabaseConnection extends Command
{
    protected $signature = 'wms:test-connection';
    protected $description = 'Prueba la conexión con la base de datos';

    public function handle()
    {
        $this->info('Probando conexión con la base de datos...');
        
        try {
            // Test 1: Conexión básica
            $this->info('1. Probando conexión PDO...');
            DB::connection()->getPdo();
            $this->info('   ✅ Conexión exitosa');
            
            // Test 2: Listar tablas
            $this->info('2. Listando tablas...');
            $tables = DB::select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
            $this->info('   Tablas encontradas: ' . count($tables));
            foreach ($tables as $table) {
                $this->line('   - ' . $table->TABLE_NAME);
            }
            
            // Test 3: Probar modelos
            $this->info('3. Probando modelos...');
            
            $this->line('   - Roles: ' . Rol::count());
            $this->line('   - Usuarios: ' . Usuario::count());
            $this->line('   - Productos: ' . Producto::count());
            $this->line('   - Lotes: ' . Lote::count());
            $this->line('   - Ubicaciones: ' . Ubicacion::count());
            
            // Test 4: Probar relaciones
            $this->info('4. Probando relaciones...');
            if (Usuario::count() > 0) {
                $usuario = Usuario::with('rol')->first();
                $this->line('   - Usuario->Rol: ' . ($usuario->rol ? '✅' : '❌'));
            }
            
            if (Producto::count() > 0) {
                $producto = Producto::with('tipoProducto', 'clasificacion')->first();
                $this->line('   - Producto->TipoProducto: ' . ($producto->tipoProducto ? '✅' : '⚠️ (puede ser null)'));
                $this->line('   - Producto->Clasificacion: ' . ($producto->clasificacion ? '✅' : '⚠️ (puede ser null)'));
            }
            
            if (Lote::count() > 0) {
                $lote = Lote::with('producto')->first();
                $this->line('   - Lote->Producto: ' . ($lote->producto ? '✅' : '❌'));
            }
            
            if (Ubicacion::count() > 0) {
                $ubicacion = Ubicacion::with('tipoUbicacion')->first();
                $this->line('   - Ubicacion->TipoUbicacion: ' . ($ubicacion->tipoUbicacion ? '✅' : '⚠️ (puede ser null)'));
            }
            
            $this->info('');
            $this->info('✅ Todas las pruebas completadas exitosamente!');
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
```

Ejecuta el comando:

```bash
php artisan wms:test-connection
```

## 3. Verificar Estructura de Tablas

### Verificar que los nombres de tablas coincidan

```php
// En tinker
$tablasEsperadas = [
    'Roles', 'Usuarios', 'Tipos_Ubicacion', 'Ubicaciones',
    'Productos', 'Lotes', 'Inventario', 'Ordenes',
    'Tareas', 'Detalle_Tarea', 'Movimientos', 'Alertas',
    'Clasificaciones', 'Tipos_Producto', 'Incidencias'
];

$tablasExistentes = collect(DB::select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"))
    ->pluck('TABLE_NAME')
    ->toArray();

foreach ($tablasEsperadas as $tabla) {
    if (in_array($tabla, $tablasExistentes)) {
        echo "✅ {$tabla}\n";
    } else {
        echo "❌ {$tabla} - NO ENCONTRADA\n";
    }
}
```

### Verificar columnas de una tabla

```php
// Verificar estructura de tabla Productos
$columnas = DB::select("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Productos' 
    ORDER BY ORDINAL_POSITION");

foreach ($columnas as $col) {
    echo "{$col->COLUMN_NAME} ({$col->DATA_TYPE}) - " . ($col->IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL') . "\n";
}
```

## 4. Probar Operaciones CRUD Básicas

### Crear un registro de prueba

```php
// En tinker
use App\Models\Rol;

// Crear un rol
$rol = Rol::create(['nombre' => 'Test Rol']);
echo "Rol creado: {$rol->id} - {$rol->nombre}\n";

// Leer
$rol = Rol::find($rol->id);
echo "Rol encontrado: {$rol->nombre}\n";

// Actualizar
$rol->nombre = 'Rol Actualizado';
$rol->save();
echo "Rol actualizado: {$rol->nombre}\n";

// Eliminar (si no tiene restricciones)
// $rol->delete();
```

## 5. Probar Relaciones

```php
// En tinker

// Probar relación Usuario -> Rol
$usuario = Usuario::with('rol')->first();
if ($usuario) {
    echo "Usuario: {$usuario->nombre}\n";
    echo "Rol: " . ($usuario->rol ? $usuario->rol->nombre : 'Sin rol') . "\n";
}

// Probar relación Lote -> Producto
$lote = Lote::with('producto')->first();
if ($lote) {
    echo "Lote: {$lote->lote_codigo}\n";
    echo "Producto: " . ($lote->producto ? $lote->producto->nombre : 'Sin producto') . "\n";
}

// Probar relación Inventario -> Lote -> Producto
$inventario = \App\Models\Inventario::with('lote.producto', 'ubicacion')->first();
if ($inventario) {
    echo "Inventario - Cantidad: {$inventario->cantidad}\n";
    echo "Lote: {$inventario->lote->lote_codigo}\n";
    echo "Producto: " . ($inventario->lote->producto ? $inventario->lote->producto->nombre : 'Sin producto') . "\n";
    echo "Ubicación: " . ($inventario->ubicacion ? $inventario->ubicacion->codigo : 'Sin ubicación') . "\n";
}
```

## 6. Solución de Problemas Comunes

### Error: "SQLSTATE[HY000] [2002] No connection could be made"

**Causa:** No puede conectarse al servidor SQL Server.

**Solución:**
- Verifica que el servidor SQL Server esté corriendo
- Verifica la IP/hostname en `DB_HOST`
- Verifica el puerto en `DB_PORT` (por defecto 1433)
- Verifica el firewall

### Error: "SQLSTATE[28000] [1045] Access denied"

**Causa:** Credenciales incorrectas.

**Solución:**
- Verifica `DB_USERNAME` y `DB_PASSWORD`
- Para autenticación Windows, verifica permisos del usuario

### Error: "SQLSTATE[42S02] Base table or view not found"

**Causa:** El nombre de la tabla no coincide.

**Solución:**
- Verifica que el nombre de la tabla en el modelo (`protected $table`) coincida exactamente con la tabla en SQL Server
- Recuerda que SQL Server es case-sensitive en algunos casos

### Error: "Column not found"

**Causa:** El nombre de la columna no coincide.

**Solución:**
- Verifica los nombres de columnas en la base de datos
- Asegúrate de que `$fillable` en el modelo coincida con las columnas reales

## 7. Verificar Servicios

```php
// En tinker

// Probar SlottingService
$producto = \App\Models\Producto::with('tipoProducto')->first();
if ($producto) {
    $slottingService = app(\App\Services\SlottingService::class);
    $ubicacion = $slottingService->findOptimalLocation($producto, 100, 50);
    if ($ubicacion) {
        echo "Ubicación encontrada: {$ubicacion->codigo}\n";
    } else {
        echo "No se encontró ubicación óptima\n";
    }
}
```

## 8. Checklist Final

- [ ] Conexión a la base de datos funciona
- [ ] Todas las tablas existen con nombres correctos
- [ ] Los modelos pueden leer datos
- [ ] Las relaciones funcionan correctamente
- [ ] Los servicios pueden ejecutarse sin errores
- [ ] Las operaciones CRUD básicas funcionan

## Notas Importantes

1. **No ejecutes migraciones** si la base de datos ya tiene datos
2. **Verifica los nombres de tablas** - deben coincidir exactamente (mayúsculas/minúsculas)
3. **Autenticación Windows** requiere configuración especial en la cadena de conexión
4. **SQL Server** puede ser case-sensitive dependiendo de la configuración del servidor

