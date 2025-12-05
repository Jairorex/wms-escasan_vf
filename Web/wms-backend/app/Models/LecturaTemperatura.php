<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LecturaTemperatura extends Model
{
    protected $table = 'Lecturas_Temperatura';
    public $timestamps = false;

    protected $fillable = [
        'ubicacion_id',
        'subbodega_id',
        'temperatura',
        'humedad',
        'dentro_rango',
        'temperatura_min_esperada',
        'temperatura_max_esperada',
        'origen',
        'sensor_id',
        'usuario_id',
        'fecha_lectura',
        'alerta_id',
        'observaciones'
    ];

    protected $casts = [
        'temperatura' => 'decimal:2',
        'humedad' => 'decimal:2',
        'dentro_rango' => 'boolean',
        'temperatura_min_esperada' => 'decimal:2',
        'temperatura_max_esperada' => 'decimal:2',
        'fecha_lectura' => 'datetime'
    ];

    // Constantes para origen
    const ORIGEN_MANUAL = 'MANUAL';
    const ORIGEN_SENSOR = 'SENSOR';
    const ORIGEN_RECEPCION = 'RECEPCION';

    /**
     * Relación con ubicación
     */
    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_id');
    }

    /**
     * Relación con subbodega
     */
    public function subbodega(): BelongsTo
    {
        return $this->belongsTo(Subbodega::class, 'subbodega_id');
    }

    /**
     * Relación con usuario
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Relación con alerta generada
     */
    public function alerta(): BelongsTo
    {
        return $this->belongsTo(Alerta::class, 'alerta_id');
    }

    /**
     * Verificar si está dentro del rango
     */
    public function verificarRango(): bool
    {
        if ($this->temperatura_min_esperada !== null && $this->temperatura < $this->temperatura_min_esperada) {
            return false;
        }

        if ($this->temperatura_max_esperada !== null && $this->temperatura > $this->temperatura_max_esperada) {
            return false;
        }

        return true;
    }

    /**
     * Registrar lectura con validación automática
     */
    public static function registrar(array $datos): self
    {
        $lectura = new self($datos);
        
        // Obtener rangos esperados
        if ($lectura->subbodega_id) {
            $subbodega = Subbodega::find($lectura->subbodega_id);
            if ($subbodega) {
                $lectura->temperatura_min_esperada = $subbodega->temperatura_min;
                $lectura->temperatura_max_esperada = $subbodega->temperatura_max;
            }
        } elseif ($lectura->ubicacion_id) {
            $ubicacion = Ubicacion::with('subbodega')->find($lectura->ubicacion_id);
            if ($ubicacion && $ubicacion->subbodega) {
                $lectura->temperatura_min_esperada = $ubicacion->subbodega->temperatura_min;
                $lectura->temperatura_max_esperada = $ubicacion->subbodega->temperatura_max;
            }
        }

        // Verificar si está dentro del rango
        $lectura->dentro_rango = $lectura->verificarRango();
        $lectura->save();

        // Si está fuera de rango, crear alerta
        if (!$lectura->dentro_rango) {
            $lectura->crearAlertaTemperatura();
        }

        return $lectura;
    }

    /**
     * Crear alerta por temperatura fuera de rango
     */
    public function crearAlertaTemperatura(): void
    {
        $ubicacionDesc = $this->ubicacion ? $this->ubicacion->codigo : 
            ($this->subbodega ? $this->subbodega->nombre : 'Desconocida');

        $descripcion = sprintf(
            "[TEMPERATURA] Fuera de rango en %s: %.2f°C (Rango: %.2f°C - %.2f°C)",
            $ubicacionDesc,
            $this->temperatura,
            $this->temperatura_min_esperada ?? 0,
            $this->temperatura_max_esperada ?? 0
        );

        $alerta = Alerta::create([
            'tipo' => 'CAPACIDAD_EXCEDIDA', // Usamos este tipo para alertas de temperatura
            'descripcion' => $descripcion,
            'nivel_riesgo' => 'ALTO',
            'referencia_id' => $this->subbodega_id ?? $this->ubicacion_id,
            'tabla_referencia' => $this->subbodega_id ? 'Subbodegas' : 'Ubicaciones',
            'estado' => 'PENDIENTE',
            'fecha_alerta' => now()
        ]);

        $this->alerta_id = $alerta->id;
        $this->save();
    }

    /**
     * Scope para lecturas fuera de rango
     */
    public function scopeFueraRango($query)
    {
        return $query->where('dentro_rango', false);
    }

    /**
     * Scope por fecha
     */
    public function scopeFecha($query, $fecha)
    {
        return $query->whereDate('fecha_lectura', $fecha);
    }

    /**
     * Scope por subbodega
     */
    public function scopeSubbodega($query, int $subbodegaId)
    {
        return $query->where('subbodega_id', $subbodegaId);
    }
}

