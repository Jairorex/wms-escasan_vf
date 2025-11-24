<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventario extends Model
{
    protected $table = 'Inventario';
    
    public $timestamps = false;
    
    protected $fillable = [
        'lote_id',
        'ubicacion_id',
        'cantidad',
        'estado'
    ];

    protected $casts = [
        'cantidad' => 'decimal:2'
    ];

    // Producto se obtiene a través de Lote
    public function producto()
    {
        return $this->lote->producto ?? null;
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class, 'lote_id');
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_id');
    }
}

