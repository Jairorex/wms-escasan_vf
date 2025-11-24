<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoUbicacion extends Model
{
    protected $table = 'Tipos_Ubicacion';
    
    public $timestamps = false;
    
    protected $fillable = [
        'nombre',
        'es_picking',
        'es_reserva',
        'temperatura_min'
    ];

    protected $casts = [
        'es_picking' => 'boolean',
        'es_reserva' => 'boolean',
        'temperatura_min' => 'decimal:2'
    ];

    public function ubicaciones(): HasMany
    {
        return $this->hasMany(Ubicacion::class, 'tipo_ubicacion_id');
    }
}

