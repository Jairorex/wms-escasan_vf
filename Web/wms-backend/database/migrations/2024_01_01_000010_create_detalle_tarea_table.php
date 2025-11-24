<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Detalle_Tarea', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tarea_id')->constrained('Tareas')->onDelete('restrict');
            $table->foreignId('lote_id')->constrained('Lotes')->onDelete('restrict');
            $table->decimal('cantidad_solicitada', 10, 2);
            $table->decimal('cantidad_completada', 10, 2)->default(0);
            $table->foreignId('ubicacion_origen_id')->nullable()->constrained('Ubicaciones')->onDelete('restrict');
            $table->foreignId('ubicacion_destino_id')->nullable()->constrained('Ubicaciones')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Detalle_Tarea');
    }
};

