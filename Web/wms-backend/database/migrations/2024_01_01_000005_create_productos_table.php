<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Productos', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 50)->unique();
            $table->string('nombre', 255);
            $table->string('descripcion', 500)->nullable();
            $table->decimal('peso', 10, 2)->nullable();
            $table->decimal('volumen', 10, 2)->nullable();
            // clasificacion_id y tipo_producto_id se agregan después con ALTER TABLE
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Productos');
    }
};

