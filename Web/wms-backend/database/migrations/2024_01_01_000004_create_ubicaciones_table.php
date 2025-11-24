<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ubicaciones', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();
            $table->string('zona', 10)->nullable();
            $table->string('pasillo', 10)->nullable();
            $table->string('estante', 10)->nullable();
            $table->string('nivel', 10)->nullable();
            $table->foreignId('tipo_ubicacion_id')->nullable()->constrained('Tipos_Ubicacion')->onDelete('restrict');
            // max_peso y max_cantidad se agregan después con ALTER TABLE
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ubicaciones');
    }
};

