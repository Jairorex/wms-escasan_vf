<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Ubicaciones', function (Blueprint $table) {
            // Asociar ubicación con subbodega
            $table->foreignId('subbodega_id')->nullable()->after('tipo_ubicacion_id')
                ->constrained('Subbodegas')->onDelete('set null');
            
            // Control de temperatura en la ubicación
            $table->boolean('tiene_control_temperatura')->default(false)->after('subbodega_id');
            $table->decimal('temperatura_actual', 5, 2)->nullable()->after('tiene_control_temperatura');
            $table->dateTime('ultima_lectura_temperatura')->nullable()->after('temperatura_actual');
            
            // Estado de la ubicación
            $table->enum('estado', ['DISPONIBLE', 'OCUPADA', 'BLOQUEADA', 'MANTENIMIENTO'])
                ->default('DISPONIBLE')->after('ultima_lectura_temperatura');
        });
    }

    public function down(): void
    {
        Schema::table('Ubicaciones', function (Blueprint $table) {
            $table->dropForeign(['subbodega_id']);
            $table->dropColumn([
                'subbodega_id',
                'tiene_control_temperatura',
                'temperatura_actual',
                'ultima_lectura_temperatura',
                'estado'
            ]);
        });
    }
};

