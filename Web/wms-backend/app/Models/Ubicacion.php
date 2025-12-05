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
        'max_cantidad',
        // Nuevos campos
        'subbodega_id',
        'tiene_control_temperatura',
        'temperatura_actual',
        'ultima_lectura_temperatura',
        'estado'
    ];

    protected $casts = [
        'max_peso' => 'decimal:2',
        'max_cantidad' => 'integer',
        'tiene_control_temperatura' => 'boolean',
        'temperatura_actual' => 'decimal:2',
        'ultima_lectura_temperatura' => 'datetime'
    ];

    // Constantes de estado
    const ESTADO_DISPONIBLE = 'DISPONIBLE';
    const ESTADO_OCUPADA = 'OCUPADA';
    const ESTADO_BLOQUEADA = 'BLOQUEADA';
    const ESTADO_MANTENIMIENTO = 'MANTENIMIENTO';

    public function tipoUbicacion(): BelongsTo
    {
        return $this->belongsTo(TipoUbicacion::class, 'tipo_ubicacion_id');
    }

    /**
     * Relación con subbodega
     */
    public function subbodega(): BelongsTo
    {
        return $this->belongsTo(Subbodega::class, 'subbodega_id');
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

    /**
     * Relación con lecturas de temperatura
     */
    public function lecturasTemperatura(): HasMany
    {
        return $this->hasMany(LecturaTemperatura::class, 'ubicacion_id');
    }

    /**
     * Verificar si la ubicación está disponible
     */
    public function estaDisponible(): bool
    {
        return $this->estado === self::ESTADO_DISPONIBLE;
    }

    /**
     * Verificar compatibilidad con un producto
     */
    public function esCompatibleConProducto(Producto $producto): array
    {
        if (!$this->subbodega) {
            return ['compatible' => true, 'mensaje' => 'Ubicación sin subbodega asignada'];
        }

        return $producto->esCompatibleConSubbodega($this->subbodega);
    }

    /**
     * Verificar si requiere control de temperatura
     */
    public function requiereControlTemperatura(): bool
    {
        if ($this->tiene_control_temperatura) {
            return true;
        }

        if ($this->subbodega && $this->subbodega->requiereControlTemperatura()) {
            return true;
        }

        return false;
    }

    /**
     * Registrar temperatura
     */
    public function registrarTemperatura(float $temperatura, ?int $usuarioId = null): LecturaTemperatura
    {
        $this->temperatura_actual = $temperatura;
        $this->ultima_lectura_temperatura = now();
        $this->save();

        return LecturaTemperatura::registrar([
            'ubicacion_id' => $this->id,
            'subbodega_id' => $this->subbodega_id,
            'temperatura' => $temperatura,
            'origen' => LecturaTemperatura::ORIGEN_MANUAL,
            'usuario_id' => $usuarioId,
            'fecha_lectura' => now()
        ]);
    }

    /**
     * Scope para ubicaciones disponibles
     */
    public function scopeDisponibles($query)
    {
        return $query->where('estado', self::ESTADO_DISPONIBLE);
    }

    /**
     * Scope por subbodega
     */
    public function scopeEnSubbodega($query, int $subbodegaId)
    {
        return $query->where('subbodega_id', $subbodegaId);
    }

    /**
     * Scope para ubicaciones con control de temperatura
     */
    public function scopeConControlTemperatura($query)
    {
        return $query->where('tiene_control_temperatura', true);
    }
}

