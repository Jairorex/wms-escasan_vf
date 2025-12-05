<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Recepciones', function (Blueprint $table) {
            $table->id();
            $table->string('numero_recepcion', 50)->unique();
            $table->integer('orden_id')->nullable(); // Ordenes usa int
            
            // Tipo de recepción
            $table->enum('tipo_recepcion', ['ESTANDAR', 'CADENA_FRIA', 'IMPORTACION'])->default('ESTANDAR');
            
            // Datos del proveedor
            $table->string('proveedor', 100)->nullable();
            $table->string('documento_proveedor', 50)->nullable(); // Factura, guía, etc.
            
            // Subbodega de destino
            $table->foreignId('subbodega_destino_id')->nullable()->constrained('Subbodegas')->onDelete('set null');
            
            // Control de temperatura (solo para CADENA_FRIA)
            $table->decimal('temperatura_recibida', 5, 2)->nullable();
            $table->boolean('temperatura_valida')->nullable();
            $table->string('observaciones_temperatura', 255)->nullable();
            
            // Estado de la recepción
            $table->enum('estado', [
                'PENDIENTE',
                'EN_PROCESO',
                'COMPLETADA',
                'RECHAZADA',
                'PARCIAL'
            ])->default('PENDIENTE');
            
            // Motivo de rechazo si aplica
            $table->string('motivo_rechazo', 255)->nullable();
            
            // Usuario que realizó la recepción
            $table->integer('usuario_id')->nullable(); // Usuarios usa int
            
            // Fechas
            $table->dateTime('fecha_recepcion')->default(DB::raw('GETDATE()'));
            $table->dateTime('fecha_completada')->nullable();
            
            // Documentos adjuntos (para importación)
            $table->text('documentos_adjuntos')->nullable(); // JSON con rutas de archivos
            
            // Observaciones generales
            $table->text('observaciones')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Recepciones');
    }
};

