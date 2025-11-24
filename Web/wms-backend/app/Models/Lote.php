<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lote extends Model
{
    protected $table = 'Lotes';
    
    // --- AGREGA ESTO PARA EVITAR EL ERROR 500 ---
    public $timestamps = false;
    // --------------------------------------------

    protected $fillable = [
        'lote_codigo',
        'producto_id',
        'cantidad_original',
        'fecha_fabricacion',
        'fecha_caducidad'
    ];

    protected $casts = [
        'cantidad_original' => 'decimal:2',
        'fecha_caducidad' => 'date',
        'fecha_fabricacion' => 'date'
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function incidencias(): HasMany
    {
        return $this->hasMany(Incidencia::class, 'lote_id');
    }

    public function inventarios(): HasMany
    {
        return $this->hasMany(Inventario::class, 'lote_id');
    }

    public function detalleTareas(): HasMany
    {
        return $this->hasMany(DetalleTarea::class, 'lote_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'lote_id');
    }

    public function alertas(): HasMany
    {
        return $this->hasMany(Alerta::class, 'lote_id');
    }
}