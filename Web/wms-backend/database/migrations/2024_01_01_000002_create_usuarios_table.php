<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Usuarios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('usuario', 50)->unique();
            $table->string('email', 100)->nullable()->unique();
            $table->string('password', 255);
            $table->foreignId('rol_id')->nullable()->constrained('Roles')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Usuarios');
    }
};

