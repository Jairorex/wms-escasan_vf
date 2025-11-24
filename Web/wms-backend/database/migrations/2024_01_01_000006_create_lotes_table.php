<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Lotes', function (Blueprint $table) {
            $table->id();
            $table->string('lote_codigo', 50)->unique();
            $table->foreignId('producto_id')->constrained('Productos')->onDelete('restrict');
            $table->decimal('cantidad_original', 10, 2);
            $table->date('fecha_fabricacion')->nullable();
            $table->date('fecha_caducidad')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Lotes');
    }
};

