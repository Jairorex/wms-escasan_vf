<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tarea extends Model
{
    protected $table = 'Tareas';
    public $timestamps = false;

    protected $fillable = [
        'orden_id',
        'tipo_tarea',
        'estado',
        'prioridad',
        'asignada_a_usuario_id',
        'fecha_creacion',
        'fecha_inicio',
        'fecha_fin',
        'fecha_finalizacion'
    ];

    protected $casts = [
        'fecha_creacion' => 'datetime',
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
        'fecha_finalizacion' => 'datetime'
    ];

    public function orden(): BelongsTo
    {
        return $this->belongsTo(Orden::class, 'orden_id');
    }

    public function usuarioAsignado(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'asignada_a_usuario_id');
    }

    public function detalleTareas(): HasMany
    {
        return $this->hasMany(DetalleTarea::class, 'tarea_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'tarea_id');
    }

    // Calcular tiempo transcurrido en minutos
    public function getTiempoTranscurridoAttribute(): ?int
    {
        if (!$this->fecha_inicio) {
            return null;
        }

        $fin = $this->fecha_fin ?? $this->fecha_finalizacion ?? now();
        return $this->fecha_inicio->diffInMinutes($fin);
    }

    // Calcular tiempo transcurrido formateado
    public function getTiempoTranscurridoFormateadoAttribute(): string
    {
        $minutos = $this->tiempo_transcurrido;
        if ($minutos === null) {
            return 'No iniciada';
        }

        $horas = floor($minutos / 60);
        $mins = $minutos % 60;

        if ($horas > 0) {
            return "{$horas}h {$mins}m";
        }
        return "{$mins}m";
    }
}

