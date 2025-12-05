<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleReabastecimiento extends Model
{
    protected $table = 'Detalle_Reabastecimientos';
    public $timestamps = false;

    protected $fillable = [
        'reabastecimiento_id',
        'producto_id',
        'lote_id',
        'cantidad_solicitada',
        'cantidad_aprobada',
        'cantidad_enviada',
        'ubicacion_origen_id',
        'ubicacion_destino_id',
        'estado',
        'observaciones'
    ];

    protected $casts = [
        'cantidad_solicitada' => 'decimal:2',
        'cantidad_aprobada' => 'decimal:2',
        'cantidad_enviada' => 'decimal:2'
    ];

    // Estados
    const ESTADO_PENDIENTE = 'PENDIENTE';
    const ESTADO_PARCIAL = 'PARCIAL';
    const ESTADO_COMPLETADO = 'COMPLETADO';
    const ESTADO_CANCELADO = 'CANCELADO';

    /**
     * Relación con reabastecimiento
     */
    public function reabastecimiento(): BelongsTo
    {
        return $this->belongsTo(Reabastecimiento::class, 'reabastecimiento_id');
    }

    /**
     * Relación con producto
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    /**
     * Relación con lote
     */
    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class, 'lote_id');
    }

    /**
     * Relación con ubicación origen
     */
    public function ubicacionOrigen(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_origen_id');
    }

    /**
     * Relación con ubicación destino
     */
    public function ubicacionDestino(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_destino_id');
    }

    /**
     * Calcular cantidad pendiente
     */
    public function getCantidadPendiente(): float
    {
        $cantidadAprobada = $this->cantidad_aprobada ?? $this->cantidad_solicitada;
        return max(0, $cantidadAprobada - $this->cantidad_enviada);
    }

    /**
     * Verificar si está completo
     */
    public function estaCompleto(): bool
    {
        return $this->getCantidadPendiente() <= 0;
    }
}

