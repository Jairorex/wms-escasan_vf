<?php

namespace App\Services;

use App\Models\Producto;
use App\Models\Subbodega;
use App\Models\Ubicacion;
use App\Models\Inventario;
use App\Models\Reabastecimiento;
use App\Models\DetalleReabastecimiento;
use App\Models\Tarea;
use App\Models\DetalleTarea;
use App\Models\Alerta;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReabastecimientoService
{
    protected CompatibilidadService $compatibilidadService;
    protected InventoryService $inventoryService;

    public function __construct(
        CompatibilidadService $compatibilidadService,
        InventoryService $inventoryService
    ) {
        $this->compatibilidadService = $compatibilidadService;
        $this->inventoryService = $inventoryService;
    }

    /**
     * Verificar y generar reabastecimientos automáticos por stock mínimo
     */
    public function verificarStockMinimo(): array
    {
        $reabastecimientosCreados = [];
        
        // Obtener subbodegas de picking que necesitan reabastecimiento
        $subbodegasPicking = Subbodega::activas()
            ->tipo(Subbodega::TIPO_PICKING)
            ->get();

        foreach ($subbodegasPicking as $subbodega) {
            // Obtener productos con bajo stock en esta subbodega
            $productosBajoStock = $this->getProductosBajoStockEnSubbodega($subbodega);

            if ($productosBajoStock->isNotEmpty()) {
                $reabastecimiento = $this->crearReabastecimientoAutomatico(
                    $subbodega,
                    $productosBajoStock->toArray()
                );
                
                if ($reabastecimiento) {
                    $reabastecimientosCreados[] = $reabastecimiento;
                }
            }
        }

        return $reabastecimientosCreados;
    }

    /**
     * Obtener productos con bajo stock en una subbodega
     */
    protected function getProductosBajoStockEnSubbodega(Subbodega $subbodega): \Illuminate\Support\Collection
    {
        $ubicacionesIds = $subbodega->ubicaciones()->pluck('id');
        
        // Obtener inventario agrupado por producto
        $inventarioPorProducto = Inventario::whereIn('ubicacion_id', $ubicacionesIds)
            ->where('estado', 'Disponible')
            ->with('lote.producto')
            ->get()
            ->groupBy(fn($inv) => $inv->lote->producto_id ?? 0);

        $productosBajoStock = collect();

        foreach ($inventarioPorProducto as $productoId => $inventarios) {
            if ($productoId === 0) continue;
            
            $producto = $inventarios->first()->lote->producto;
            $stockActual = $inventarios->sum('cantidad');
            
            if ($stockActual < $subbodega->stock_minimo) {
                $productosBajoStock->push([
                    'producto' => $producto,
                    'stock_actual' => $stockActual,
                    'stock_minimo' => $subbodega->stock_minimo,
                    'cantidad_sugerida' => max(
                        $subbodega->stock_minimo * 2 - $stockActual,
                        $producto->stock_minimo ?? 10
                    )
                ]);
            }
        }

        return $productosBajoStock;
    }

    /**
     * Crear reabastecimiento automático
     */
    public function crearReabastecimientoAutomatico(
        Subbodega $subbodegaDestino,
        array $productos
    ): ?Reabastecimiento {
        // Buscar subbodega de resguardo como origen
        $subbodegaOrigen = Subbodega::activas()
            ->tipo(Subbodega::TIPO_RESGUARDO)
            ->first();

        if (!$subbodegaOrigen) {
            Log::warning('No se encontró subbodega de resguardo para reabastecimiento automático');
            return null;
        }

        return DB::transaction(function () use ($subbodegaOrigen, $subbodegaDestino, $productos) {
            $reabastecimiento = Reabastecimiento::create([
                'numero_reabastecimiento' => Reabastecimiento::generarNumero('AUTOMATICO'),
                'tipo' => Reabastecimiento::TIPO_AUTOMATICO,
                'subbodega_origen_id' => $subbodegaOrigen->id,
                'subbodega_destino_id' => $subbodegaDestino->id,
                'estado' => Reabastecimiento::ESTADO_PENDIENTE,
                'prioridad' => Reabastecimiento::PRIORIDAD_MEDIA,
                'fecha_solicitud' => now(),
                'observaciones' => 'Generado automáticamente por stock mínimo'
            ]);

            foreach ($productos as $productoData) {
                $producto = $productoData['producto'];
                
                // Buscar lote disponible en origen
                $loteDisponible = $this->buscarLoteDisponibleEnSubbodega(
                    $producto->id,
                    $subbodegaOrigen
                );

                if ($loteDisponible) {
                    DetalleReabastecimiento::create([
                        'reabastecimiento_id' => $reabastecimiento->id,
                        'producto_id' => $producto->id,
                        'lote_id' => $loteDisponible['lote_id'],
                        'cantidad_solicitada' => min(
                            $productoData['cantidad_sugerida'],
                            $loteDisponible['cantidad_disponible']
                        ),
                        'ubicacion_origen_id' => $loteDisponible['ubicacion_id'],
                        'estado' => DetalleReabastecimiento::ESTADO_PENDIENTE
                    ]);
                }
            }

            // Crear alerta para notificar
            Alerta::create([
                'tipo' => 'STOCK_MIN', // Usamos STOCK_MIN para alertas de reabastecimiento
                'descripcion' => "[REABASTECIMIENTO] Automático {$reabastecimiento->numero_reabastecimiento} generado para {$subbodegaDestino->nombre}",
                'nivel_riesgo' => 'BAJO',
                'referencia_id' => $reabastecimiento->id,
                'tabla_referencia' => 'Reabastecimientos',
                'estado' => 'PENDIENTE',
                'fecha_alerta' => now()
            ]);

            return $reabastecimiento;
        });
    }

    /**
     * Buscar lote disponible en subbodega
     */
    protected function buscarLoteDisponibleEnSubbodega(
        int $productoId,
        Subbodega $subbodega
    ): ?array {
        $ubicacionesIds = $subbodega->ubicaciones()->pluck('id');
        
        $inventario = Inventario::whereIn('ubicacion_id', $ubicacionesIds)
            ->where('estado', 'Disponible')
            ->whereHas('lote', fn($q) => $q->where('producto_id', $productoId))
            ->with('lote')
            ->orderBy('cantidad', 'desc')
            ->first();

        if (!$inventario) {
            return null;
        }

        return [
            'lote_id' => $inventario->lote_id,
            'ubicacion_id' => $inventario->ubicacion_id,
            'cantidad_disponible' => $inventario->cantidad
        ];
    }

    /**
     * Generar reabastecimientos programados (quincenal)
     */
    public function generarReabastecimientosProgramados(): array
    {
        $reabastecimientosCreados = [];
        $hoy = Carbon::now()->toDateString();

        // Buscar configuraciones de reabastecimiento programado
        $configuraciones = DB::table('Configuracion_Reabastecimiento')
            ->where('activo', true)
            ->where('proximo_reabastecimiento', '<=', $hoy)
            ->get();

        foreach ($configuraciones as $config) {
            $subbodega = Subbodega::find($config->subbodega_id);
            
            if (!$subbodega) continue;

            // Obtener productos a reabastecer
            $productos = [];
            
            if ($config->producto_id) {
                // Producto específico
                $producto = Producto::find($config->producto_id);
                if ($producto) {
                    $productos[] = [
                        'producto' => $producto,
                        'cantidad_sugerida' => $config->cantidad_reabastecimiento
                    ];
                }
            } else {
                // Todos los productos de la subbodega
                $productosBajoStock = $this->getProductosBajoStockEnSubbodega($subbodega);
                $productos = $productosBajoStock->toArray();
            }

            if (!empty($productos)) {
                $reabastecimiento = $this->crearReabastecimientoProgramado(
                    $subbodega,
                    $productos,
                    $config
                );

                if ($reabastecimiento) {
                    $reabastecimientosCreados[] = $reabastecimiento;
                    
                    // Actualizar próximo reabastecimiento
                    DB::table('Configuracion_Reabastecimiento')
                        ->where('id', $config->id)
                        ->update([
                            'proximo_reabastecimiento' => Carbon::now()
                                ->addDays($config->dias_entre_reabastecimientos)
                                ->toDateString()
                        ]);
                }
            }
        }

        return $reabastecimientosCreados;
    }

    /**
     * Crear reabastecimiento programado
     */
    protected function crearReabastecimientoProgramado(
        Subbodega $subbodegaDestino,
        array $productos,
        object $config
    ): ?Reabastecimiento {
        $subbodegaOrigen = Subbodega::activas()
            ->tipo(Subbodega::TIPO_RESGUARDO)
            ->first();

        if (!$subbodegaOrigen) {
            return null;
        }

        return DB::transaction(function () use ($subbodegaOrigen, $subbodegaDestino, $productos) {
            $reabastecimiento = Reabastecimiento::create([
                'numero_reabastecimiento' => Reabastecimiento::generarNumero('PROGRAMADO'),
                'tipo' => Reabastecimiento::TIPO_PROGRAMADO,
                'subbodega_origen_id' => $subbodegaOrigen->id,
                'subbodega_destino_id' => $subbodegaDestino->id,
                'estado' => Reabastecimiento::ESTADO_PENDIENTE,
                'prioridad' => Reabastecimiento::PRIORIDAD_BAJA,
                'fecha_solicitud' => now(),
                'fecha_programada' => now(),
                'observaciones' => 'Reabastecimiento quincenal programado'
            ]);

            foreach ($productos as $productoData) {
                $producto = $productoData['producto'];
                
                $loteDisponible = $this->buscarLoteDisponibleEnSubbodega(
                    $producto->id,
                    $subbodegaOrigen
                );

                if ($loteDisponible) {
                    DetalleReabastecimiento::create([
                        'reabastecimiento_id' => $reabastecimiento->id,
                        'producto_id' => $producto->id,
                        'lote_id' => $loteDisponible['lote_id'],
                        'cantidad_solicitada' => $productoData['cantidad_sugerida'],
                        'ubicacion_origen_id' => $loteDisponible['ubicacion_id'],
                        'estado' => DetalleReabastecimiento::ESTADO_PENDIENTE
                    ]);
                }
            }

            return $reabastecimiento;
        });
    }

    /**
     * Crear reabastecimiento manual
     */
    public function crearReabastecimientoManual(
        int $subbodegaOrigenId,
        int $subbodegaDestinoId,
        array $productos,
        int $usuarioId,
        string $prioridad = 'MEDIA',
        ?string $observaciones = null
    ): Reabastecimiento {
        return DB::transaction(function () use (
            $subbodegaOrigenId, 
            $subbodegaDestinoId, 
            $productos, 
            $usuarioId,
            $prioridad,
            $observaciones
        ) {
            $reabastecimiento = Reabastecimiento::create([
                'numero_reabastecimiento' => Reabastecimiento::generarNumero('MANUAL'),
                'tipo' => Reabastecimiento::TIPO_MANUAL,
                'subbodega_origen_id' => $subbodegaOrigenId,
                'subbodega_destino_id' => $subbodegaDestinoId,
                'estado' => Reabastecimiento::ESTADO_PENDIENTE,
                'prioridad' => $prioridad,
                'solicitado_por' => $usuarioId,
                'fecha_solicitud' => now(),
                'observaciones' => $observaciones
            ]);

            foreach ($productos as $productoData) {
                DetalleReabastecimiento::create([
                    'reabastecimiento_id' => $reabastecimiento->id,
                    'producto_id' => $productoData['producto_id'],
                    'lote_id' => $productoData['lote_id'] ?? null,
                    'cantidad_solicitada' => $productoData['cantidad'],
                    'ubicacion_origen_id' => $productoData['ubicacion_origen_id'] ?? null,
                    'ubicacion_destino_id' => $productoData['ubicacion_destino_id'] ?? null,
                    'estado' => DetalleReabastecimiento::ESTADO_PENDIENTE
                ]);
            }

            return $reabastecimiento;
        });
    }

    /**
     * Ejecutar reabastecimiento (crear tareas de movimiento)
     */
    public function ejecutarReabastecimiento(
        Reabastecimiento $reabastecimiento,
        int $usuarioId
    ): array {
        $tareasCreadas = [];

        $reabastecimiento->iniciarEjecucion($usuarioId);

        foreach ($reabastecimiento->detalles as $detalle) {
            if ($detalle->estado === DetalleReabastecimiento::ESTADO_CANCELADO) {
                continue;
            }

            // Crear tarea de movimiento (sin asignar operario - se asignará después)
            $tarea = Tarea::create([
                'orden_id' => null,
                'tipo_tarea' => 'REABASTECER',
                'estado' => 'CREADA',
                'prioridad' => $this->mapearPrioridad($reabastecimiento->prioridad),
                'asignada_a_usuario_id' => null, // Sin asignar - se asignará manualmente
                'fecha_creacion' => now()
            ]);

            DetalleTarea::create([
                'tarea_id' => $tarea->id,
                'lote_id' => $detalle->lote_id,
                'cantidad_solicitada' => $detalle->cantidad_aprobada ?? $detalle->cantidad_solicitada,
                'ubicacion_origen_id' => $detalle->ubicacion_origen_id,
                'ubicacion_destino_id' => $detalle->ubicacion_destino_id
            ]);

            $tareasCreadas[] = $tarea;
        }

        return $tareasCreadas;
    }

    /**
     * Mapear prioridad de reabastecimiento a prioridad de tarea
     */
    protected function mapearPrioridad(string $prioridad): int
    {
        return match($prioridad) {
            'URGENTE' => 10,
            'ALTA' => 8,
            'MEDIA' => 5,
            'BAJA' => 3,
            default => 5
        };
    }
}

