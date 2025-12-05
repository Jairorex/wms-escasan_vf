<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Movimiento extends Model
{
    protected $table = 'Movimientos';
    public $timestamps = false;
    
    protected $fillable = [
        'producto_id',
        'lote_id',
        'cantidad',
        'tipo_movimiento',
        'ubicacion_origen_id',
        'ubicacion_destino_id',
        'usuario_id',
        'tarea_id',
        'fecha_movimiento',
        'motivo',
        'referencia'
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'fecha_movimiento' => 'datetime'
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class, 'lote_id');
    }

    public function ubicacionOrigen(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_origen_id');
    }

    public function ubicacionDestino(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_destino_id');
    }

    public function tarea(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}

