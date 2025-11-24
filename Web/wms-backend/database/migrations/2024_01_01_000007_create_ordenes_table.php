<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ordenes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_orden', 50); // RECEPCION, PICKING, TRANSFERENCIA
            $table->string('estado', 50)->default('PENDIENTE'); // PENDIENTE, PROCESO, COMPLETADA, CANCELADA
            $table->string('referencia_externa', 100)->nullable();
            $table->dateTime('fecha_creacion')->default(DB::raw('GETDATE()'));
            $table->string('cliente_proveedor', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ordenes');
    }
};

