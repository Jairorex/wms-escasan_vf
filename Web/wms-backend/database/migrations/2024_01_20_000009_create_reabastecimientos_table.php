<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Reabastecimientos', function (Blueprint $table) {
            $table->id();
            $table->string('numero_reabastecimiento', 50)->unique();
            
            // Tipo de reabastecimiento
            $table->enum('tipo', [
                'MANUAL',           // Creado manualmente
                'AUTOMATICO',       // Generado por stock mínimo
                'PROGRAMADO'        // Generado por programación quincenal
            ])->default('MANUAL');
            
            // Origen y destino
            $table->foreignId('subbodega_origen_id')->constrained('Subbodegas');
            $table->foreignId('subbodega_destino_id')->constrained('Subbodegas');
            
            // Estado
            $table->enum('estado', [
                'PENDIENTE',
                'APROBADO',
                'EN_PROCESO',
                'COMPLETADO',
                'CANCELADO'
            ])->default('PENDIENTE');
            
            // Prioridad
            $table->enum('prioridad', ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'])->default('MEDIA');
            
            // Usuarios (Usuarios usa int)
            $table->integer('solicitado_por')->nullable();
            $table->integer('aprobado_por')->nullable();
            $table->integer('ejecutado_por')->nullable();
            
            // Fechas
            $table->dateTime('fecha_solicitud')->default(DB::raw('GETDATE()'));
            $table->dateTime('fecha_aprobacion')->nullable();
            $table->dateTime('fecha_ejecucion')->nullable();
            $table->dateTime('fecha_completado')->nullable();
            $table->date('fecha_programada')->nullable(); // Para reabastecimientos programados
            
            // Observaciones
            $table->text('observaciones')->nullable();
            $table->string('motivo_cancelacion', 255)->nullable();
        });

        // Detalle del reabastecimiento
        Schema::create('Detalle_Reabastecimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reabastecimiento_id')->constrained('Reabastecimientos')->onDelete('cascade');
            $table->integer('producto_id'); // Productos usa int
            $table->integer('lote_id')->nullable(); // Lotes usa int
            
            // Cantidades
            $table->decimal('cantidad_solicitada', 10, 2);
            $table->decimal('cantidad_aprobada', 10, 2)->nullable();
            $table->decimal('cantidad_enviada', 10, 2)->default(0);
            
            // Ubicaciones (Ubicaciones usa int)
            $table->integer('ubicacion_origen_id')->nullable();
            $table->integer('ubicacion_destino_id')->nullable();
            
            // Estado del detalle
            $table->enum('estado', ['PENDIENTE', 'PARCIAL', 'COMPLETADO', 'CANCELADO'])->default('PENDIENTE');
            
            $table->text('observaciones')->nullable();
        });

        // Tabla de configuración de reabastecimientos programados
        Schema::create('Configuracion_Reabastecimiento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subbodega_id')->constrained('Subbodegas')->onDelete('cascade');
            $table->integer('producto_id')->nullable(); // Productos usa int
            
            // Configuración
            $table->integer('stock_minimo_trigger')->default(10); // Stock que dispara el reabastecimiento
            $table->integer('cantidad_reabastecimiento')->default(50); // Cantidad a reabastecer
            $table->integer('dias_entre_reabastecimientos')->default(15); // Cada cuántos días
            
            // Próximo reabastecimiento programado
            $table->date('proximo_reabastecimiento')->nullable();
            
            $table->boolean('activo')->default(true);
            $table->dateTime('fecha_creacion')->default(DB::raw('GETDATE()'));
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Configuracion_Reabastecimiento');
        Schema::dropIfExists('Detalle_Reabastecimientos');
        Schema::dropIfExists('Reabastecimientos');
    }
};

