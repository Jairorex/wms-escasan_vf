<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Orden;
use App\Models\Lote;
use App\Services\TaskEngineService;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class InboundController extends Controller
{
    protected TaskEngineService $taskEngineService;
    protected InventoryService $inventoryService;

    public function __construct(TaskEngineService $taskEngineService, InventoryService $inventoryService)
    {
        $this->taskEngineService = $taskEngineService;
        $this->inventoryService = $inventoryService;
    }

    /**
     * Recibe mercancía, crea lote, actualiza inventario y crea tarea PUTAWAY
     * Si la orden no existe, la crea automáticamente
     * 
     * POST /api/inbound/receive
     */
    public function receive(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'orden_compra_id' => 'nullable|integer', // opcional
        'numero_orden' => 'nullable|string',     // se mapea a referencia_externa
        'producto_id' => 'required|integer|exists:Productos,id',
        'codigo_lote' => 'required|string|unique:Lotes,lote_codigo',
        'fecha_caducidad' => 'required|date',
        'fecha_fabricacion' => 'nullable|date',
        'cantidad' => 'required|numeric|min:0.01',
        'ubicacion_temporal_id' => 'nullable|integer|exists:Ubicaciones,id',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 'error',
            'message' => 'Error de validación',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        return DB::transaction(function () use ($request) {
            $ordenId = $request->input('orden_compra_id');

            // Si no hay orden_compra_id, crear/usar una orden por referencia_externa
            if (!$ordenId) {
                $numeroOrden = $request->input('numero_orden', 'OC-' . date('YmdHis'));

                // Buscar por referencia_externa y tipo_orden = COMPRA
                $ordenExistente = Orden::where('referencia_externa', $numeroOrden)
                    ->where('tipo_orden', 'COMPRA')
                    ->first();

                if ($ordenExistente) {
                    $ordenId = $ordenExistente->id;
                } else {
                    $orden = Orden::create([
                        'tipo_orden' => 'RECEPCION', // 👈 valor permitido por el CHECK
                        'estado' => 'PENDIENTE',
                        'referencia_externa' => $numeroOrden,
                        'cliente_proveedor' => null,
                        'fecha_creacion' => now(),
                    ]);
                    
                    $ordenId = $orden->id;
                }
            } else {
                // Validar que la orden exista y sea de tipo COMPRA
                $orden = Orden::findOrFail($ordenId);

                    if ($orden->tipo_orden !== 'RECEPCION') {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'La orden debe ser de tipo RECEPCION'
                        ], 400);
                    }

            }

            // Crear el lote
            $lote = Lote::create([
                'lote_codigo' => $request->input('codigo_lote'),
                'producto_id' => $request->input('producto_id'),
                'fecha_caducidad' => $request->input('fecha_caducidad'),
                'fecha_fabricacion' => $request->input('fecha_fabricacion'),
                'cantidad_original' => $request->input('cantidad', 0)
            ]);

            $cantidad = $request->input('cantidad');
            $usuarioId = $request->user()?->id;
            $ubicacionTemporalId = $request->input('ubicacion_temporal_id');

            // Crear tarea PUTAWAY
            $tarea = $this->taskEngineService->createPutawayTask(
                $ordenId,
                $lote->id,
                $cantidad,
                $usuarioId
            );

            // Ubicación destino sugerida por la tarea
            $detalleTarea = $tarea->detalleTareas->first();
            $ubicacionDestinoId = $detalleTarea ? $detalleTarea->ubicacion_destino_id : null;

            // Si hay ubicación temporal, usarla; si no, la destino
            $ubicacionFinalId = $ubicacionTemporalId ?: $ubicacionDestinoId;

            if ($ubicacionFinalId) {
                $this->inventoryService->addStock(
                    $lote->id,
                    $ubicacionFinalId,
                    $cantidad,
                    $tarea->id,
                    $usuarioId
                );
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Mercancía recibida, inventario actualizado y tarea PUTAWAY creada',
                'data' => [
                    'orden_id' => $ordenId,
                    'lote' => $lote,
                    'tarea' => $tarea->load(['detalleTareas.ubicacionDestino'])
                ]
            ], 201);
        });
    } catch (\Exception $e) {
        Log::error('Error en receive: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Error al recibir mercancía: ' . $e->getMessage()
        ], 500);
    }
}


    /**
     * Crea una orden de compra
     * 
     * POST /api/inbound/orden
     */
    public function createOrden(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        // única respecto a referencia_externa
        'numero_orden' => 'required|string|unique:Ordenes,referencia_externa',
        'cliente_proveedor' => 'nullable|string',
        'observaciones' => 'nullable|string', // solo en request, no en tabla
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 'error',
            'message' => 'Error de validación',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        $orden = Orden::create([
            'tipo_orden' => 'RECEPCION', // 👈 ahora sí válido
            'estado' => 'PENDIENTE',
            'referencia_externa' => $request->input('numero_orden'),
            'cliente_proveedor' => $request->input('cliente_proveedor'),
            'fecha_creacion' => now(),
        ]);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Orden de compra creada',
            'data' => $orden
        ], 201);

    } catch (\Exception $e) {
        Log::error('Error en createOrden: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Error al crear la orden: ' . $e->getMessage()
        ], 500);
    }
}

}


