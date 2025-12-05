<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rol extends Model
{
    protected $table = 'Roles';
    
    public $timestamps = false;
    
    protected $fillable = [
        'nombre'
    ];

    // Constantes para roles
    const ADMINISTRADOR = 'Administrador';
    const SUPERVISOR = 'Supervisor';
    const OPERARIO = 'Operario';
    const RECEPCIONISTA = 'Recepcionista';
    const OPERARIO_CADENA_FRIA = 'Operario Cadena Fría';
    const OPERARIO_PICKING = 'Operario Picking';
    const SUPERVISOR_INVENTARIO = 'Supervisor Inventario';

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'rol_id');
    }

    /**
     * Relación con permisos
     */
    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(Permiso::class, 'Roles_Permisos', 'rol_id', 'permiso_id');
    }

    /**
     * Verificar si el rol tiene un permiso específico
     */
    public function tienePermiso(string $codigoPermiso): bool
    {
        return $this->permisos()->where('codigo', $codigoPermiso)->exists();
    }

    /**
     * Obtener permisos por módulo
     */
    public function getPermisosPorModulo(string $modulo): array
    {
        return $this->permisos()
            ->where('modulo', $modulo)
            ->where('activo', true)
            ->pluck('codigo')
            ->toArray();
    }

    /**
     * Verificar si es rol de administrador
     */
    public function esAdministrador(): bool
    {
        return $this->nombre === self::ADMINISTRADOR;
    }

    /**
     * Verificar si es supervisor
     */
    public function esSupervisor(): bool
    {
        return in_array($this->nombre, [self::SUPERVISOR, self::SUPERVISOR_INVENTARIO]);
    }
}

