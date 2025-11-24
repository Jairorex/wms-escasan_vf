<?php

namespace App\Models;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'Usuarios';
    
    public $timestamps = false;
    
    protected $fillable = [
        'nombre',
        'usuario',
        'email',
        'password',
        'rol_id',
        'supervisor_id'
    ];

    protected $hidden = [
        'password'
    ];

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    public function tareas(): HasMany
    {
        return $this->hasMany(Tarea::class, 'asignada_a_usuario_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'usuario_id');
    }

    public function incidencias(): HasMany
    {
        return $this->hasMany(Incidencia::class, 'reportada_por_usuario_id');
    }

    // Relación con supervisor
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'supervisor_id');
    }

    // Operarios asignados a este supervisor
    public function operarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'supervisor_id');
    }

    // Verificar si es administrador
    public function isAdmin(): bool
    {
        return $this->rol && strtolower($this->rol->nombre) === 'administrador';
    }

    // Verificar si es supervisor
    public function isSupervisor(): bool
    {
        return $this->rol && strtolower($this->rol->nombre) === 'supervisor';
    }

    // Verificar si es operario
    public function isOperario(): bool
    {
        return $this->rol && strtolower($this->rol->nombre) === 'operario';
    }
}

