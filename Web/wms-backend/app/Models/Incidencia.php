<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Incidencia extends Model
{
    protected $table = 'Incidencias';
    
    protected $fillable = [
        'tipo_incidencia',
        'descripcion',
        'fecha_reporte',
        'estado',
        'reportada_por_usuario_id',
        'ubicacion_id',
        'lote_id'
    ];

    protected $casts = [
        'fecha_reporte' => 'datetime'
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'reportada_por_usuario_id');
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_id');
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class, 'lote_id');
    }
}

