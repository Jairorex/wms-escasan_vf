<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Categorias_Riesgo', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();
            $table->string('nombre', 100);
            $table->string('descripcion', 255)->nullable();
            $table->enum('nivel_riesgo', ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'])->default('BAJO');
            $table->boolean('requiere_certificacion')->default(false);
            $table->boolean('requiere_temperatura')->default(false);
            $table->boolean('activa')->default(true);
        });

        // Insertar categorías de riesgo por defecto
        DB::table('Categorias_Riesgo')->insert([
            [
                'codigo' => 'CAT-ALI',
                'nombre' => 'Alimenticio',
                'descripcion' => 'Productos alimenticios para consumo humano o animal',
                'nivel_riesgo' => 'MEDIO',
                'requiere_certificacion' => true,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'CAT-QUIM',
                'nombre' => 'Químico/Pesticida',
                'descripcion' => 'Productos químicos, pesticidas y agroquímicos',
                'nivel_riesgo' => 'ALTO',
                'requiere_certificacion' => true,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'CAT-FARM',
                'nombre' => 'Farmacéutico',
                'descripcion' => 'Medicamentos y productos farmacéuticos',
                'nivel_riesgo' => 'CRITICO',
                'requiere_certificacion' => true,
                'requiere_temperatura' => true,
                'activa' => true
            ],
            [
                'codigo' => 'CAT-VALOR',
                'nombre' => 'Alto Valor',
                'descripcion' => 'Productos de alto valor económico',
                'nivel_riesgo' => 'ALTO',
                'requiere_certificacion' => false,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'CAT-GEN',
                'nombre' => 'General',
                'descripcion' => 'Productos generales sin riesgo especial',
                'nivel_riesgo' => 'BAJO',
                'requiere_certificacion' => false,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'CAT-REFRI',
                'nombre' => 'Refrigerado',
                'descripcion' => 'Productos que requieren cadena de frío',
                'nivel_riesgo' => 'ALTO',
                'requiere_certificacion' => true,
                'requiere_temperatura' => true,
                'activa' => true
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('Categorias_Riesgo');
    }
};

