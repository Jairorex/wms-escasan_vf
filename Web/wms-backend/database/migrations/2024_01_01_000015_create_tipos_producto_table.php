<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Tipos_Producto', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique();
            $table->boolean('manejo_especial')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tipos_Producto');
    }
};

