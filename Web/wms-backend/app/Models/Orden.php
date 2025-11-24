<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Orden extends Model
{
    protected $table = 'Ordenes';
    public $timestamps = false;

    protected $fillable = [
        'tipo_orden',
        'estado',
        'referencia_externa',
        'fecha_creacion',
        'cliente_proveedor'
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime'
    ];

    public function tareas(): HasMany
    {
        return $this->hasMany(Tarea::class, 'orden_id');
    }
}

