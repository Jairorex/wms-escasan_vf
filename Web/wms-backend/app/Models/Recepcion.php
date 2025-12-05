<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recepcion extends Model
{
    protected $table = 'Recepciones';
    public $timestamps = false;

    protected $fillable = [
        'numero_recepcion',
        'orden_id',
        'tipo_recepcion',
        'proveedor',
        'documento_proveedor',
        'subbodega_destino_id',
        'temperatura_recibida',
        'temperatura_valida',
        'observaciones_temperatura',
        'estado',
        'motivo_rechazo',
        'usuario_id',
        'fecha_recepcion',
        'fecha_completada',
        'documentos_adjuntos',
        'observaciones'
    ];

    protected $casts = [
        'temperatura_recibida' => 'decimal:2',
        'temperatura_valida' => 'boolean',
        'fecha_recepcion' => 'datetime',
        'fecha_completada' => 'datetime',
        'documentos_adjuntos' => 'array'
    ];

    // Constantes para tipos de recepción
    const TIPO_ESTANDAR = 'ESTANDAR';
    const TIPO_CADENA_FRIA = 'CADENA_FRIA';
    const TIPO_IMPORTACION = 'IMPORTACION';

    // Constantes para estados
    const ESTADO_PENDIENTE = 'PENDIENTE';
    const ESTADO_EN_PROCESO = 'EN_PROCESO';
    const ESTADO_COMPLETADA = 'COMPLETADA';
    const ESTADO_RECHAZADA = 'RECHAZADA';
    const ESTADO_PARCIAL = 'PARCIAL';

    /**
     * Relación con la orden
     */
    public function orden(): BelongsTo
    {
        return $this->belongsTo(Orden::class, 'orden_id');
    }

    /**
     * Relación con subbodega destino
     */
    public function subbodegaDestino(): BelongsTo
    {
        return $this->belongsTo(Subbodega::class, 'subbodega_destino_id');
    }

    /**
     * Relación con usuario que realizó la recepción
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Relación con detalles de la recepción
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleRecepcion::class, 'recepcion_id');
    }

    /**
     * Verificar si es recepción de cadena fría
     */
    public function esCadenaFria(): bool
    {
        return $this->tipo_recepcion === self::TIPO_CADENA_FRIA;
    }

    /**
     * Verificar si requiere validación de temperatura
     */
    public function requiereValidacionTemperatura(): bool
    {
        if ($this->tipo_recepcion === self::TIPO_CADENA_FRIA) {
            return true;
        }

        if ($this->subbodegaDestino && $this->subbodegaDestino->requiereControlTemperatura()) {
            return true;
        }

        return false;
    }

    /**
     * Validar temperatura de recepción
     */
    public function validarTemperatura(): array
    {
        if (!$this->requiereValidacionTemperatura()) {
            return ['valido' => true, 'mensaje' => 'No requiere validación de temperatura'];
        }

        if ($this->temperatura_recibida === null) {
            return ['valido' => false, 'mensaje' => 'Temperatura de recepción requerida'];
        }

        if ($this->subbodegaDestino) {
            return $this->subbodegaDestino->validarTemperatura($this->temperatura_recibida);
        }

        // Rangos por defecto para cadena fría
        if ($this->temperatura_recibida < -5 || $this->temperatura_recibida > 8) {
            return [
                'valido' => false,
                'mensaje' => "Temperatura {$this->temperatura_recibida}°C fuera del rango permitido (-5°C a 8°C)"
            ];
        }

        return ['valido' => true, 'mensaje' => 'Temperatura válida'];
    }

    /**
     * Generar número de recepción automático
     */
    public static function generarNumeroRecepcion(string $tipo = 'ESTANDAR'): string
    {
        $prefijo = match($tipo) {
            'CADENA_FRIA' => 'RCF',
            'IMPORTACION' => 'RIM',
            default => 'REC'
        };
        
        $fecha = date('Ymd');
        $ultimo = self::where('numero_recepcion', 'like', "{$prefijo}-{$fecha}-%")
            ->orderBy('id', 'desc')
            ->first();

        if ($ultimo) {
            $partes = explode('-', $ultimo->numero_recepcion);
            $secuencia = intval(end($partes)) + 1;
        } else {
            $secuencia = 1;
        }

        return sprintf('%s-%s-%04d', $prefijo, $fecha, $secuencia);
    }

    /**
     * Completar recepción
     */
    public function completar(): void
    {
        $this->estado = self::ESTADO_COMPLETADA;
        $this->fecha_completada = now();
        $this->save();
    }

    /**
     * Rechazar recepción
     */
    public function rechazar(string $motivo): void
    {
        $this->estado = self::ESTADO_RECHAZADA;
        $this->motivo_rechazo = $motivo;
        $this->fecha_completada = now();
        $this->save();
    }

    /**
     * Scope para recepciones pendientes
     */
    public function scopePendientes($query)
    {
        return $query->where('estado', self::ESTADO_PENDIENTE);
    }

    /**
     * Scope para recepciones de cadena fría
     */
    public function scopeCadenaFria($query)
    {
        return $query->where('tipo_recepcion', self::TIPO_CADENA_FRIA);
    }

    /**
     * Scope por tipo
     */
    public function scopeTipo($query, string $tipo)
    {
        return $query->where('tipo_recepcion', $tipo);
    }
}

