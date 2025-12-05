<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReglaCompatibilidad extends Model
{
    protected $table = 'Reglas_Compatibilidad';
    public $timestamps = false;

    protected $fillable = [
        'categoria_riesgo_id',
        'tipo_subbodega',
        'permitido',
        'motivo_restriccion',
        'activa'
    ];

    protected $casts = [
        'permitido' => 'boolean',
        'activa' => 'boolean'
    ];

    /**
     * Relación con categoría de riesgo
     */
    public function categoriaRiesgo(): BelongsTo
    {
        return $this->belongsTo(CategoriaRiesgo::class, 'categoria_riesgo_id');
    }

    /**
     * Verificar compatibilidad entre producto y subbodega
     */
    public static function verificarCompatibilidad(int $categoriaRiesgoId, string $tipoSubbodega): array
    {
        $regla = self::where('categoria_riesgo_id', $categoriaRiesgoId)
            ->where('tipo_subbodega', $tipoSubbodega)
            ->where('activa', true)
            ->first();

        if (!$regla) {
            return [
                'compatible' => true,
                'mensaje' => 'Sin restricción definida para esta combinación'
            ];
        }

        return [
            'compatible' => $regla->permitido,
            'mensaje' => $regla->permitido 
                ? 'Almacenamiento permitido' 
                : ($regla->motivo_restriccion ?? 'Almacenamiento no permitido')
        ];
    }

    /**
     * Scope para reglas activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }
}

