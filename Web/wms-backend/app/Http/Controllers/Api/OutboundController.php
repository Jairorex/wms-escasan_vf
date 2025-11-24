<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Orden;
use App\Models\Inventario;
use App\Services\TaskEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OutboundController extends Controller
{
    protected TaskEngineService $taskEngineService;

    public function __construct(TaskEngineService $taskEngineService)
    {
        $this->taskEngineService = $taskEngineService;
    }

    /**
     * Prepara picking con múltiples productos y crea una sola tarea PICKING con múltiples detalles
     * Si la orden no existe, la crea automáticamente
     * Valida stock suficiente antes de crear la tarea
     * 
     * POST /api/outbound/prepare
     */
    public function prepare(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'orden_venta_id'   => 'nullable|integer', // opcional
            'numero_orden'     => 'nullable|string',  // se mapea a referencia_externa si no hay orden_venta_id
            'productos'        => 'required|array|min:1',
            'productos.*.producto_id' => 'required|integer|exists:Productos,id',
            'productos.*.cantidad'    => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error de validación',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $ordenId = $request->input('orden_venta_id');

                // Si no hay orden_venta_id, crear/usar una orden automáticamente
                if (!$ordenId) {
                    $numeroOrden = $request->input('numero_orden', 'OV-' . date('YmdHis'));

                    // Buscar orden existente por referencia_externa y tipo_orden = PICKING
                    $ordenExistente = Orden::where('referencia_externa', $numeroOrden)
                        ->where('tipo_orden', 'PICKING')
                        ->first();

                    if ($ordenExistente) {
                        $ordenId = $ordenExistente->id;
                    } else {
                        $orden = Orden::create([
                            'tipo_orden'        => 'PICKING', // ✅ valor permitido por el CHECK
                            'estado'            => 'PENDIENTE',
                            'referencia_externa'=> $numeroOrden,
                            'cliente_proveedor' => null,
                            'fecha_creacion'    => now(),
                        ]);

                        $ordenId = $orden->id;
                    }
                } else {
                    // Validar que la orden exista y sea de tipo PICKING
                    $orden = Orden::findOrFail($ordenId);

                    if ($orden->tipo_orden !== 'PICKING') {
                        return response()->json([
                            'status'  => 'error',
                            'message' => 'La orden debe ser de tipo PICKING'
                        ], 400);
                    }
                }

                $productos = $request->input('productos');

                // Validar stock suficiente para todos los productos antes de crear la tarea
                foreach ($productos as $productoData) {
                    $productoId        = $productoData['producto_id'];
                    $cantidadSolicitada = $productoData['cantidad'];

                    // Stock total disponible del producto
                    $stockTotal = Inventario::whereHas('lote', function ($query) use ($productoId) {
                            $query->where('producto_id', $productoId);
                        })
                        ->where('estado', 'Disponible')
                        ->sum('cantidad');

                    if ($stockTotal < $cantidadSolicitada) {
                        return response()->json([
                            'status'  => 'error',
                            'message' => "Stock insuficiente para el producto ID: {$productoId}. Disponible: {$stockTotal}, Solicitado: {$cantidadSolicitada}"
                        ], 400);
                    }
                }

                $usuarioId = $request->user()?->id;

                // Crear una sola tarea PICKING con múltiples detalles
                $tarea = $this->taskEngineService->createPickingTaskWithMultipleProducts(
                    $ordenId,
                    $productos,
                    $usuarioId
                );

                return response()->json([
                    'status'  => 'success',
                    'message' => 'Picking preparado y tarea PICKING creada con ' . count($productos) . ' producto(s)',
                    'data'    => [
                        'orden_id' => $ordenId,
                        'tarea'    => $tarea->load([
                            'detalleTareas.lote.producto',
                            'detalleTareas.ubicacionOrigen'
                        ])
                    ]
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('Error en prepare (Outbound): ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al preparar picking: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crea una orden de venta
     * 
     * POST /api/outbound/orden
     */
    public function createOrden(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            // única respecto a referencia_externa
            'numero_orden'      => 'required|string|unique:Ordenes,referencia_externa',
            'cliente_proveedor' => 'nullable|string',
            'observaciones'     => 'nullable|string', // solo en request, no existe columna en BD
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error de validación',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $orden = Orden::create([
                'tipo_orden'        => 'PICKING', // ✅ tipo de orden de venta/salida
                'estado'            => 'PENDIENTE',
                'referencia_externa'=> $request->input('numero_orden'),
                'cliente_proveedor' => $request->input('cliente_proveedor'),
                'fecha_creacion'    => now(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Orden de venta creada',
                'data'    => $orden
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error en createOrden (Outbound): ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al crear la orden: ' . $e->getMessage()
            ], 500);
        }
    }
}
