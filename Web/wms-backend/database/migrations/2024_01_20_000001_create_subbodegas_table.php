<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Subbodegas', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();
            $table->string('nombre', 100);
            $table->string('descripcion', 255)->nullable();
            $table->enum('tipo', [
                'PICKING',
                'RESGUARDO', 
                'CADENA_FRIA',
                'QUIMICOS',
                'ALTO_VALOR',
                'CUARENTENA',
                'DESTRUCCION',
                'IMPORTACION'
            ])->default('RESGUARDO');
            $table->decimal('temperatura_min', 5, 2)->nullable(); // Para cadena fría
            $table->decimal('temperatura_max', 5, 2)->nullable(); // Para cadena fría
            $table->integer('stock_minimo')->default(0); // Stock mínimo para reabastecimiento
            $table->boolean('requiere_temperatura')->default(false);
            $table->boolean('activa')->default(true);
            $table->dateTime('fecha_creacion')->default(DB::raw('GETDATE()'));
        });

        // Insertar subbodegas por defecto
        DB::table('Subbodegas')->insert([
            [
                'codigo' => 'SB-PICK',
                'nombre' => 'Subbodega de Picking',
                'descripcion' => 'Área para preparación de pedidos',
                'tipo' => 'PICKING',
                'temperatura_min' => null,
                'temperatura_max' => null,
                'stock_minimo' => 10,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'SB-RESG',
                'nombre' => 'Subbodega de Resguardo',
                'descripcion' => 'Almacenamiento principal',
                'tipo' => 'RESGUARDO',
                'temperatura_min' => null,
                'temperatura_max' => null,
                'stock_minimo' => 50,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'SB-FRIO',
                'nombre' => 'Cadena Fría',
                'descripcion' => 'Productos refrigerados',
                'tipo' => 'CADENA_FRIA',
                'temperatura_min' => -5.00,
                'temperatura_max' => 8.00,
                'stock_minimo' => 20,
                'requiere_temperatura' => true,
                'activa' => true
            ],
            [
                'codigo' => 'SB-QUIM',
                'nombre' => 'Químicos y Pesticidas',
                'descripcion' => 'Productos químicos controlados',
                'tipo' => 'QUIMICOS',
                'temperatura_min' => null,
                'temperatura_max' => null,
                'stock_minimo' => 15,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'SB-VALOR',
                'nombre' => 'Alto Valor',
                'descripcion' => 'Productos de alto valor',
                'tipo' => 'ALTO_VALOR',
                'temperatura_min' => null,
                'temperatura_max' => null,
                'stock_minimo' => 5,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'SB-CUAR',
                'nombre' => 'Cuarentena',
                'descripcion' => 'Productos en observación',
                'tipo' => 'CUARENTENA',
                'temperatura_min' => null,
                'temperatura_max' => null,
                'stock_minimo' => 0,
                'requiere_temperatura' => false,
                'activa' => true
            ],
            [
                'codigo' => 'SB-DEST',
                'nombre' => 'Destrucción',
                'descripcion' => 'Productos para destrucción',
                'tipo' => 'DESTRUCCION',
                'temperatura_min' => null,
                'temperatura_max' => null,
                'stock_minimo' => 0,
                'requiere_temperatura' => false,
                'activa' => true
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('Subbodegas');
    }
};

