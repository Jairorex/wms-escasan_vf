<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TestController extends Controller
{
    /**
     * Endpoint de prueba simple
     * GET /api/test
     */
    public function index(Request $request)
    {
        try {
            // Verificar conexión básica
            $dbConnected = false;
            $dbError = null;
            try {
                DB::connection()->getPdo();
                $dbConnected = true;
            } catch (\Exception $e) {
                $dbError = $e->getMessage();
            }

            // Verificar tablas
            $tables = [
                'Tareas' => Schema::hasTable('Tareas'),
                'Productos' => Schema::hasTable('Productos'),
                'Ubicaciones' => Schema::hasTable('Ubicaciones'),
                'Lotes' => Schema::hasTable('Lotes'),
                'Detalle_Tarea' => Schema::hasTable('Detalle_Tarea'),
            ];

            // Contar registros
            $counts = [];
            foreach ($tables as $table => $exists) {
                if ($exists) {
                    try {
                        $counts[$table] = DB::table($table)->count();
                    } catch (\Exception $e) {
                        $counts[$table] = 'Error: ' . $e->getMessage();
                    }
                } else {
                    $counts[$table] = 'No existe';
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Test endpoint funcionando',
                'database' => [
                    'connected' => $dbConnected,
                    'error' => $dbError,
                ],
                'tables' => $tables,
                'counts' => $counts,
                'request' => [
                    'method' => $request->method(),
                    'url' => $request->fullUrl(),
                    'origin' => $request->header('Origin'),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en test: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }
}

