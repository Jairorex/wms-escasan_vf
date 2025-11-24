<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    protected $table = 'Productos';
    public $timestamps = false;
    protected $fillable = [
        'sku',
        'nombre',
        'descripcion',
        'peso',
        'volumen',
        'clasificacion_id',
        'tipo_producto_id'
    ];

    protected $casts = [
        'peso' => 'decimal:2',
        'volumen' => 'decimal:2'
    ];

    public function clasificacion(): BelongsTo
    {
        return $this->belongsTo(Clasificacion::class, 'clasificacion_id');
    }

    public function tipoProducto(): BelongsTo
    {
        return $this->belongsTo(TipoProducto::class, 'tipo_producto_id');
    }

    public function lotes(): HasMany
    {
        return $this->hasMany(Lote::class, 'producto_id');
    }

    // Inventario se relaciona a través de Lote, no directamente
}

