<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Alertas', function (Blueprint $table) {
            $table->id();
            $table->string('tipo', 50); // STOCK_MIN, STOCK_MAX, VENCIMIENTO, CAPACIDAD_EXCEDIDA
            $table->string('descripcion', 500);
            $table->string('nivel_riesgo', 10)->default('MEDIO'); // BAJO, MEDIO, ALTO
            $table->integer('referencia_id')->nullable();
            $table->string('tabla_referencia', 50)->nullable(); // Lotes, Productos, Ubicaciones
            $table->dateTime('fecha_alerta')->default(DB::raw('GETDATE()'));
            $table->string('estado', 50)->default('PENDIENTE'); // PENDIENTE, RESUELTA
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Alertas');
    }
};
