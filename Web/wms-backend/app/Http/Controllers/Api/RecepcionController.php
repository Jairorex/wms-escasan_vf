<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recepcion;
use App\Models\DetalleRecepcion;
use App\Models\Producto;
use App\Models\Lote;
use App\Models\Subbodega;
use App\Services\TemperaturaService;
use App\Services\CompatibilidadService;
use App\Services\InventoryService;
use App\Services\TaskEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class RecepcionController extends Controller
{
    protected TemperaturaService $temperaturaService;
    protected CompatibilidadService $compatibilidadService;
    protected InventoryService $inventoryService;
    protected TaskEngineService $taskEngineService;

    public function __construct(
        TemperaturaService $temperaturaService,
        CompatibilidadService $compatibilidadService,
        InventoryService $inventoryService,
        TaskEngineService $taskEngineService
    ) {
        $this->temperaturaService = $temperaturaService;
        $this->compatibilidadService = $compatibilidadService;
        $this->inventoryService = $inventoryService;
        $this->taskEngineService = $taskEngineService;
    }

    /**
     * Listar recepciones
     */
    public function index(Request $request): JsonResponse
    {
        $query = Recepcion::with(['subbodegaDestino', 'usuario', 'orden']);

        // Filtros
        if ($request->has('tipo_recepcion')) {
            $query->where('tipo_recepcion', $request->tipo_recepcion);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('fecha_desde')) {
            $query->whereDate('fecha_recepcion', '>=', $request->fecha_desde);
        }

        if ($request->has('fecha_hasta')) {
            $query->whereDate('fecha_recepcion', '<=', $request->fecha_hasta);
        }

        $recepciones = $query->orderBy('fecha_recepcion', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $recepciones
        ]);
    }

    /**
     * Obtener una recepción específica
     */
    public function show(int $id): JsonResponse
    {
        $recepcion = Recepcion::with([
            'subbodegaDestino',
            'usuario',
            'orden',
            'detalles.producto',
            'detalles.lote',
            'detalles.ubicacionDestino'
        ])->find($id);

        if (!$recepcion) {
            return response()->json([
                'success' => false,
                'message' => 'Recepción no encontrada'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $recepcion
        ]);
    }

    /**
     * Crear recepción estándar
     */
    public function crearRecepcionEstandar(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'proveedor' => 'nullable|string|max:100',
            'documento_proveedor' => 'nullable|string|max:50',
            'subbodega_destino_id' => 'nullable|integer|exists:Subbodegas,id',
            'observaciones' => 'nullable|string',
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|integer|exists:Productos,id',
            'productos.*.cantidad_esperada' => 'required|numeric|min:0.01',
            'productos.*.lote_codigo' => 'required|string|max:50',
            'productos.*.fecha_caducidad' => 'required|date',
            'productos.*.fecha_fabricacion' => 'nullable|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                // Determinar subbodega destino
                $subbodegaDestinoId = $request->subbodega_destino_id;
                
                if (!$subbodegaDestinoId) {
                    // Asignar subbodega de resguardo por defecto
                    $subbodega = Subbodega::activas()->tipo(Subbodega::TIPO_RESGUARDO)->first();
                    $subbodegaDestinoId = $subbodega?->id;
                }

                // Crear recepción
                $recepcion = Recepcion::create([
                    'numero_recepcion' => Recepcion::generarNumeroRecepcion('ESTANDAR'),
                    'tipo_recepcion' => Recepcion::TIPO_ESTANDAR,
                    'proveedor' => $request->proveedor,
                    'documento_proveedor' => $request->documento_proveedor,
                    'subbodega_destino_id' => $subbodegaDestinoId,
                    'estado' => Recepcion::ESTADO_EN_PROCESO,
                    'usuario_id' => $request->user()?->id,
                    'observaciones' => $request->observaciones
                ]);

                // Crear detalles y lotes
                foreach ($request->productos as $productoData) {
                    $producto = Producto::find($productoData['producto_id']);

                    // Verificar compatibilidad
                    if ($subbodegaDestinoId) {
                        $subbodega = Subbodega::find($subbodegaDestinoId);
                        $compatibilidad = $this->compatibilidadService
                            ->verificarCompatibilidadProductoSubbodega($producto, $subbodega);
                        
                        if (!$compatibilidad['compatible']) {
                            throw new \Exception("Producto {$producto->nombre} no es compatible con la subbodega: {$compatibilidad['mensaje']}");
                        }
                    }

                    // Crear o buscar lote
                    $lote = Lote::firstOrCreate(
                        ['lote_codigo' => $productoData['lote_codigo']],
                        [
                            'producto_id' => $productoData['producto_id'],
                            'fecha_caducidad' => $productoData['fecha_caducidad'],
                            'fecha_fabricacion' => $productoData['fecha_fabricacion'] ?? null,
                            'cantidad_original' => $productoData['cantidad_esperada']
                        ]
                    );

                    // Crear detalle de recepción
                    $detalle = DetalleRecepcion::create([
                        'recepcion_id' => $recepcion->id,
                        'producto_id' => $productoData['producto_id'],
                        'lote_id' => $lote->id,
                        'cantidad_esperada' => $productoData['cantidad_esperada'],
                        'cantidad_recibida' => $productoData['cantidad_esperada'],
                        'estado' => DetalleRecepcion::ESTADO_RECIBIDO
                    ]);

                    // Generar código de barras
                    $detalle->generarCodigoBarras();

                    // Encontrar ubicación óptima
                    $ubicacion = $this->compatibilidadService->encontrarUbicacionOptima(
                        $producto,
                        $productoData['cantidad_esperada'],
                        $subbodegaDestinoId
                    );

                    if ($ubicacion) {
                        $detalle->update(['ubicacion_destino_id' => $ubicacion->id]);
                        
                        // Agregar al inventario
                        $this->inventoryService->addStock(
                            $lote->id,
                            $ubicacion->id,
                            $productoData['cantidad_esperada'],
                            null,
                            $request->user()?->id
                        );
                    }
                }

                // Completar recepción
                $recepcion->completar();

                return response()->json([
                    'success' => true,
                    'message' => 'Recepción estándar completada exitosamente',
                    'data' => $recepcion->load(['detalles.producto', 'detalles.lote', 'subbodegaDestino'])
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('Error en recepción estándar: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar recepción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear recepción de cadena fría
     */
    public function crearRecepcionCadenaFria(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'proveedor' => 'nullable|string|max:100',
            'documento_proveedor' => 'nullable|string|max:50',
            'temperatura_recibida' => 'required|numeric',
            'subbodega_destino_id' => 'nullable|integer|exists:Subbodegas,id',
            'observaciones' => 'nullable|string',
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|integer|exists:Productos,id',
            'productos.*.cantidad_esperada' => 'required|numeric|min:0.01',
            'productos.*.lote_codigo' => 'required|string|max:50',
            'productos.*.fecha_caducidad' => 'required|date',
            'productos.*.fecha_fabricacion' => 'nullable|date',
            'productos.*.temperatura_producto' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                // Determinar subbodega destino (debe ser cadena fría)
                $subbodegaDestinoId = $request->subbodega_destino_id;
                
                if (!$subbodegaDestinoId) {
                    $subbodega = Subbodega::activas()->cadenaFria()->first();
                    if (!$subbodega) {
                        throw new \Exception('No existe subbodega de cadena fría configurada');
                    }
                    $subbodegaDestinoId = $subbodega->id;
                } else {
                    $subbodega = Subbodega::find($subbodegaDestinoId);
                    if (!$subbodega->requiereControlTemperatura()) {
                        throw new \Exception('La subbodega seleccionada no tiene control de temperatura');
                    }
                }

                $subbodega = Subbodega::find($subbodegaDestinoId);

                // Validar temperatura de recepción
                $validacionTemp = $subbodega->validarTemperatura($request->temperatura_recibida);
                $temperaturaValida = $validacionTemp['valido'];

                // Crear recepción
                $recepcion = Recepcion::create([
                    'numero_recepcion' => Recepcion::generarNumeroRecepcion('CADENA_FRIA'),
                    'tipo_recepcion' => Recepcion::TIPO_CADENA_FRIA,
                    'proveedor' => $request->proveedor,
                    'documento_proveedor' => $request->documento_proveedor,
                    'subbodega_destino_id' => $subbodegaDestinoId,
                    'temperatura_recibida' => $request->temperatura_recibida,
                    'temperatura_valida' => $temperaturaValida,
                    'observaciones_temperatura' => $validacionTemp['mensaje'],
                    'estado' => $temperaturaValida 
                        ? Recepcion::ESTADO_EN_PROCESO 
                        : Recepcion::ESTADO_PENDIENTE,
                    'usuario_id' => $request->user()?->id,
                    'observaciones' => $request->observaciones
                ]);

                // Registrar lectura de temperatura
                $this->temperaturaService->registrarLecturaSubbodega(
                    $subbodega,
                    $request->temperatura_recibida,
                    null,
                    $request->user()?->id,
                    'RECEPCION'
                );

                // Si temperatura no es válida, crear alerta y posiblemente rechazar
                if (!$temperaturaValida) {
                    // Buscar subbodega de cuarentena
                    $subbodegaCuarentena = Subbodega::activas()
                        ->tipo(Subbodega::TIPO_CUARENTENA)
                        ->first();

                    if ($subbodegaCuarentena) {
                        $recepcion->update([
                            'subbodega_destino_id' => $subbodegaCuarentena->id,
                            'observaciones_temperatura' => $validacionTemp['mensaje'] . ' - Enviado a cuarentena'
                        ]);
                    }

                    return response()->json([
                        'success' => false,
                        'message' => 'Temperatura fuera de rango - Recepción en espera de revisión',
                        'data' => [
                            'recepcion' => $recepcion,
                            'validacion_temperatura' => $validacionTemp,
                            'accion_requerida' => 'Revisar producto y decidir: rechazar, enviar a cuarentena o aprobar con excepción'
                        ]
                    ], 400);
                }

                // Procesar productos si temperatura es válida
                foreach ($request->productos as $productoData) {
                    $producto = Producto::find($productoData['producto_id']);

                    // Validar temperatura del producto si se proporciona
                    $tempProductoValida = true;
                    if (isset($productoData['temperatura_producto']) && $producto->requiereControlTemperatura()) {
                        $validacionProd = $this->temperaturaService
                            ->validarTemperaturaProducto($producto, $productoData['temperatura_producto']);
                        $tempProductoValida = $validacionProd['valido'];
                    }

                    // Crear lote
                    $lote = Lote::firstOrCreate(
                        ['lote_codigo' => $productoData['lote_codigo']],
                        [
                            'producto_id' => $productoData['producto_id'],
                            'fecha_caducidad' => $productoData['fecha_caducidad'],
                            'fecha_fabricacion' => $productoData['fecha_fabricacion'] ?? null,
                            'cantidad_original' => $productoData['cantidad_esperada']
                        ]
                    );

                    // Crear detalle
                    $detalle = DetalleRecepcion::create([
                        'recepcion_id' => $recepcion->id,
                        'producto_id' => $productoData['producto_id'],
                        'lote_id' => $lote->id,
                        'cantidad_esperada' => $productoData['cantidad_esperada'],
                        'cantidad_recibida' => $tempProductoValida ? $productoData['cantidad_esperada'] : 0,
                        'cantidad_rechazada' => $tempProductoValida ? 0 : $productoData['cantidad_esperada'],
                        'temperatura_producto' => $productoData['temperatura_producto'] ?? null,
                        'temperatura_aceptable' => $tempProductoValida,
                        'estado' => $tempProductoValida 
                            ? DetalleRecepcion::ESTADO_RECIBIDO 
                            : DetalleRecepcion::ESTADO_RECHAZADO,
                        'motivo_rechazo' => $tempProductoValida ? null : 'Temperatura del producto fuera de rango'
                    ]);

                    if ($tempProductoValida) {
                        $detalle->generarCodigoBarras();

                        // Encontrar ubicación con control de temperatura
                        $ubicacion = $this->compatibilidadService->encontrarUbicacionOptima(
                            $producto,
                            $productoData['cantidad_esperada'],
                            $subbodegaDestinoId
                        );

                        if ($ubicacion) {
                            $detalle->update(['ubicacion_destino_id' => $ubicacion->id]);
                            
                            $this->inventoryService->addStock(
                                $lote->id,
                                $ubicacion->id,
                                $productoData['cantidad_esperada'],
                                null,
                                $request->user()?->id
                            );
                        }
                    }
                }

                $recepcion->completar();

                return response()->json([
                    'success' => true,
                    'message' => 'Recepción de cadena fría completada exitosamente',
                    'data' => $recepcion->load(['detalles.producto', 'detalles.lote', 'subbodegaDestino'])
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('Error en recepción cadena fría: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar recepción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Aprobar recepción rechazada por temperatura
     */
    public function aprobarConExcepcion(Request $request, int $id): JsonResponse
    {
        $recepcion = Recepcion::find($id);

        if (!$recepcion) {
            return response()->json([
                'success' => false,
                'message' => 'Recepción no encontrada'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'motivo_excepcion' => 'required|string|max:500',
            'aprobado_por' => 'nullable|integer|exists:Usuarios,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $recepcion->update([
            'estado' => Recepcion::ESTADO_COMPLETADA,
            'observaciones' => $recepcion->observaciones . "\n[EXCEPCIÓN] " . $request->motivo_excepcion,
            'fecha_completada' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Recepción aprobada con excepción',
            'data' => $recepcion
        ]);
    }

    /**
     * Rechazar recepción
     */
    public function rechazar(Request $request, int $id): JsonResponse
    {
        $recepcion = Recepcion::find($id);

        if (!$recepcion) {
            return response()->json([
                'success' => false,
                'message' => 'Recepción no encontrada'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'motivo_rechazo' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $recepcion->rechazar($request->motivo_rechazo);

        // Mover a subbodega de destrucción si existe
        $subbodegaDestruccion = Subbodega::activas()
            ->tipo(Subbodega::TIPO_DESTRUCCION)
            ->first();

        if ($subbodegaDestruccion) {
            $recepcion->update(['subbodega_destino_id' => $subbodegaDestruccion->id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Recepción rechazada',
            'data' => $recepcion
        ]);
    }

    /**
     * Obtener estadísticas de recepciones
     */
    public function estadisticas(Request $request): JsonResponse
    {
        $fechaDesde = $request->fecha_desde ?? now()->subDays(30);
        $fechaHasta = $request->fecha_hasta ?? now();

        $stats = [
            'total' => Recepcion::whereBetween('fecha_recepcion', [$fechaDesde, $fechaHasta])->count(),
            'por_tipo' => Recepcion::whereBetween('fecha_recepcion', [$fechaDesde, $fechaHasta])
                ->selectRaw('tipo_recepcion, COUNT(*) as total')
                ->groupBy('tipo_recepcion')
                ->get(),
            'por_estado' => Recepcion::whereBetween('fecha_recepcion', [$fechaDesde, $fechaHasta])
                ->selectRaw('estado, COUNT(*) as total')
                ->groupBy('estado')
                ->get(),
            'rechazadas_temperatura' => Recepcion::whereBetween('fecha_recepcion', [$fechaDesde, $fechaHasta])
                ->where('temperatura_valida', false)
                ->count(),
            'promedio_diario' => Recepcion::whereBetween('fecha_recepcion', [$fechaDesde, $fechaHasta])
                ->count() / max(1, now()->diffInDays($fechaDesde))
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

