<?php

namespace App\Services;

use App\Models\Tarea;
use App\Models\DetalleTarea;
use App\Models\Ubicacion;
use App\Models\Lote;
use App\Models\Alerta;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TaskEngineService
{
    protected InventoryService $inventoryService;
    protected SlottingService $slottingService;

    public function __construct(InventoryService $inventoryService, SlottingService $slottingService)
    {
        $this->inventoryService = $inventoryService;
        $this->slottingService = $slottingService;
    }

    /**
     * Valida un paso de la tarea (escaneo de ubicación, lote, cantidad)
     */
    public function validateStep(int $tareaId, string $tipoEscaneo, string $valor, ?float $cantidad = null, ?int $usuarioId = null): array
    {
        return DB::transaction(function () use ($tareaId, $tipoEscaneo, $valor, $cantidad, $usuarioId) {
            $tarea = Tarea::with(['detalleTareas.lote.producto', 'detalleTareas.ubicacionOrigen', 'detalleTareas.ubicacionDestino'])
                ->findOrFail($tareaId);

            // Validar que la tarea esté en estado válido
            if ($tarea->estado === 'COMPLETADA') {
                return [
                    'success' => false,
                    'message' => 'La tarea ya está completada',
                    'next_step' => null
                ];
            }

            if ($tarea->estado === 'CREADA' || $tarea->estado === 'ASIGNADA') {
                $tarea->estado = 'EN_CURSO';
                $tarea->save();
            }

            // Buscar detalle de tarea pendiente (cantidad_completada < cantidad_solicitada)
            $detalleTarea = $tarea->detalleTareas()
                ->whereRaw('cantidad_completada < cantidad_solicitada')
                ->first();

            if (!$detalleTarea) {
                return [
                    'success' => false,
                    'message' => 'No hay detalles de tarea pendientes',
                    'next_step' => null
                ];
            }

            switch ($tipoEscaneo) {
                case 'location':
                    return $this->validateLocation($tarea, $detalleTarea, $valor);
                
                case 'lot':
                    return $this->validateLot($tarea, $detalleTarea, $valor);
                
                case 'quantity':
                    if ($cantidad === null) {
                        return [
                            'success' => false,
                            'message' => 'La cantidad es requerida',
                            'next_step' => null
                        ];
                    }
                    return $this->validateQuantity($tarea, $detalleTarea, $cantidad, $usuarioId);
                
                default:
                    return [
                        'success' => false,
                        'message' => 'Tipo de escaneo no válido',
                        'next_step' => null
                    ];
            }
        });
    }

    protected function validateLocation(Tarea $tarea, DetalleTarea $detalleTarea, string $codigoUbicacion): array
    {
        $ubicacion = Ubicacion::where('codigo', $codigoUbicacion)->first();

        if (!$ubicacion) {
            return [
                'success' => false,
                'message' => 'Ubicación no encontrada',
                'next_step' => null
            ];
        }

        // Validar según el tipo de tarea
        if ($tarea->tipo_tarea === 'PUTAWAY') {
            // Para putaway, validar que la ubicación destino sea correcta
            if ($detalleTarea->ubicacion_destino_id && $ubicacion->id !== $detalleTarea->ubicacion_destino_id) {
                return [
                    'success' => false,
                    'message' => "Ubicación incorrecta. Se esperaba: {$detalleTarea->ubicacionDestino->codigo}",
                    'next_step' => null
                ];
            }
        } elseif ($tarea->tipo_tarea === 'PICK') {
            // Para picking, validar que la ubicación origen sea correcta
            if ($detalleTarea->ubicacion_origen_id && $ubicacion->id !== $detalleTarea->ubicacion_origen_id) {
                return [
                    'success' => false,
                    'message' => "Ubicación incorrecta. Se esperaba: {$detalleTarea->ubicacionOrigen->codigo}",
                    'next_step' => null
                ];
            }
        }

        return [
            'success' => true,
            'message' => 'Ubicación válida',
            'next_step' => 'lot',
            'data' => [
                'ubicacion_id' => $ubicacion->id,
                'ubicacion_codigo' => $ubicacion->codigo
            ]
        ];
    }

    protected function validateLot(Tarea $tarea, DetalleTarea $detalleTarea, string $codigoLote): array
    {
        $lote = Lote::where('lote_codigo', $codigoLote)->first();

        if (!$lote) {
            return [
                'success' => false,
                'message' => 'Lote no encontrado',
                'next_step' => null
            ];
        }

        // Validar que el lote coincida con el detalle de la tarea
        if ($detalleTarea->lote_id !== $lote->id) {
            return [
                'success' => false,
                'message' => "Lote incorrecto. Se esperaba: {$detalleTarea->lote->lote_codigo}",
                'next_step' => null
            ];
        }

        // Validar que haya stock disponible
        $ubicacionId = $tarea->tipo_tarea === 'PICK' 
            ? $detalleTarea->ubicacion_origen_id 
            : $detalleTarea->ubicacion_destino_id;

        $inventario = $lote->inventarios()
            ->where('ubicacion_id', $ubicacionId)
            ->where('estado', 'Disponible')
            ->first();

        if (!$inventario || $inventario->cantidad < ($detalleTarea->cantidad_solicitada - $detalleTarea->cantidad_completada)) {
            return [
                'success' => false,
                'message' => 'Stock insuficiente para este lote en la ubicación',
                'next_step' => null
            ];
        }

        return [
            'success' => true,
            'message' => 'Lote válido',
            'next_step' => 'quantity',
            'data' => [
                'lote_id' => $lote->id,
                'lote_codigo' => $lote->lote_codigo,
                'cantidad_disponible' => $inventario->cantidad,
                'cantidad_solicitada' => $detalleTarea->cantidad_solicitada,
                'cantidad_pendiente' => $detalleTarea->cantidad_solicitada - $detalleTarea->cantidad_completada
            ]
        ];
    }

    protected function validateQuantity(Tarea $tarea, DetalleTarea $detalleTarea, float $cantidad, ?int $usuarioId): array
    {
        $cantidadPendiente = $detalleTarea->cantidad_solicitada - $detalleTarea->cantidad_completada;

        // Validar que la cantidad no exceda lo pendiente
        if ($cantidad > $cantidadPendiente) {
            return [
                'success' => false,
                'message' => "La cantidad excede lo pendiente. Máximo: {$cantidadPendiente}",
                'next_step' => null
            ];
        }

        // Validar que haya stock disponible
        $ubicacionId = $tarea->tipo_tarea === 'PICK' 
            ? $detalleTarea->ubicacion_origen_id 
            : $detalleTarea->ubicacion_destino_id;

        $inventario = $detalleTarea->lote->inventarios()
            ->where('ubicacion_id', $ubicacionId)
            ->where('estado', 'Disponible')
            ->first();

        if (!$inventario || $inventario->cantidad < $cantidad) {
            return [
                'success' => false,
                'message' => 'Cantidad insuficiente en inventario',
                'next_step' => null
            ];
        }

        try {
            // Procesar el movimiento según el tipo de tarea
            if ($tarea->tipo_tarea === 'PUTAWAY') {
                // Putaway: entrada de stock
                $this->inventoryService->addStock(
                    $detalleTarea->lote_id,
                    $detalleTarea->ubicacion_destino_id,
                    $cantidad,
                    $tarea->id,
                    $usuarioId
                );
            } elseif ($tarea->tipo_tarea === 'PICK') {
                // Picking: salida de stock
                $this->inventoryService->removeStock(
                    $detalleTarea->lote_id,
                    $detalleTarea->ubicacion_origen_id,
                    $cantidad,
                    $tarea->id,
                    $usuarioId
                );
            }

            // Actualizar detalle de tarea
            $detalleTarea->cantidad_completada += $cantidad;
            $detalleTarea->save();

            // Verificar si todas las tareas están completadas
            $todasCompletadas = $tarea->detalleTareas()
                ->whereRaw('cantidad_completada < cantidad_solicitada')
                ->count() === 0;

            if ($todasCompletadas) {
                $tarea->estado = 'COMPLETADA';
                $tarea->fecha_finalizacion = now();
                $tarea->save();
            }

            return [
                'success' => true,
                'message' => 'Cantidad procesada exitosamente',
                'next_step' => $todasCompletadas ? 'completed' : 'location',
                'data' => [
                    'cantidad_completada' => $detalleTarea->cantidad_completada,
                    'cantidad_solicitada' => $detalleTarea->cantidad_solicitada,
                    'tarea_completada' => $todasCompletadas
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Error al procesar cantidad: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al procesar el movimiento: ' . $e->getMessage(),
                'next_step' => null
            ];
        }
    }

    /**
     * Crea una tarea de PUTAWAY asignando ubicación óptima
     * Solo crea detalles de tipo PUTAWAY
     */
    public function createPutawayTask(int $ordenId, int $loteId, float $cantidad, ?int $usuarioId = null): Tarea
    {
        return DB::transaction(function () use ($ordenId, $loteId, $cantidad, $usuarioId) {
            $lote = Lote::with('producto')->findOrFail($loteId);
            $producto = $lote->producto;
            $pesoTotal = ($producto->peso ?? 0) * $cantidad;

            // Encontrar ubicación óptima
            $ubicacion = $this->slottingService->findOptimalLocation($producto, $cantidad, $pesoTotal);

            if (!$ubicacion) {
                // Intentar ubicación de overflow
                $ubicacion = $this->slottingService->findOverflowLocation($producto);
                
                if (!$ubicacion) {
                    throw new \Exception('No se encontró ubicación disponible para el producto');
                }
            }

            // Validar ubicación
            $validacion = $this->slottingService->validateLocation($ubicacion, $producto, $cantidad, $pesoTotal);
            if (!$validacion['valid']) {
                // Crear alerta
                Alerta::create([
                    'tipo' => 'CAPACIDAD_EXCEDIDA',
                    'descripcion' => $validacion['message'],
                    'nivel_riesgo' => 'ALTO',
                    'referencia_id' => $ubicacion->id,
                    'tabla_referencia' => 'Ubicaciones',
                    'estado' => 'PENDIENTE'
                ]);
                throw new \Exception($validacion['message']);
            }

            // Crear tarea PUTAWAY (solo tipo PUTAWAY)
            $tarea = Tarea::create([
                'orden_id' => $ordenId,
                'tipo_tarea' => 'PUTAWAY', // Solo tareas PUTAWAY
                'estado' => 'CREADA',
                'prioridad' => 5,
                'asignada_a_usuario_id' => $usuarioId,
                'fecha_creacion' => now()
            ]);

            // Crear detalle de tarea PUTAWAY (solo tipo PUTAWAY)
            DetalleTarea::create([
                'tarea_id' => $tarea->id,
                'lote_id' => $loteId,
                'cantidad_solicitada' => $cantidad,
                'ubicacion_destino_id' => $ubicacion->id
                // No se establece ubicacion_origen_id porque es una tarea PUTAWAY
            ]);

            return $tarea;
        });
    }

    /**
     * Crea una tarea de PICKING usando estrategia FEFO (un solo producto)
     * @deprecated Usar createPickingTaskWithMultipleProducts para múltiples productos
     */
    public function createPickingTask(int $ordenId, int $productoId, float $cantidad, ?int $usuarioId = null): Tarea
    {
        return $this->createPickingTaskWithMultipleProducts($ordenId, [
            ['producto_id' => $productoId, 'cantidad' => $cantidad]
        ], $usuarioId);
    }

    /**
     * Crea una tarea de PICKING con múltiples productos usando estrategia FEFO
     * Cada producto genera un detalle de tarea PICK
     * 
     * @param int $ordenId ID de la orden de venta
     * @param array $productos Array de productos [['producto_id' => int, 'cantidad' => float], ...]
     * @param int|null $usuarioId ID del usuario asignado
     * @return Tarea Tarea PICKING creada con múltiples detalles
     */
    public function createPickingTaskWithMultipleProducts(int $ordenId, array $productos, ?int $usuarioId = null): Tarea
    {
        return DB::transaction(function () use ($ordenId, $productos, $usuarioId) {
            // Crear una sola tarea PICKING
            $tarea = Tarea::create([
                'orden_id' => $ordenId,
                'tipo_tarea' => 'PICK', // Solo tareas PICK
                'estado' => 'CREADA',
                'prioridad' => 5,
                'asignada_a_usuario_id' => $usuarioId,
                'fecha_creacion' => now()
            ]);

            // Crear un detalle de tarea PICK para cada producto
            foreach ($productos as $productoData) {
                $productoId = $productoData['producto_id'];
                $cantidad = $productoData['cantidad'];

                // Estrategia FEFO: buscar lote con vencimiento más próximo
                $lote = Lote::whereHas('inventarios', function ($query) {
                    $query->where('cantidad', '>', 0)
                          ->where('estado', 'Disponible');
                })
                ->where('producto_id', $productoId)
                ->orderBy('fecha_caducidad', 'asc')
                ->first();

                if (!$lote) {
                    throw new \Exception("No hay stock disponible para el producto ID: {$productoId}");
                }

                // Buscar ubicación con stock de este lote
                $inventario = $lote->inventarios()
                    ->where('cantidad', '>=', $cantidad)
                    ->where('estado', 'Disponible')
                    ->with('ubicacion')
                    ->orderBy('cantidad', 'desc')
                    ->first();

                if (!$inventario) {
                    throw new \Exception("No hay suficiente stock en ninguna ubicación para el producto ID: {$productoId}");
                }

                // Crear detalle de tarea PICK (solo tipo PICK)
                DetalleTarea::create([
                    'tarea_id' => $tarea->id,
                    'lote_id' => $lote->id,
                    'cantidad_solicitada' => $cantidad,
                    'ubicacion_origen_id' => $inventario->ubicacion_id
                    // No se establece ubicacion_destino_id porque es una tarea PICK
                ]);
            }

            return $tarea;
        });
    }
}
