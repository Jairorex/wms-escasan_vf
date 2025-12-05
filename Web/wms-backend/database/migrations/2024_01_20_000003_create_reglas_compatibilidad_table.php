<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla para definir qué categorías de riesgo pueden ir en qué tipos de subbodega
        Schema::create('Reglas_Compatibilidad', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_riesgo_id')->constrained('Categorias_Riesgo')->onDelete('cascade');
            $table->string('tipo_subbodega', 50); // Tipo de subbodega permitida
            $table->boolean('permitido')->default(true);
            $table->string('motivo_restriccion', 255)->nullable();
            $table->boolean('activa')->default(true);
        });

        // Insertar reglas de compatibilidad por defecto
        // Categoría Alimenticio
        DB::table('Reglas_Compatibilidad')->insert([
            // Alimenticio puede ir en: PICKING, RESGUARDO, CADENA_FRIA
            ['categoria_riesgo_id' => 1, 'tipo_subbodega' => 'PICKING', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 1, 'tipo_subbodega' => 'RESGUARDO', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 1, 'tipo_subbodega' => 'CADENA_FRIA', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 1, 'tipo_subbodega' => 'QUIMICOS', 'permitido' => false, 'motivo_restriccion' => 'Riesgo de contaminación cruzada con químicos', 'activa' => true],
            
            // Químico puede ir solo en: QUIMICOS
            ['categoria_riesgo_id' => 2, 'tipo_subbodega' => 'QUIMICOS', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 2, 'tipo_subbodega' => 'PICKING', 'permitido' => false, 'motivo_restriccion' => 'Productos químicos requieren área especializada', 'activa' => true],
            ['categoria_riesgo_id' => 2, 'tipo_subbodega' => 'RESGUARDO', 'permitido' => false, 'motivo_restriccion' => 'Productos químicos requieren área especializada', 'activa' => true],
            ['categoria_riesgo_id' => 2, 'tipo_subbodega' => 'CADENA_FRIA', 'permitido' => false, 'motivo_restriccion' => 'No mezclar químicos con cadena fría alimentaria', 'activa' => true],
            
            // Farmacéutico puede ir en: CADENA_FRIA, ALTO_VALOR
            ['categoria_riesgo_id' => 3, 'tipo_subbodega' => 'CADENA_FRIA', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 3, 'tipo_subbodega' => 'ALTO_VALOR', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 3, 'tipo_subbodega' => 'QUIMICOS', 'permitido' => false, 'motivo_restriccion' => 'Farmacéuticos no pueden mezclarse con agroquímicos', 'activa' => true],
            
            // Alto Valor puede ir en: ALTO_VALOR, RESGUARDO
            ['categoria_riesgo_id' => 4, 'tipo_subbodega' => 'ALTO_VALOR', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 4, 'tipo_subbodega' => 'RESGUARDO', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            
            // General puede ir en cualquier lugar excepto QUIMICOS y DESTRUCCION
            ['categoria_riesgo_id' => 5, 'tipo_subbodega' => 'PICKING', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 5, 'tipo_subbodega' => 'RESGUARDO', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 5, 'tipo_subbodega' => 'CADENA_FRIA', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            
            // Refrigerado solo en CADENA_FRIA
            ['categoria_riesgo_id' => 6, 'tipo_subbodega' => 'CADENA_FRIA', 'permitido' => true, 'motivo_restriccion' => null, 'activa' => true],
            ['categoria_riesgo_id' => 6, 'tipo_subbodega' => 'RESGUARDO', 'permitido' => false, 'motivo_restriccion' => 'Requiere cadena de frío', 'activa' => true],
            ['categoria_riesgo_id' => 6, 'tipo_subbodega' => 'PICKING', 'permitido' => false, 'motivo_restriccion' => 'Requiere cadena de frío', 'activa' => true],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('Reglas_Compatibilidad');
    }
};

