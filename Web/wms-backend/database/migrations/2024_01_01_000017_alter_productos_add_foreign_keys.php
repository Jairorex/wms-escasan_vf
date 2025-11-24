<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Productos', function (Blueprint $table) {
            $table->foreignId('clasificacion_id')->nullable()->after('volumen')->constrained('Clasificaciones')->onDelete('restrict');
            $table->foreignId('tipo_producto_id')->nullable()->after('clasificacion_id')->constrained('Tipos_Producto')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('Productos', function (Blueprint $table) {
            $table->dropForeign(['clasificacion_id']);
            $table->dropForeign(['tipo_producto_id']);
            $table->dropColumn(['clasificacion_id', 'tipo_producto_id']);
        });
    }
};

