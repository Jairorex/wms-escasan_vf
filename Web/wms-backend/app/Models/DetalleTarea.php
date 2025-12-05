<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleTarea extends Model
{
    protected $table = 'Detalle_Tarea';
    public $timestamps = false;

    protected $fillable = [
        'tarea_id',
        'lote_id',
        'producto_id',
        'cantidad_solicitada',
        'cantidad_completada',
        'ubicacion_origen_id',
        'ubicacion_destino_id'
    ];

    protected $casts = [
        'cantidad_solicitada' => 'decimal:2',
        'cantidad_completada' => 'decimal:2'
    ];

    public function tarea(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id');
    }

    public function ubicacionOrigen(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_origen_id');
    }

    public function ubicacionDestino(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_destino_id');
    }

    // Producto se obtiene a través de Lote
    public function producto()
    {
        return $this->lote->producto ?? null;
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class, 'lote_id');
    }
}

