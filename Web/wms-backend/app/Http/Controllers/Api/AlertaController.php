<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alerta;
use App\Models\Lote;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AlertaController extends Controller
{
    /**
     * Listar alertas con filtros
     */
    public function index(Request $request)
    {
        try {
            $query = Alerta::query();

            // Filtros
            if ($request->has('estado') && $request->estado !== 'all') {
                $query->where('estado', $request->estado);
            }

            if ($request->has('tipo') && $request->tipo !== 'all') {
                $query->where('tipo', $request->tipo);
            }

            if ($request->has('nivel_riesgo') && $request->nivel_riesgo !== 'all') {
                $query->where('nivel_riesgo', $request->nivel_riesgo);
            }

            // Cargar relaciones según tabla_referencia
            $alertas = $query->orderBy('fecha_alerta', 'desc')->get();

            // Cargar relaciones dinámicas
            foreach ($alertas as $alerta) {
                if ($alerta->tabla_referencia && $alerta->referencia_id) {
                    switch ($alerta->tabla_referencia) {
                        case 'Lotes':
                            $alerta->load('referencia.producto');
                            break;
                        case 'Productos':
                            $alerta->load('referencia');
                            break;
                        case 'Ubicaciones':
                            $alerta->load('referencia');
                            break;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $alertas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener alertas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una alerta específica
     */
    public function show($id)
    {
        try {
            $alerta = Alerta::find($id);

            if (!$alerta) {
                return response()->json([
                    'success' => false,
                    'message' => 'Alerta no encontrada'
                ], 404);
            }

            // Cargar relación según tabla_referencia
            if ($alerta->tabla_referencia && $alerta->referencia_id) {
                switch ($alerta->tabla_referencia) {
                    case 'Lotes':
                        $alerta->load('referencia.producto');
                        break;
                    case 'Productos':
                        $alerta->load('referencia');
                        break;
                    case 'Ubicaciones':
                        $alerta->load('referencia');
                        break;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $alerta
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener alerta',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marcar alerta como resuelta
     */
    public function resolver($id)
    {
        try {
            $alerta = Alerta::find($id);

            if (!$alerta) {
                return response()->json([
                    'success' => false,
                    'message' => 'Alerta no encontrada'
                ], 404);
            }

            $alerta->update(['estado' => 'RESUELTA']);

            return response()->json([
                'success' => true,
                'message' => 'Alerta marcada como resuelta',
                'data' => $alerta
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al resolver alerta',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar alertas de vencimientos
     * Este método puede ser llamado manualmente o por un cron job
     */
    public function generarAlertasVencimientos(Request $request)
    {
        try {
            $diasAnticipacion = $request->input('dias_anticipacion', 30); // Por defecto 30 días
            $alertasCreadas = 0;

            // Obtener lotes que están próximos a vencer o ya vencidos
            $fechaHoy = Carbon::now();
            $fechaVencimiento = Carbon::now()->addDays($diasAnticipacion);

            $lotes = Lote::whereNotNull('fecha_caducidad')
                ->where('fecha_caducidad', '<=', $fechaVencimiento)
                ->with('producto')
                ->get();

            foreach ($lotes as $lote) {
                $fechaCaducidad = Carbon::parse($lote->fecha_caducidad);
                $diasRestantes = $fechaHoy->diffInDays($fechaCaducidad, false);

                // Determinar nivel de riesgo y tipo de alerta
                if ($diasRestantes < 0) {
                    // Ya vencido
                    $tipo = 'VENCIMIENTO';
                    $nivelRiesgo = 'ALTO';
                    $descripcion = "El lote {$lote->lote_codigo} del producto {$lote->producto->nombre} ({$lote->producto->sku}) está VENCIDO desde hace " . abs($diasRestantes) . " días.";
                } elseif ($diasRestantes <= 7) {
                    // Vence en menos de 7 días
                    $tipo = 'VENCIMIENTO';
                    $nivelRiesgo = 'ALTO';
                    $descripcion = "El lote {$lote->lote_codigo} del producto {$lote->producto->nombre} ({$lote->producto->sku}) vence en {$diasRestantes} días.";
                } elseif ($diasRestantes <= 15) {
                    // Vence en menos de 15 días
                    $tipo = 'VENCIMIENTO';
                    $nivelRiesgo = 'MEDIO';
                    $descripcion = "El lote {$lote->lote_codigo} del producto {$lote->producto->nombre} ({$lote->producto->sku}) vence en {$diasRestantes} días.";
                } else {
                    // Vence en más de 15 días pero dentro del rango
                    $tipo = 'VENCIMIENTO';
                    $nivelRiesgo = 'BAJO';
                    $descripcion = "El lote {$lote->lote_codigo} del producto {$lote->producto->nombre} ({$lote->producto->sku}) vence en {$diasRestantes} días.";
                }

                // Verificar si ya existe una alerta pendiente para este lote
                $alertaExistente = Alerta::where('tipo', $tipo)
                    ->where('referencia_id', $lote->id)
                    ->where('tabla_referencia', 'Lotes')
                    ->where('estado', 'PENDIENTE')
                    ->first();

                if (!$alertaExistente) {
                    Alerta::create([
                        'tipo' => $tipo,
                        'descripcion' => $descripcion,
                        'nivel_riesgo' => $nivelRiesgo,
                        'referencia_id' => $lote->id,
                        'tabla_referencia' => 'Lotes',
                        'estado' => 'PENDIENTE',
                        'fecha_alerta' => now()
                    ]);
                    $alertasCreadas++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Se generaron {$alertasCreadas} alertas de vencimiento",
                'alertas_creadas' => $alertasCreadas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar alertas de vencimiento',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar alertas de productos sin ubicación (sin inventario)
     */
    public function generarAlertasSinUbicacion()
    {
        try {
            $alertasCreadas = 0;

            // Obtener todos los lotes
            $lotes = Lote::with('producto')->get();

            foreach ($lotes as $lote) {
                // Verificar si el lote tiene inventario asignado
                $inventario = DB::table('Inventario')
                    ->where('lote_id', $lote->id)
                    ->sum('cantidad');

                // Si no tiene inventario o la cantidad es 0
                if (!$inventario || $inventario == 0) {
                    // Verificar si ya existe una alerta pendiente
                    $alertaExistente = Alerta::where('tipo', 'SIN_UBICACION')
                        ->where('referencia_id', $lote->id)
                        ->where('tabla_referencia', 'Lotes')
                        ->where('estado', 'PENDIENTE')
                        ->first();

                    if (!$alertaExistente) {
                        Alerta::create([
                            'tipo' => 'SIN_UBICACION',
                            'descripcion' => "El lote {$lote->lote_codigo} del producto {$lote->producto->nombre} ({$lote->producto->sku}) no tiene ubicación asignada. Cantidad original: {$lote->cantidad_original}",
                            'nivel_riesgo' => 'MEDIO',
                            'referencia_id' => $lote->id,
                            'tabla_referencia' => 'Lotes',
                            'estado' => 'PENDIENTE',
                            'fecha_alerta' => now()
                        ]);
                        $alertasCreadas++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Se generaron {$alertasCreadas} alertas de productos sin ubicación",
                'alertas_creadas' => $alertasCreadas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar alertas de productos sin ubicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar todas las alertas automáticas
     */
    public function generarTodasLasAlertas(Request $request)
    {
        try {
            $diasAnticipacion = $request->input('dias_anticipacion', 30);
            
            // Generar alertas de vencimientos
            $this->generarAlertasVencimientos($request);
            
            // Generar alertas de productos sin ubicación
            $this->generarAlertasSinUbicacion();

            return response()->json([
                'success' => true,
                'message' => 'Todas las alertas han sido generadas'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar alertas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

