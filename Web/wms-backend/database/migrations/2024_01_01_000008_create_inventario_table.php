<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lote_id')->constrained('Lotes')->onDelete('restrict');
            $table->foreignId('ubicacion_id')->constrained('Ubicaciones')->onDelete('restrict');
            $table->decimal('cantidad', 10, 2);
            $table->string('estado', 50)->default('Disponible'); // Disponible, Cuarentena, Dañado, Transito
            
            $table->unique(['lote_id', 'ubicacion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Inventario');
    }
};

