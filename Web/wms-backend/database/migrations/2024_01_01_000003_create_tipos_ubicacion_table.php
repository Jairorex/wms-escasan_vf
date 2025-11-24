<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Tipos_Ubicacion', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique();
            $table->boolean('es_picking')->default(false);
            $table->boolean('es_reserva')->default(false);
            $table->decimal('temperatura_min', 5, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tipos_Ubicacion');
    }
};

