<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ubicacion extends Model
{
    protected $table = 'Ubicaciones';
    public $timestamps = false;
    protected $fillable = [
        'codigo',
        'zona',
        'pasillo',
        'estante',
        'nivel',
        'tipo_ubicacion_id',
        'max_peso',
        'max_cantidad'
    ];

    protected $casts = [
        'max_peso' => 'decimal:2',
        'max_cantidad' => 'integer'
    ];

    public function tipoUbicacion(): BelongsTo
    {
        return $this->belongsTo(TipoUbicacion::class, 'tipo_ubicacion_id');
    }

    public function inventarios(): HasMany
    {
        return $this->hasMany(Inventario::class, 'ubicacion_id');
    }

    public function detalleTareasOrigen(): HasMany
    {
        return $this->hasMany(DetalleTarea::class, 'ubicacion_origen_id');
    }

    public function detalleTareasDestino(): HasMany
    {
        return $this->hasMany(DetalleTarea::class, 'ubicacion_destino_id');
    }

    public function movimientosOrigen(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'ubicacion_origen_id');
    }

    public function movimientosDestino(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'ubicacion_destino_id');
    }

    public function incidencias(): HasMany
    {
        return $this->hasMany(Incidencia::class, 'ubicacion_id');
    }
}

