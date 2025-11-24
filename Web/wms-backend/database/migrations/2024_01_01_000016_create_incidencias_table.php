<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Incidencias', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_incidencia', 50); // DANO, ERROR_CONTEO, UBICACION_BLOQUEADA, OTROS
            $table->string('descripcion', 500);
            $table->dateTime('fecha_reporte')->default(DB::raw('GETDATE()'));
            $table->string('estado', 50)->default('ABIERTA'); // ABIERTA, EN_REVISION, CERRADA
            $table->foreignId('reportada_por_usuario_id')->nullable()->constrained('Usuarios')->onDelete('restrict');
            $table->foreignId('ubicacion_id')->nullable()->constrained('Ubicaciones')->onDelete('restrict');
            $table->foreignId('lote_id')->nullable()->constrained('Lotes')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Incidencias');
    }
};

