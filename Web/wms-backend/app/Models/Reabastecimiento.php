<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reabastecimiento extends Model
{
    protected $table = 'Reabastecimientos';
    public $timestamps = false;

    protected $fillable = [
        'numero_reabastecimiento',
        'tipo',
        'subbodega_origen_id',
        'subbodega_destino_id',
        'estado',
        'prioridad',
        'solicitado_por',
        'aprobado_por',
        'ejecutado_por',
        'fecha_solicitud',
        'fecha_aprobacion',
        'fecha_ejecucion',
        'fecha_completado',
        'fecha_programada',
        'observaciones',
        'motivo_cancelacion'
    ];

    protected $casts = [
        'fecha_solicitud' => 'datetime',
        'fecha_aprobacion' => 'datetime',
        'fecha_ejecucion' => 'datetime',
        'fecha_completado' => 'datetime',
        'fecha_programada' => 'date'
    ];

    // Constantes para tipos
    const TIPO_MANUAL = 'MANUAL';
    const TIPO_AUTOMATICO = 'AUTOMATICO';
    const TIPO_PROGRAMADO = 'PROGRAMADO';

    // Constantes para estados
    const ESTADO_PENDIENTE = 'PENDIENTE';
    const ESTADO_APROBADO = 'APROBADO';
    const ESTADO_EN_PROCESO = 'EN_PROCESO';
    const ESTADO_COMPLETADO = 'COMPLETADO';
    const ESTADO_CANCELADO = 'CANCELADO';

    // Constantes para prioridad
    const PRIORIDAD_BAJA = 'BAJA';
    const PRIORIDAD_MEDIA = 'MEDIA';
    const PRIORIDAD_ALTA = 'ALTA';
    const PRIORIDAD_URGENTE = 'URGENTE';

    /**
     * Relación con subbodega origen
     */
    public function subbodegaOrigen(): BelongsTo
    {
        return $this->belongsTo(Subbodega::class, 'subbodega_origen_id');
    }

    /**
     * Relación con subbodega destino
     */
    public function subbodegaDestino(): BelongsTo
    {
        return $this->belongsTo(Subbodega::class, 'subbodega_destino_id');
    }

    /**
     * Relación con usuario que solicitó
     */
    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'solicitado_por');
    }

    /**
     * Relación con usuario que aprobó
     */
    public function aprobador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'aprobado_por');
    }

    /**
     * Relación con usuario que ejecutó
     */
    public function ejecutor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'ejecutado_por');
    }

    /**
     * Relación con detalles
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleReabastecimiento::class, 'reabastecimiento_id');
    }

    /**
     * Generar número de reabastecimiento
     */
    public static function generarNumero(string $tipo = 'MANUAL'): string
    {
        $prefijo = match($tipo) {
            'AUTOMATICO' => 'RAU',
            'PROGRAMADO' => 'RPR',
            default => 'RMA'
        };
        
        $fecha = date('Ymd');
        $ultimo = self::where('numero_reabastecimiento', 'like', "{$prefijo}-{$fecha}-%")
            ->orderBy('id', 'desc')
            ->first();

        if ($ultimo) {
            $partes = explode('-', $ultimo->numero_reabastecimiento);
            $secuencia = intval(end($partes)) + 1;
        } else {
            $secuencia = 1;
        }

        return sprintf('%s-%s-%04d', $prefijo, $fecha, $secuencia);
    }

    /**
     * Aprobar reabastecimiento
     */
    public function aprobar(int $usuarioId): void
    {
        $this->estado = self::ESTADO_APROBADO;
        $this->aprobado_por = $usuarioId;
        $this->fecha_aprobacion = now();
        $this->save();
    }

    /**
     * Iniciar ejecución
     */
    public function iniciarEjecucion(int $usuarioId): void
    {
        $this->estado = self::ESTADO_EN_PROCESO;
        $this->ejecutado_por = $usuarioId;
        $this->fecha_ejecucion = now();
        $this->save();
    }

    /**
     * Completar reabastecimiento
     */
    public function completar(): void
    {
        $this->estado = self::ESTADO_COMPLETADO;
        $this->fecha_completado = now();
        $this->save();
    }

    /**
     * Cancelar reabastecimiento
     */
    public function cancelar(string $motivo): void
    {
        $this->estado = self::ESTADO_CANCELADO;
        $this->motivo_cancelacion = $motivo;
        $this->save();
    }

    /**
     * Scope para pendientes
     */
    public function scopePendientes($query)
    {
        return $query->where('estado', self::ESTADO_PENDIENTE);
    }

    /**
     * Scope por prioridad
     */
    public function scopePrioridad($query, string $prioridad)
    {
        return $query->where('prioridad', $prioridad);
    }

    /**
     * Scope para programados
     */
    public function scopeProgramados($query)
    {
        return $query->where('tipo', self::TIPO_PROGRAMADO);
    }
}

