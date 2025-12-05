<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla para registrar lecturas de temperatura (IoT ready)
        Schema::create('Lecturas_Temperatura', function (Blueprint $table) {
            $table->id();
            
            // Puede ser de una ubicación o subbodega (Ubicaciones usa int, Subbodegas usa bigint)
            $table->integer('ubicacion_id')->nullable();
            $table->foreignId('subbodega_id')->nullable()->constrained('Subbodegas')->onDelete('cascade');
            
            // Lectura
            $table->decimal('temperatura', 5, 2);
            $table->decimal('humedad', 5, 2)->nullable(); // Para futuro
            
            // Validación
            $table->boolean('dentro_rango')->default(true);
            $table->decimal('temperatura_min_esperada', 5, 2)->nullable();
            $table->decimal('temperatura_max_esperada', 5, 2)->nullable();
            
            // Origen de la lectura
            $table->enum('origen', ['MANUAL', 'SENSOR', 'RECEPCION'])->default('MANUAL');
            $table->string('sensor_id', 50)->nullable(); // ID del sensor IoT
            
            // Usuario que registró (si es manual) - Usuarios usa int
            $table->integer('usuario_id')->nullable();
            
            // Fecha de lectura
            $table->dateTime('fecha_lectura')->default(DB::raw('GETDATE()'));
            
            // Si generó alerta - Alertas usa int
            $table->integer('alerta_id')->nullable();
            
            $table->text('observaciones')->nullable();
        });

        // Modificar tabla de alertas para agregar tipo de alerta de temperatura
        // Nota: El tipo TEMPERATURA ya debería poder manejarse con los tipos existentes
    }

    public function down(): void
    {
        Schema::dropIfExists('Lecturas_Temperatura');
    }
};

