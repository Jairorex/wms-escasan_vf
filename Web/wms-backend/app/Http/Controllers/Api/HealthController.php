<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    /**
     * Endpoint de salud completo - Verifica estado del sistema
     * GET /api/health
     */
    public function index(Request $request)
    {
        $health = [
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
            'version' => '1.0.0',
            'service' => 'WMS API',
        ];

        // Verificar base de datos
        $health['database'] = $this->checkDatabase();

        // Verificar tablas principales
        $health['tables'] = $this->checkTables();

        // Verificar cache
        $health['cache'] = $this->checkCache();

        // Verificar almacenamiento
        $health['storage'] = $this->checkStorage();

        // Información del request
        $health['request'] = [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'origin' => $request->header('Origin'),
            'referer' => $request->header('Referer'),
        ];

        // Determinar estado general
        $overallStatus = 'healthy';
        if (!$health['database']['connected']) {
            $overallStatus = 'degraded';
        }
        if (!$health['cache']['working']) {
            $overallStatus = 'degraded';
        }

        $health['status'] = $overallStatus;

        $statusCode = $overallStatus === 'healthy' ? 200 : 503;

        return response()->json($health, $statusCode);
    }

    /**
     * Verifica la conexión a la base de datos
     */
    private function checkDatabase(): array
    {
        try {
            $connection = DB::connection();
            $pdo = $connection->getPdo();
            $driver = $connection->getDriverName();
            $database = $connection->getDatabaseName();

            return [
                'connected' => true,
                'driver' => $driver,
                'database' => $database,
                'error' => null,
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'driver' => null,
                'database' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verifica que las tablas principales existan
     */
    private function checkTables(): array
    {
        $tables = [
            'Tareas',
            'Productos',
            'Ubicaciones',
            'Lotes',
            'Inventario',
            'Usuarios',
            'Roles',
            'Detalle_Tarea',
        ];

        $results = [];
        foreach ($tables as $table) {
            try {
                $exists = Schema::hasTable($table);
                $count = $exists ? DB::table($table)->count() : 0;
                $results[$table] = [
                    'exists' => $exists,
                    'count' => $count,
                ];
            } catch (\Exception $e) {
                $results[$table] = [
                    'exists' => false,
                    'count' => 0,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    /**
     * Verifica que el cache funcione
     */
    private function checkCache(): array
    {
        try {
            $key = 'health_check_' . time();
            $value = 'test_' . rand(1000, 9999);
            
            Cache::put($key, $value, 10);
            $retrieved = Cache::get($key);
            Cache::forget($key);

            return [
                'working' => $retrieved === $value,
                'driver' => config('cache.default'),
                'error' => null,
            ];
        } catch (\Exception $e) {
            return [
                'working' => false,
                'driver' => config('cache.default'),
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verifica el almacenamiento (permisos de escritura)
     */
    private function checkStorage(): array
    {
        $paths = [
            'storage' => storage_path(),
            'cache' => storage_path('framework/cache'),
            'logs' => storage_path('logs'),
        ];

        $results = [];
        foreach ($paths as $name => $path) {
            $results[$name] = [
                'path' => $path,
                'writable' => is_writable($path),
                'exists' => file_exists($path),
            ];
        }

        return $results;
    }

    /**
     * Endpoint simple de health check (sin verificaciones pesadas)
     * GET /api/health/simple
     */
    public function simple(Request $request)
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'API WMS está funcionando',
            'timestamp' => now()->toIso8601String(),
            'version' => '1.0.0',
        ], 200);
    }

    /**
     * Endpoint de readiness (listo para recibir tráfico)
     * GET /api/health/ready
     */
    public function ready(Request $request)
    {
        try {
            // Verificar conexión a BD
            DB::connection()->getPdo();
            
            return response()->json([
                'status' => 'ready',
                'message' => 'API está lista para recibir tráfico',
                'timestamp' => now()->toIso8601String(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'not_ready',
                'message' => 'API no está lista: ' . $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 503);
        }
    }

    /**
     * Endpoint de liveness (el servicio está vivo)
     * GET /api/health/live
     */
    public function live()
    {
        return response()->json([
            'status' => 'alive',
            'timestamp' => now()->toIso8601String(),
        ], 200);
    }
}

