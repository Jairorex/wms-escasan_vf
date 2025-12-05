<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleRecepcion extends Model
{
    protected $table = 'Detalle_Recepciones';
    public $timestamps = false;

    protected $fillable = [
        'recepcion_id',
        'producto_id',
        'lote_id',
        'cantidad_esperada',
        'cantidad_recibida',
        'cantidad_rechazada',
        'temperatura_producto',
        'temperatura_aceptable',
        'estado',
        'motivo_rechazo',
        'ubicacion_destino_id',
        'codigo_barras_generado',
        'observaciones'
    ];

    protected $casts = [
        'cantidad_esperada' => 'decimal:2',
        'cantidad_recibida' => 'decimal:2',
        'cantidad_rechazada' => 'decimal:2',
        'temperatura_producto' => 'decimal:2',
        'temperatura_aceptable' => 'boolean'
    ];

    // Estados
    const ESTADO_PENDIENTE = 'PENDIENTE';
    const ESTADO_RECIBIDO = 'RECIBIDO';
    const ESTADO_RECHAZADO = 'RECHAZADO';
    const ESTADO_PARCIAL = 'PARCIAL';

    /**
     * Relación con recepción
     */
    public function recepcion(): BelongsTo
    {
        return $this->belongsTo(Recepcion::class, 'recepcion_id');
    }

    /**
     * Relación con producto
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    /**
     * Relación con lote
     */
    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class, 'lote_id');
    }

    /**
     * Relación con ubicación destino
     */
    public function ubicacionDestino(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_destino_id');
    }

    /**
     * Verificar si la temperatura del producto es aceptable
     */
    public function validarTemperaturaProducto(): array
    {
        $producto = $this->producto;
        
        if (!$producto || !$producto->requiere_temperatura) {
            return ['valido' => true, 'mensaje' => 'Producto no requiere control de temperatura'];
        }

        if ($this->temperatura_producto === null) {
            return ['valido' => false, 'mensaje' => 'Temperatura del producto requerida'];
        }

        if ($producto->temperatura_min !== null && $this->temperatura_producto < $producto->temperatura_min) {
            return [
                'valido' => false,
                'mensaje' => "Temperatura {$this->temperatura_producto}°C por debajo del mínimo ({$producto->temperatura_min}°C)"
            ];
        }

        if ($producto->temperatura_max !== null && $this->temperatura_producto > $producto->temperatura_max) {
            return [
                'valido' => false,
                'mensaje' => "Temperatura {$this->temperatura_producto}°C por encima del máximo ({$producto->temperatura_max}°C)"
            ];
        }

        return ['valido' => true, 'mensaje' => 'Temperatura del producto aceptable'];
    }

    /**
     * Generar código de barras para el producto recibido
     */
    public function generarCodigoBarras(): string
    {
        $producto = $this->producto;
        $lote = $this->lote;
        
        $codigo = sprintf(
            '%s-%s-%s',
            $producto->sku ?? 'PROD',
            $lote->lote_codigo ?? 'SINLOTE',
            date('ymd')
        );
        
        $this->codigo_barras_generado = $codigo;
        $this->save();
        
        return $codigo;
    }

    /**
     * Calcular diferencia entre esperado y recibido
     */
    public function getDiferencia(): float
    {
        return $this->cantidad_esperada - $this->cantidad_recibida;
    }

    /**
     * Verificar si hay diferencia
     */
    public function tieneDiferencia(): bool
    {
        return $this->getDiferencia() != 0;
    }
}

