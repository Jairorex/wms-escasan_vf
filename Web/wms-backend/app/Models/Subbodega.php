<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subbodega extends Model
{
    protected $table = 'Subbodegas';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'tipo',
        'temperatura_min',
        'temperatura_max',
        'stock_minimo',
        'requiere_temperatura',
        'activa',
        'fecha_creacion'
    ];

    protected $casts = [
        'temperatura_min' => 'decimal:2',
        'temperatura_max' => 'decimal:2',
        'stock_minimo' => 'integer',
        'requiere_temperatura' => 'boolean',
        'activa' => 'boolean',
        'fecha_creacion' => 'datetime'
    ];

    // Constantes para tipos de subbodega
    const TIPO_PICKING = 'PICKING';
    const TIPO_RESGUARDO = 'RESGUARDO';
    const TIPO_CADENA_FRIA = 'CADENA_FRIA';
    const TIPO_QUIMICOS = 'QUIMICOS';
    const TIPO_ALTO_VALOR = 'ALTO_VALOR';
    const TIPO_CUARENTENA = 'CUARENTENA';
    const TIPO_DESTRUCCION = 'DESTRUCCION';
    const TIPO_IMPORTACION = 'IMPORTACION';

    /**
     * Relación con ubicaciones
     */
    public function ubicaciones(): HasMany
    {
        return $this->hasMany(Ubicacion::class, 'subbodega_id');
    }

    /**
     * Relación con recepciones destino
     */
    public function recepciones(): HasMany
    {
        return $this->hasMany(Recepcion::class, 'subbodega_destino_id');
    }

    /**
     * Relación con lecturas de temperatura
     */
    public function lecturasTemperatura(): HasMany
    {
        return $this->hasMany(LecturaTemperatura::class, 'subbodega_id');
    }

    /**
     * Relación con reabastecimientos como origen
     */
    public function reabastecimientosOrigen(): HasMany
    {
        return $this->hasMany(Reabastecimiento::class, 'subbodega_origen_id');
    }

    /**
     * Relación con reabastecimientos como destino
     */
    public function reabastecimientosDestino(): HasMany
    {
        return $this->hasMany(Reabastecimiento::class, 'subbodega_destino_id');
    }

    /**
     * Verificar si la subbodega requiere control de temperatura
     */
    public function requiereControlTemperatura(): bool
    {
        return $this->requiere_temperatura || $this->tipo === self::TIPO_CADENA_FRIA;
    }

    /**
     * Validar temperatura contra rangos permitidos
     */
    public function validarTemperatura(float $temperatura): array
    {
        if (!$this->requiereControlTemperatura()) {
            return ['valido' => true, 'mensaje' => 'Esta subbodega no requiere control de temperatura'];
        }

        if ($this->temperatura_min !== null && $temperatura < $this->temperatura_min) {
            return [
                'valido' => false,
                'mensaje' => "Temperatura {$temperatura}°C está por debajo del mínimo permitido ({$this->temperatura_min}°C)"
            ];
        }

        if ($this->temperatura_max !== null && $temperatura > $this->temperatura_max) {
            return [
                'valido' => false,
                'mensaje' => "Temperatura {$temperatura}°C está por encima del máximo permitido ({$this->temperatura_max}°C)"
            ];
        }

        return ['valido' => true, 'mensaje' => 'Temperatura dentro del rango permitido'];
    }

    /**
     * Obtener stock total en la subbodega
     */
    public function getStockTotal(): float
    {
        return $this->ubicaciones()
            ->with('inventarios')
            ->get()
            ->flatMap->inventarios
            ->sum('cantidad');
    }

    /**
     * Verificar si necesita reabastecimiento
     */
    public function necesitaReabastecimiento(): bool
    {
        return $this->getStockTotal() < $this->stock_minimo;
    }

    /**
     * Scope para subbodegas activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }

    /**
     * Scope para subbodegas por tipo
     */
    public function scopeTipo($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    /**
     * Scope para subbodegas de cadena fría
     */
    public function scopeCadenaFria($query)
    {
        return $query->where('tipo', self::TIPO_CADENA_FRIA);
    }
}

