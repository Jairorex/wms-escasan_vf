<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Productos', function (Blueprint $table) {
            // Categoría de riesgo del producto
            $table->foreignId('categoria_riesgo_id')->nullable()->after('volumen')
                ->constrained('Categorias_Riesgo')->onDelete('set null');
            
            // Control de temperatura
            $table->boolean('requiere_temperatura')->default(false)->after('categoria_riesgo_id');
            $table->decimal('temperatura_min', 5, 2)->nullable()->after('requiere_temperatura');
            $table->decimal('temperatura_max', 5, 2)->nullable()->after('temperatura_min');
            
            // Índice de rotación (para slotting automático)
            $table->enum('rotacion', ['ALTA', 'MEDIA', 'BAJA'])->default('MEDIA')->after('temperatura_max');
            
            // Stock mínimo y máximo
            $table->integer('stock_minimo')->default(0)->after('rotacion');
            $table->integer('stock_maximo')->nullable()->after('stock_minimo');
            
            // Información adicional
            $table->string('codigo_barras', 50)->nullable()->after('stock_maximo');
            $table->string('proveedor_principal', 100)->nullable()->after('codigo_barras');
        });
    }

    public function down(): void
    {
        Schema::table('Productos', function (Blueprint $table) {
            $table->dropForeign(['categoria_riesgo_id']);
            $table->dropColumn([
                'categoria_riesgo_id',
                'requiere_temperatura',
                'temperatura_min',
                'temperatura_max',
                'rotacion',
                'stock_minimo',
                'stock_maximo',
                'codigo_barras',
                'proveedor_principal'
            ]);
        });
    }
};

