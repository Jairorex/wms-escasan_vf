<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lote_id')->constrained('Lotes')->onDelete('restrict');
            $table->decimal('cantidad', 10, 2);
            $table->foreignId('ubicacion_origen_id')->nullable()->constrained('Ubicaciones')->onDelete('restrict');
            $table->foreignId('ubicacion_destino_id')->nullable()->constrained('Ubicaciones')->onDelete('restrict');
            $table->foreignId('usuario_id')->nullable()->constrained('Usuarios')->onDelete('restrict');
            $table->foreignId('tarea_id')->nullable()->constrained('Tareas')->onDelete('restrict');
            $table->dateTime('fecha_movimiento')->default(DB::raw('GETDATE()'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Movimientos');
    }
};

