<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Orden;
use App\Models\Lote;
use App\Models\Ubicacion;
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
        'lote_id' => 'nullable|integer|exists:Lotes,id', // usar lote existente
        'codigo_lote' => 'required_without:lote_id|string|unique:Lotes,lote_codigo',
        'fecha_caducidad' => 'required_without:lote_id|date',
        'fecha_fabricacion' => 'nullable|date',
        'cantidad' => 'required|numeric|min:0.01',
        'subbodega_id' => 'required|integer|exists:Subbodegas,id', // subbodega de destino
        'ubicacion_temporal_id' => 'nullable|integer|exists:Ubicaciones,id',
        'ubicacion_sugerida_id' => 'nullable|integer|exists:Ubicaciones,id', // ubicación sugerida para putaway
        'proveedor' => 'nullable|string|max:255',
        'documento_proveedor' => 'nullable|string|max:100',
        'observaciones' => 'nullable|string',
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

            // Usar lote existente o crear nuevo
            $loteId = $request->input('lote_id');
            
            if ($loteId) {
                // Usar lote existente
                $lote = Lote::findOrFail($loteId);
                
                // Validar que el lote sea del producto correcto
                if ($lote->producto_id !== $request->input('producto_id')) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'El lote seleccionado no corresponde al producto'
                    ], 400);
                }
            } else {
                // Crear nuevo lote
                $lote = Lote::create([
                    'lote_codigo' => $request->input('codigo_lote'),
                    'producto_id' => $request->input('producto_id'),
                    'fecha_caducidad' => $request->input('fecha_caducidad'),
                    'fecha_fabricacion' => $request->input('fecha_fabricacion'),
                    'cantidad_original' => $request->input('cantidad', 0)
                ]);
            }

            $cantidad = $request->input('cantidad');
            $usuarioId = $request->user()?->id;
            $subbodegaId = $request->input('subbodega_id');
            $ubicacionTemporalId = $request->input('ubicacion_temporal_id');
            $ubicacionSugeridaId = $request->input('ubicacion_sugerida_id');

            // Si no se especificó ubicación, buscar una disponible en la subbodega
            if (!$ubicacionSugeridaId && $subbodegaId) {
                $ubicacionEnSubbodega = Ubicacion::where('subbodega_id', $subbodegaId)
                    ->first();
                
                if ($ubicacionEnSubbodega) {
                    $ubicacionSugeridaId = $ubicacionEnSubbodega->id;
                }
            }

            // Verificar que tenemos una ubicación válida
            if (!$ubicacionSugeridaId && !$ubicacionTemporalId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se encontró ubicación disponible en la subbodega seleccionada. Por favor, crea una ubicación primero.'
                ], 400);
            }

            // Crear tarea PUTAWAY con ubicación sugerida si se especificó
            $tarea = $this->taskEngineService->createPutawayTask(
                $ordenId,
                $lote->id,
                $cantidad,
                $usuarioId,
                $ubicacionSugeridaId
            );

            // Ubicación destino sugerida por la tarea
            $detalleTarea = $tarea->detalleTareas->first();
            $ubicacionDestinoId = $detalleTarea ? $detalleTarea->ubicacion_destino_id : null;

            // Si hay ubicación temporal, usarla; si no, la destino
            $ubicacionFinalId = $ubicacionTemporalId ?: $ubicacionDestinoId ?: $ubicacionSugeridaId;

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
                    'subbodega_id' => $subbodegaId,
                    'ubicacion_id' => $ubicacionFinalId,
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


