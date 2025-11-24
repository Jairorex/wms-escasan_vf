<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Tareas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->nullable()->constrained('Ordenes')->onDelete('restrict');
            $table->string('tipo_tarea', 50); // PICK, PUTAWAY, REABASTECER, CONTEO
            $table->string('estado', 50)->default('CREADA'); // CREADA, ASIGNADA, EN_CURSO, COMPLETADA, CANCELADA
            $table->integer('prioridad')->default(5);
            $table->foreignId('asignada_a_usuario_id')->nullable()->constrained('Usuarios')->onDelete('restrict');
            $table->dateTime('fecha_creacion')->default(DB::raw('GETDATE()'));
            $table->dateTime('fecha_finalizacion')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tareas');
    }
};

