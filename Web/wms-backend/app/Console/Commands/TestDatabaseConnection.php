<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Rol;
use App\Models\Usuario;
use App\Models\Producto;
use App\Models\Lote;
use App\Models\Ubicacion;
use App\Models\Inventario;
use App\Models\Tarea;
use App\Models\Orden;

class TestDatabaseConnection extends Command
{
    protected $signature = 'wms:test-connection';
    protected $description = 'Prueba la conexión con la base de datos wms_db';

    public function handle()
    {
        $this->info('🔍 Probando conexión con la base de datos wms_db...');
        $this->newLine();
        
        try {
            // Test 1: Conexión básica y verificación de configuración
            $this->info('1️⃣  Probando conexión PDO...');
            $connection = DB::connection();
            $pdo = $connection->getPdo();
            $driver = $connection->getDriverName();
            $databaseName = $connection->getDatabaseName();
            
            $this->info('   ✅ Conexión exitosa');
            $this->line("   Driver: {$driver}");
            $this->line("   Base de datos: {$databaseName}");
            
            // Verificar configuración
            if ($driver !== 'sqlsrv') {
                $this->warn("   ⚠️  ADVERTENCIA: El driver actual es '{$driver}' pero se requiere 'sqlsrv' para SQL Server");
                $this->warn("   Verifica tu archivo .env y asegúrate de tener:");
                $this->warn("   DB_CONNECTION=sqlsrv");
                $this->warn("   DB_DATABASE=wms_db");
            }
            $this->newLine();
            
            // Test 2: Verificar tipo de conexión y listar tablas
            $this->info('2️⃣  Listando tablas...');
            
            // Listar tablas según el driver
            try {
                if ($driver === 'sqlsrv') {
                    // SQL Server
                    $tables = DB::select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
                } elseif ($driver === 'mysql') {
                    // MySQL
                    $tables = DB::select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME", [$databaseName]);
                } elseif ($driver === 'sqlite') {
                    // SQLite
                    $tables = DB::select("SELECT name as TABLE_NAME FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
                } else {
                    // Otros (PostgreSQL, etc.)
                    $tables = DB::select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
                }
                
                $this->info('   Tablas encontradas: ' . count($tables));
                
                $tablasEsperadas = [
                    'Roles', 'Usuarios', 'Tipos_Ubicacion', 'Ubicaciones',
                    'Productos', 'Lotes', 'Inventario', 'Ordenes',
                    'Tareas', 'Detalle_Tarea', 'Movimientos', 'Alertas',
                    'Clasificaciones', 'Tipos_Producto', 'Incidencias'
                ];
                
                foreach ($tablasEsperadas as $tabla) {
                    $existe = collect($tables)->contains(function ($t) use ($tabla) {
                        $tableName = is_object($t) ? ($t->TABLE_NAME ?? $t->name ?? null) : $t;
                        return $tableName === $tabla;
                    });
                    $icono = $existe ? '✅' : '❌';
                    $this->line("   {$icono} {$tabla}");
                }
            } catch (\Exception $e) {
                $this->error("   ❌ Error al listar tablas: " . $e->getMessage());
                $this->warn("   Esto puede ser normal si la base de datos está vacía o no está configurada correctamente.");
            }
            $this->newLine();
            
            // Test 3: Probar modelos y contar registros
            $this->info('3️⃣  Probando modelos y contando registros...');
            
            $modelos = [
                'Roles' => Rol::class,
                'Usuarios' => Usuario::class,
                'Productos' => Producto::class,
                'Lotes' => Lote::class,
                'Ubicaciones' => Ubicacion::class,
                'Inventario' => Inventario::class,
                'Ordenes' => Orden::class,
                'Tareas' => Tarea::class,
            ];
            
            foreach ($modelos as $nombre => $clase) {
                try {
                    $count = $clase::count();
                    $this->line("   ✅ {$nombre}: {$count} registros");
                } catch (\Exception $e) {
                    $this->error("   ❌ {$nombre}: Error - " . $e->getMessage());
                }
            }
            $this->newLine();
            
            // Test 4: Probar relaciones
            $this->info('4️⃣  Probando relaciones...');
            
            // Usuario -> Rol
            if (Usuario::count() > 0) {
                try {
                    $usuario = Usuario::with('rol')->first();
                    $this->line('   ✅ Usuario->Rol: ' . ($usuario->rol ? $usuario->rol->nombre : 'Sin rol asignado'));
                } catch (\Exception $e) {
                    $this->error('   ❌ Usuario->Rol: ' . $e->getMessage());
                }
            }
            
            // Producto -> TipoProducto, Clasificacion
            if (Producto::count() > 0) {
                try {
                    $producto = Producto::with('tipoProducto', 'clasificacion')->first();
                    $tipo = $producto->tipoProducto ? $producto->tipoProducto->nombre : 'Sin tipo';
                    $clasif = $producto->clasificacion ? $producto->clasificacion->nombre : 'Sin clasificación';
                    $this->line("   ✅ Producto->TipoProducto: {$tipo}");
                    $this->line("   ✅ Producto->Clasificacion: {$clasif}");
                } catch (\Exception $e) {
                    $this->error('   ❌ Producto relaciones: ' . $e->getMessage());
                }
            }
            
            // Lote -> Producto
            if (Lote::count() > 0) {
                try {
                    $lote = Lote::with('producto')->first();
                    $productoNombre = $lote->producto ? $lote->producto->nombre : 'Sin producto';
                    $this->line("   ✅ Lote->Producto: {$productoNombre}");
                } catch (\Exception $e) {
                    $this->error('   ❌ Lote->Producto: ' . $e->getMessage());
                }
            }
            
            // Ubicacion -> TipoUbicacion
            if (Ubicacion::count() > 0) {
                try {
                    $ubicacion = Ubicacion::with('tipoUbicacion')->first();
                    $tipo = $ubicacion->tipoUbicacion ? $ubicacion->tipoUbicacion->nombre : 'Sin tipo';
                    $this->line("   ✅ Ubicacion->TipoUbicacion: {$tipo}");
                } catch (\Exception $e) {
                    $this->error('   ❌ Ubicacion->TipoUbicacion: ' . $e->getMessage());
                }
            }
            
            // Inventario -> Lote -> Producto
            if (Inventario::count() > 0) {
                try {
                    $inventario = Inventario::with('lote.producto', 'ubicacion')->first();
                    $loteCodigo = $inventario->lote ? $inventario->lote->lote_codigo : 'Sin lote';
                    $productoNombre = $inventario->lote && $inventario->lote->producto 
                        ? $inventario->lote->producto->nombre 
                        : 'Sin producto';
                    $ubicacionCodigo = $inventario->ubicacion ? $inventario->ubicacion->codigo : 'Sin ubicación';
                    $this->line("   ✅ Inventario->Lote: {$loteCodigo}");
                    $this->line("   ✅ Inventario->Lote->Producto: {$productoNombre}");
                    $this->line("   ✅ Inventario->Ubicacion: {$ubicacionCodigo}");
                } catch (\Exception $e) {
                    $this->error('   ❌ Inventario relaciones: ' . $e->getMessage());
                }
            }
            
            $this->newLine();
            $this->info('✅ Todas las pruebas completadas exitosamente!');
            $this->newLine();
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->newLine();
            $this->error('❌ Error: ' . $e->getMessage());
            $this->error('Archivo: ' . $e->getFile() . ':' . $e->getLine());
            $this->newLine();
            return Command::FAILURE;
        }
    }
}

