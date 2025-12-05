<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    protected $table = 'Productos';
    public $timestamps = false;
    protected $fillable = [
        'sku',
        'nombre',
        'descripcion',
        'peso',
        'volumen',
        'clasificacion_id',
        'tipo_producto_id',
        // Nuevos campos para control de riesgo y temperatura
        'categoria_riesgo_id',
        'requiere_temperatura',
        'temperatura_min',
        'temperatura_max',
        'rotacion',
        'stock_minimo',
        'stock_maximo',
        'codigo_barras',
        'proveedor_principal'
    ];

    protected $casts = [
        'peso' => 'decimal:2',
        'volumen' => 'decimal:2',
        'requiere_temperatura' => 'boolean',
        'temperatura_min' => 'decimal:2',
        'temperatura_max' => 'decimal:2',
        'stock_minimo' => 'integer',
        'stock_maximo' => 'integer'
    ];

    // Constantes para índice de rotación
    const ROTACION_ALTA = 'ALTA';
    const ROTACION_MEDIA = 'MEDIA';
    const ROTACION_BAJA = 'BAJA';

    public function clasificacion(): BelongsTo
    {
        return $this->belongsTo(Clasificacion::class, 'clasificacion_id');
    }

    public function tipoProducto(): BelongsTo
    {
        return $this->belongsTo(TipoProducto::class, 'tipo_producto_id');
    }

    public function lotes(): HasMany
    {
        return $this->hasMany(Lote::class, 'producto_id');
    }

    /**
     * Relación con categoría de riesgo
     */
    public function categoriaRiesgo(): BelongsTo
    {
        return $this->belongsTo(CategoriaRiesgo::class, 'categoria_riesgo_id');
    }

    /**
     * Verificar si el producto requiere control de temperatura
     */
    public function requiereControlTemperatura(): bool
    {
        if ($this->requiere_temperatura) {
            return true;
        }

        if ($this->categoriaRiesgo && $this->categoriaRiesgo->requiere_temperatura) {
            return true;
        }

        return false;
    }

    /**
     * Validar temperatura del producto
     */
    public function validarTemperatura(float $temperatura): array
    {
        if (!$this->requiereControlTemperatura()) {
            return ['valido' => true, 'mensaje' => 'Producto no requiere control de temperatura'];
        }

        if ($this->temperatura_min !== null && $temperatura < $this->temperatura_min) {
            return [
                'valido' => false,
                'mensaje' => "Temperatura {$temperatura}°C por debajo del mínimo ({$this->temperatura_min}°C)"
            ];
        }

        if ($this->temperatura_max !== null && $temperatura > $this->temperatura_max) {
            return [
                'valido' => false,
                'mensaje' => "Temperatura {$temperatura}°C por encima del máximo ({$this->temperatura_max}°C)"
            ];
        }

        return ['valido' => true, 'mensaje' => 'Temperatura aceptable'];
    }

    /**
     * Verificar compatibilidad con una subbodega
     */
    public function esCompatibleConSubbodega(Subbodega $subbodega): array
    {
        if (!$this->categoria_riesgo_id) {
            return ['compatible' => true, 'mensaje' => 'Sin categoría de riesgo asignada'];
        }

        return ReglaCompatibilidad::verificarCompatibilidad(
            $this->categoria_riesgo_id,
            $subbodega->tipo
        );
    }

    /**
     * Obtener stock total del producto
     */
    public function getStockTotal(): float
    {
        return $this->lotes()
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
     * Scope para productos que requieren temperatura
     */
    public function scopeRequiereTemperatura($query)
    {
        return $query->where('requiere_temperatura', true);
    }

    /**
     * Scope por rotación
     */
    public function scopeRotacion($query, string $rotacion)
    {
        return $query->where('rotacion', $rotacion);
    }

    /**
     * Scope para productos con bajo stock
     */
    public function scopeBajoStock($query)
    {
        return $query->whereRaw('(SELECT COALESCE(SUM(i.cantidad), 0) FROM Inventario i 
            INNER JOIN Lotes l ON i.lote_id = l.id 
            WHERE l.producto_id = Productos.id) < Productos.stock_minimo');
    }
}

