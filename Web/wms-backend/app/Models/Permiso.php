<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permiso extends Model
{
    protected $table = 'Permisos';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
        'modulo',
        'descripcion',
        'activo'
    ];

    protected $casts = [
        'activo' => 'boolean'
    ];

    /**
     * Relación con roles
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'Roles_Permisos', 'permiso_id', 'rol_id');
    }

    /**
     * Scope para permisos activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope por módulo
     */
    public function scopeModulo($query, string $modulo)
    {
        return $query->where('modulo', $modulo);
    }
}

