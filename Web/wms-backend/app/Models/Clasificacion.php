<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clasificacion extends Model
{
    protected $table = 'Clasificaciones';
    
    public $timestamps = false;
    
    protected $fillable = [
        'nombre'
    ];

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'clasificacion_id');
    }
}

