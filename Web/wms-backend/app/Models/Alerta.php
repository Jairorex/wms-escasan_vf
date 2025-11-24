<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Alerta extends Model
{
    protected $table = 'Alertas';
    
    protected $fillable = [
        'tipo',
        'descripcion',
        'nivel_riesgo',
        'referencia_id',
        'tabla_referencia',
        'fecha_alerta',
        'estado'
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'fecha_alerta' => 'datetime'
    ];
    
    /**
     * Relación dinámica con limpieza de datos
     * Nunca devuelve null - usa relación vacía como fallback
     */
    public function referencia()
    {
        // Normalizar el nombre de la tabla (trim + lowercase + capitalize)
        $tablaLimpia = ucfirst(strtolower(trim($this->tabla_referencia ?? '')));
        
        switch ($tablaLimpia) {
            case 'Lotes':
                return $this->belongsTo(Lote::class, 'referencia_id');
                
            case 'Productos':
                return $this->belongsTo(Producto::class, 'referencia_id');
                
            case 'Ubicaciones':
                return $this->belongsTo(Ubicacion::class, 'referencia_id');
                
            default:
                // Devolver una relación vacía en lugar de null
                // Esto previene el error "Call to a member function getQuery() on null"
                return $this->belongsTo(self::class, 'referencia_id')->whereRaw('1 = 0');
        }
    }
    
    /**
     * Accessor para obtener el nombre legible de la referencia
     */
    public function getReferenciaDescripcionAttribute()
    {
        $ref = $this->referencia;
        
        if (!$ref) {
            return 'Referencia no encontrada';
        }
        
        // Retornar el campo más apropiado según el tipo
        return $ref->nombre ?? $ref->descripcion ?? "ID: {$this->referencia_id}";
    }
}