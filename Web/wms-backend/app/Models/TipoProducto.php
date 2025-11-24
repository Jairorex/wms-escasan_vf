<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoProducto extends Model
{
    protected $table = 'Tipos_Producto';
    
    public $timestamps = false;
    
    protected $fillable = [
        'nombre',
        'manejo_especial'
    ];

    protected $casts = [
        'manejo_especial' => 'boolean'
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'tipo_producto_id');
    }
}

