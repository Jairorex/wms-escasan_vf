<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Detalle_Recepciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recepcion_id')->constrained('Recepciones')->onDelete('cascade');
            $table->integer('producto_id'); // Productos usa int
            $table->integer('lote_id')->nullable(); // Lotes usa int
            
            // Cantidades
            $table->decimal('cantidad_esperada', 10, 2)->default(0);
            $table->decimal('cantidad_recibida', 10, 2)->default(0);
            $table->decimal('cantidad_rechazada', 10, 2)->default(0);
            
            // Temperatura individual del producto
            $table->decimal('temperatura_producto', 5, 2)->nullable();
            $table->boolean('temperatura_aceptable')->nullable();
            
            // Estado del detalle
            $table->enum('estado', ['PENDIENTE', 'RECIBIDO', 'RECHAZADO', 'PARCIAL'])->default('PENDIENTE');
            $table->string('motivo_rechazo', 255)->nullable();
            
            // Ubicación asignada
            $table->integer('ubicacion_destino_id')->nullable(); // Ubicaciones usa int
            
            // Código de barras generado
            $table->string('codigo_barras_generado', 100)->nullable();
            
            // Observaciones
            $table->text('observaciones')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Detalle_Recepciones');
    }
};

