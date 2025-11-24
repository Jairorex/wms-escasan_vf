<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Tareas', function (Blueprint $table) {
            // Agregar fecha_inicio si no existe
            if (!Schema::hasColumn('Tareas', 'fecha_inicio')) {
                $table->datetime('fecha_inicio')->nullable()->after('fecha_creacion');
            }
            // Agregar fecha_fin si no existe (ya existe fecha_finalizacion, pero agregamos fecha_fin también)
            if (!Schema::hasColumn('Tareas', 'fecha_fin')) {
                $table->datetime('fecha_fin')->nullable()->after('fecha_inicio');
            }
        });
    }

    public function down(): void
    {
        Schema::table('Tareas', function (Blueprint $table) {
            if (Schema::hasColumn('Tareas', 'fecha_inicio')) {
                $table->dropColumn('fecha_inicio');
            }
            if (Schema::hasColumn('Tareas', 'fecha_fin')) {
                $table->dropColumn('fecha_fin');
            }
        });
    }
};

