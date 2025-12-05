<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reabastecimiento;
use App\Models\DetalleReabastecimiento;
use App\Models\Subbodega;
use App\Services\ReabastecimientoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReabastecimientoController extends Controller
{
    protected ReabastecimientoService $reabastecimientoService;

    public function __construct(ReabastecimientoService $reabastecimientoService)
    {
        $this->reabastecimientoService = $reabastecimientoService;
    }

    /**
     * Listar reabastecimientos
     */
    public function index(Request $request): JsonResponse
    {
        $query = Reabastecimiento::with([
            'subbodegaOrigen',
            'subbodegaDestino',
            'solicitante',
            'detalles.producto'
        ]);

        // Filtros
        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('prioridad')) {
            $query->where('prioridad', $request->prioridad);
        }

        if ($request->has('subbodega_destino_id')) {
            $query->where('subbodega_destino_id', $request->subbodega_destino_id);
        }

        $reabastecimientos = $query->orderBy('fecha_solicitud', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reabastecimientos
        ]);
    }

    /**
     * Obtener un reabastecimiento específico
     */
    public function show(int $id): JsonResponse
    {
        $reabastecimiento = Reabastecimiento::with([
            'subbodegaOrigen',
            'subbodegaDestino',
            'solicitante',
            'aprobador',
            'ejecutor',
            'detalles.producto',
            'detalles.lote',
            'detalles.ubicacionOrigen',
            'detalles.ubicacionDestino'
        ])->find($id);

        if (!$reabastecimiento) {
            return response()->json([
                'success' => false,
                'message' => 'Reabastecimiento no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $reabastecimiento
        ]);
    }

    /**
     * Crear reabastecimiento manual
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'subbodega_origen_id' => 'required|integer|exists:Subbodegas,id',
            'subbodega_destino_id' => 'required|integer|exists:Subbodegas,id|different:subbodega_origen_id',
            'prioridad' => 'nullable|in:BAJA,MEDIA,ALTA,URGENTE',
            'observaciones' => 'nullable|string|max:500',
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|integer|exists:Productos,id',
            'productos.*.cantidad' => 'required|numeric|min:0.01',
            'productos.*.lote_id' => 'nullable|integer|exists:Lotes,id',
            'productos.*.ubicacion_origen_id' => 'nullable|integer|exists:Ubicaciones,id',
            'productos.*.ubicacion_destino_id' => 'nullable|integer|exists:Ubicaciones,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $reabastecimiento = $this->reabastecimientoService->crearReabastecimientoManual(
                $request->subbodega_origen_id,
                $request->subbodega_destino_id,
                $request->productos,
                $request->user()?->id ?? 1,
                $request->prioridad ?? 'MEDIA',
                $request->observaciones
            );

            return response()->json([
                'success' => true,
                'message' => 'Reabastecimiento creado exitosamente',
                'data' => $reabastecimiento->load(['detalles.producto', 'subbodegaOrigen', 'subbodegaDestino'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear reabastecimiento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Aprobar reabastecimiento
     */
    public function aprobar(Request $request, int $id): JsonResponse
    {
        $reabastecimiento = Reabastecimiento::find($id);

        if (!$reabastecimiento) {
            return response()->json([
                'success' => false,
                'message' => 'Reabastecimiento no encontrado'
            ], 404);
        }

        if ($reabastecimiento->estado !== Reabastecimiento::ESTADO_PENDIENTE) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden aprobar reabastecimientos pendientes'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'cantidades_aprobadas' => 'nullable|array',
            'cantidades_aprobadas.*.detalle_id' => 'required|integer|exists:Detalle_Reabastecimientos,id',
            'cantidades_aprobadas.*.cantidad' => 'required|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Actualizar cantidades aprobadas si se proporcionan
        if ($request->has('cantidades_aprobadas')) {
            foreach ($request->cantidades_aprobadas as $item) {
                DetalleReabastecimiento::where('id', $item['detalle_id'])
                    ->update(['cantidad_aprobada' => $item['cantidad']]);
            }
        } else {
            // Aprobar todas las cantidades solicitadas
            foreach ($reabastecimiento->detalles as $detalle) {
                $detalle->update(['cantidad_aprobada' => $detalle->cantidad_solicitada]);
            }
        }

        $reabastecimiento->aprobar($request->user()?->id ?? 1);

        return response()->json([
            'success' => true,
            'message' => 'Reabastecimiento aprobado exitosamente',
            'data' => $reabastecimiento->load('detalles')
        ]);
    }

    /**
     * Ejecutar reabastecimiento (crear tareas)
     */
    public function ejecutar(Request $request, int $id): JsonResponse
    {
        $reabastecimiento = Reabastecimiento::find($id);

        if (!$reabastecimiento) {
            return response()->json([
                'success' => false,
                'message' => 'Reabastecimiento no encontrado'
            ], 404);
        }

        if ($reabastecimiento->estado !== Reabastecimiento::ESTADO_APROBADO) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden ejecutar reabastecimientos aprobados'
            ], 400);
        }

        try {
            $tareas = $this->reabastecimientoService->ejecutarReabastecimiento(
                $reabastecimiento,
                $request->user()?->id ?? 1
            );

            return response()->json([
                'success' => true,
                'message' => 'Reabastecimiento en ejecución - ' . count($tareas) . ' tareas creadas',
                'data' => [
                    'reabastecimiento' => $reabastecimiento->fresh(),
                    'tareas' => $tareas
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al ejecutar reabastecimiento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Completar reabastecimiento
     */
    public function completar(int $id): JsonResponse
    {
        $reabastecimiento = Reabastecimiento::find($id);

        if (!$reabastecimiento) {
            return response()->json([
                'success' => false,
                'message' => 'Reabastecimiento no encontrado'
            ], 404);
        }

        if ($reabastecimiento->estado !== Reabastecimiento::ESTADO_EN_PROCESO) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden completar reabastecimientos en proceso'
            ], 400);
        }

        $reabastecimiento->completar();

        // Marcar detalles como completados
        foreach ($reabastecimiento->detalles as $detalle) {
            if ($detalle->estaCompleto()) {
                $detalle->update(['estado' => DetalleReabastecimiento::ESTADO_COMPLETADO]);
            } else {
                $detalle->update(['estado' => DetalleReabastecimiento::ESTADO_PARCIAL]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Reabastecimiento completado',
            'data' => $reabastecimiento
        ]);
    }

    /**
     * Cancelar reabastecimiento
     */
    public function cancelar(Request $request, int $id): JsonResponse
    {
        $reabastecimiento = Reabastecimiento::find($id);

        if (!$reabastecimiento) {
            return response()->json([
                'success' => false,
                'message' => 'Reabastecimiento no encontrado'
            ], 404);
        }

        if (in_array($reabastecimiento->estado, [
            Reabastecimiento::ESTADO_COMPLETADO,
            Reabastecimiento::ESTADO_CANCELADO
        ])) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede cancelar este reabastecimiento'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'motivo' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $reabastecimiento->cancelar($request->motivo);

        return response()->json([
            'success' => true,
            'message' => 'Reabastecimiento cancelado',
            'data' => $reabastecimiento
        ]);
    }

    /**
     * Verificar stock mínimo y generar reabastecimientos automáticos
     */
    public function verificarStockMinimo(): JsonResponse
    {
        try {
            $reabastecimientos = $this->reabastecimientoService->verificarStockMinimo();

            return response()->json([
                'success' => true,
                'message' => count($reabastecimientos) . ' reabastecimientos automáticos generados',
                'data' => $reabastecimientos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar stock mínimo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar reabastecimientos programados
     */
    public function generarProgramados(): JsonResponse
    {
        try {
            $reabastecimientos = $this->reabastecimientoService->generarReabastecimientosProgramados();

            return response()->json([
                'success' => true,
                'message' => count($reabastecimientos) . ' reabastecimientos programados generados',
                'data' => $reabastecimientos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar reabastecimientos programados: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de reabastecimientos
     */
    public function estadisticas(Request $request): JsonResponse
    {
        $fechaDesde = $request->fecha_desde ?? now()->subDays(30);
        $fechaHasta = $request->fecha_hasta ?? now();

        $stats = [
            'total' => Reabastecimiento::whereBetween('fecha_solicitud', [$fechaDesde, $fechaHasta])->count(),
            'por_tipo' => Reabastecimiento::whereBetween('fecha_solicitud', [$fechaDesde, $fechaHasta])
                ->selectRaw('tipo, COUNT(*) as total')
                ->groupBy('tipo')
                ->get(),
            'por_estado' => Reabastecimiento::whereBetween('fecha_solicitud', [$fechaDesde, $fechaHasta])
                ->selectRaw('estado, COUNT(*) as total')
                ->groupBy('estado')
                ->get(),
            'por_prioridad' => Reabastecimiento::whereBetween('fecha_solicitud', [$fechaDesde, $fechaHasta])
                ->selectRaw('prioridad, COUNT(*) as total')
                ->groupBy('prioridad')
                ->get(),
            'pendientes' => Reabastecimiento::pendientes()->count(),
            'subbodegas_bajo_stock' => Subbodega::activas()
                ->tipo(Subbodega::TIPO_PICKING)
                ->get()
                ->filter(fn($s) => $s->necesitaReabastecimiento())
                ->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

