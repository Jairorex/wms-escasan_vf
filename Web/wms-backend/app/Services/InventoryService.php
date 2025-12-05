<?php

namespace App\Services;

use App\Models\Inventario;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\Lote;
use App\Models\Ubicacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Mueve stock de una ubicación a otra
     * 
     * @param int $loteId
     * @param int $ubicacionOrigenId
     * @param int $ubicacionDestinoId
     * @param float $cantidad
     * @param int|null $tareaId
     * @param int|null $usuarioId
     * @return array
     */
    public function moveStock(
        int $loteId,
        int $ubicacionOrigenId,
        int $ubicacionDestinoId,
        float $cantidad,
        ?int $tareaId = null,
        ?int $usuarioId = null
    ): array {
        return DB::transaction(function () use (
            $loteId,
            $ubicacionOrigenId,
            $ubicacionDestinoId,
            $cantidad,
            $tareaId,
            $usuarioId
        ) {
            try {
                // Obtener inventario origen
                $inventarioOrigen = Inventario::where('lote_id', $loteId)
                    ->where('ubicacion_id', $ubicacionOrigenId)
                    ->firstOrFail();

                // Validar que hay suficiente cantidad
                if ($inventarioOrigen->cantidad < $cantidad) {
                    throw new \Exception("Cantidad insuficiente en origen. Disponible: {$inventarioOrigen->cantidad}, Solicitado: {$cantidad}");
                }

                // Actualizar inventario origen
                $inventarioOrigen->cantidad -= $cantidad;
                
                if ($inventarioOrigen->cantidad <= 0) {
                    $inventarioOrigen->delete();
                } else {
                    $inventarioOrigen->save();
                }

                // Obtener o crear inventario destino
                $inventarioDestino = Inventario::firstOrNew([
                    'lote_id' => $loteId,
                    'ubicacion_id' => $ubicacionDestinoId
                ]);

                $inventarioDestino->cantidad += $cantidad;
                $inventarioDestino->estado = 'Disponible';
                $inventarioDestino->save();

                // Crear registro de movimiento
                Movimiento::create([
                    'lote_id' => $loteId,
                    'cantidad' => $cantidad,
                    'ubicacion_origen_id' => $ubicacionOrigenId,
                    'ubicacion_destino_id' => $ubicacionDestinoId,
                    'tarea_id' => $tareaId,
                    'usuario_id' => $usuarioId,
                    'fecha_movimiento' => now()
                ]);

                return [
                    'success' => true,
                    'message' => 'Stock movido exitosamente'
                ];

            } catch (\Exception $e) {
                Log::error('Error al mover stock: ' . $e->getMessage());
                throw $e;
            }
        });
    }

    /**
     * Agrega stock (entrada)
     * 
     * @param int $loteId
     * @param int $ubicacionId
     * @param float $cantidad
     * @param int|null $tareaId
     * @param int|null $usuarioId
     * @param int|null $ubicacionOrigenId Si es null, se asume que viene de recepción (origen externo)
     * @return array
     */
    public function addStock(
        int $loteId,
        int $ubicacionId,
        float $cantidad,
        ?int $tareaId = null,
        ?int $usuarioId = null,
        ?int $ubicacionOrigenId = null
    ): array {
        return DB::transaction(function () use ($loteId, $ubicacionId, $cantidad, $tareaId, $usuarioId, $ubicacionOrigenId) {
            // Obtener o crear inventario
            $inventario = Inventario::firstOrNew([
                'lote_id' => $loteId,
                'ubicacion_id' => $ubicacionId
            ]);

            $inventario->cantidad += $cantidad;
            $inventario->estado = 'Disponible';
            $inventario->save();

            // Crear registro de movimiento
            // Si ubicacionOrigenId es null, significa que viene de recepción (origen externo)
            Movimiento::create([
                'lote_id' => $loteId,
                'cantidad' => $cantidad,
                'ubicacion_origen_id' => $ubicacionOrigenId, // null = RECEPCION
                'ubicacion_destino_id' => $ubicacionId,
                'tarea_id' => $tareaId,
                'usuario_id' => $usuarioId,
                'fecha_movimiento' => now()
            ]);

            return [
                'success' => true,
                'message' => 'Stock agregado exitosamente'
            ];
        });
    }

    /**
     * Remueve stock (salida)
     * 
     * @param int $loteId
     * @param int $ubicacionId
     * @param float $cantidad
     * @param int|null $tareaId
     * @param int|null $usuarioId
     * @return array
     */
    public function removeStock(
        int $loteId,
        int $ubicacionId,
        float $cantidad,
        ?int $tareaId = null,
        ?int $usuarioId = null
    ): array {
        return DB::transaction(function () use ($loteId, $ubicacionId, $cantidad, $tareaId, $usuarioId) {
            // Obtener inventario
            $inventario = Inventario::where('lote_id', $loteId)
                ->where('ubicacion_id', $ubicacionId)
                ->firstOrFail();

            // Validar cantidad
            if ($inventario->cantidad < $cantidad) {
                throw new \Exception("Cantidad insuficiente. Disponible: {$inventario->cantidad}, Solicitado: {$cantidad}");
            }

            // Actualizar inventario
            $inventario->cantidad -= $cantidad;

            if ($inventario->cantidad <= 0) {
                $inventario->delete();
            } else {
                $inventario->save();
            }

            // Crear registro de movimiento
            Movimiento::create([
                'lote_id' => $loteId,
                'cantidad' => $cantidad,
                'ubicacion_origen_id' => $ubicacionId,
                'tarea_id' => $tareaId,
                'usuario_id' => $usuarioId,
                'fecha_movimiento' => now()
            ]);

            return [
                'success' => true,
                'message' => 'Stock removido exitosamente'
            ];
        });
    }

    /**
     * Ajuste de inventario (inventario físico vs sistema)
     * 
     * @param int $loteId
     * @param int $ubicacionId
     * @param float $cantidadReal
     * @param int|null $usuarioId
     * @return array
     */
    public function adjustStock(
        int $loteId,
        int $ubicacionId,
        float $cantidadReal,
        ?int $usuarioId = null
    ): array {
        return DB::transaction(function () use ($loteId, $ubicacionId, $cantidadReal, $usuarioId) {
            $inventario = Inventario::firstOrNew([
                'lote_id' => $loteId,
                'ubicacion_id' => $ubicacionId
            ]);

            $cantidadAnterior = $inventario->cantidad ?? 0;
            $diferencia = $cantidadReal - $cantidadAnterior;

            $inventario->cantidad = $cantidadReal;
            $inventario->estado = 'Disponible';
            $inventario->save();

            // Crear registro de movimiento
            Movimiento::create([
                'lote_id' => $loteId,
                'cantidad' => $diferencia,
                'ubicacion_destino_id' => $ubicacionId,
                'usuario_id' => $usuarioId,
                'fecha_movimiento' => now()
            ]);

            return [
                'success' => true,
                'message' => 'Inventario ajustado exitosamente',
                'diferencia' => $diferencia
            ];
        });
    }
}
