<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UsuarioSeeder extends Seeder
{
    /**
     * Crear roles y usuarios iniciales
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            // Crear roles si no existen usando DB directamente para evitar timestamps
            $rolAdmin = DB::table('Roles')->where('nombre', 'Administrador')->first();
            if (!$rolAdmin) {
                $rolAdminId = DB::table('Roles')->insertGetId(['nombre' => 'Administrador']);
                $rolAdmin = (object)['id' => $rolAdminId];
            }

            $rolOperario = DB::table('Roles')->where('nombre', 'Operario')->first();
            if (!$rolOperario) {
                $rolOperarioId = DB::table('Roles')->insertGetId(['nombre' => 'Operario']);
                $rolOperario = (object)['id' => $rolOperarioId];
            }

            // Crear usuario Administrador
            $adminExists = DB::table('Usuarios')->where('usuario', 'admin')->exists();
            if (!$adminExists) {
                DB::table('Usuarios')->insert([
                    'nombre' => 'Administrador',
                    'usuario' => 'admin',
                    'email' => 'admin@wms.com',
                    'password' => Hash::make('admin123'),
                    'rol_id' => $rolAdmin->id ?? $rolAdmin,
                ]);
            }

            // Crear usuario Operario
            $operarioExists = DB::table('Usuarios')->where('usuario', 'operario')->exists();
            if (!$operarioExists) {
                DB::table('Usuarios')->insert([
                    'nombre' => 'Operario',
                    'usuario' => 'operario',
                    'email' => 'operario@wms.com',
                    'password' => Hash::make('operario123'),
                    'rol_id' => $rolOperario->id ?? $rolOperario,
                ]);
            }

            DB::commit();

            $this->command->info('✅ Usuarios creados exitosamente:');
            $this->command->info('   👤 Administrador:');
            $this->command->info('      Usuario: admin');
            $this->command->info('      Contraseña: admin123');
            $this->command->info('      Email: admin@wms.com');
            $this->command->info('');
            $this->command->info('   👤 Operario:');
            $this->command->info('      Usuario: operario');
            $this->command->info('      Contraseña: operario123');
            $this->command->info('      Email: operario@wms.com');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Error al crear usuarios: ' . $e->getMessage());
            throw $e;
        }
    }
}

