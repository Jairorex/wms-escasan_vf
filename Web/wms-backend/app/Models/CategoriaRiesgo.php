<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoriaRiesgo extends Model
{
    protected $table = 'Categorias_Riesgo';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'nivel_riesgo',
        'requiere_certificacion',
        'requiere_temperatura',
        'activa'
    ];

    protected $casts = [
        'requiere_certificacion' => 'boolean',
        'requiere_temperatura' => 'boolean',
        'activa' => 'boolean'
    ];

    // Constantes para niveles de riesgo
    const NIVEL_BAJO = 'BAJO';
    const NIVEL_MEDIO = 'MEDIO';
    const NIVEL_ALTO = 'ALTO';
    const NIVEL_CRITICO = 'CRITICO';

    /**
     * Relación con productos
     */
    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'categoria_riesgo_id');
    }

    /**
     * Relación con reglas de compatibilidad
     */
    public function reglasCompatibilidad(): HasMany
    {
        return $this->hasMany(ReglaCompatibilidad::class, 'categoria_riesgo_id');
    }

    /**
     * Verificar si la categoría es compatible con un tipo de subbodega
     */
    public function esCompatibleCon(string $tipoSubbodega): array
    {
        $regla = $this->reglasCompatibilidad()
            ->where('tipo_subbodega', $tipoSubbodega)
            ->where('activa', true)
            ->first();

        if (!$regla) {
            // Si no hay regla definida, permitir por defecto
            return ['compatible' => true, 'mensaje' => 'Sin restricción definida'];
        }

        return [
            'compatible' => $regla->permitido,
            'mensaje' => $regla->permitido 
                ? 'Compatible' 
                : ($regla->motivo_restriccion ?? 'No compatible con este tipo de subbodega')
        ];
    }

    /**
     * Obtener tipos de subbodega permitidos
     */
    public function getTiposSubbodegaPermitidos(): array
    {
        return $this->reglasCompatibilidad()
            ->where('permitido', true)
            ->where('activa', true)
            ->pluck('tipo_subbodega')
            ->toArray();
    }

    /**
     * Scope para categorías activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }

    /**
     * Scope por nivel de riesgo
     */
    public function scopeNivelRiesgo($query, string $nivel)
    {
        return $query->where('nivel_riesgo', $nivel);
    }
}

