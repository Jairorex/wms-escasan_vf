<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('Ubicaciones', function (Blueprint $table) {
            $table->decimal('max_peso', 10, 2)->nullable()->after('tipo_ubicacion_id');
            $table->integer('max_cantidad')->nullable()->after('max_peso');
        });
    }

    public function down(): void
    {
        Schema::table('Ubicaciones', function (Blueprint $table) {
            $table->dropColumn(['max_peso', 'max_cantidad']);
        });
    }
};

