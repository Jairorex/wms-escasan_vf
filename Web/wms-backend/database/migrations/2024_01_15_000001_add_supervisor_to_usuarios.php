<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Usuarios', function (Blueprint $table) {
            // Verificar si la columna ya existe
            if (!Schema::hasColumn('Usuarios', 'supervisor_id')) {
                // Usar integer en lugar de foreignId para compatibilidad con SQL Server
                $table->integer('supervisor_id')->nullable()->after('rol_id');
                
                // Agregar la clave foránea manualmente con NO ACTION para evitar ciclos en SQL Server
                $table->foreign('supervisor_id')
                    ->references('id')
                    ->on('Usuarios')
                    ->onDelete('no action')
                    ->onUpdate('no action');
            }
        });
    }

    public function down(): void
    {
        Schema::table('Usuarios', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->dropColumn('supervisor_id');
        });
    }
};

