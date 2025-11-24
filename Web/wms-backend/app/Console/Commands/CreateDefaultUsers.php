<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class CreateDefaultUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wms:create-users 
                            {--force : Forzar creación aunque ya existan}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear usuarios admin, supervisor y operario por defecto';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Creando usuarios por defecto...');
        $this->newLine();

        DB::beginTransaction();

        try {
            // Crear o obtener roles usando DB directamente para evitar timestamps
            $rolAdmin = DB::table('Roles')->where('nombre', 'Administrador')->first();
            if (!$rolAdmin) {
                $rolAdminId = DB::table('Roles')->insertGetId(['nombre' => 'Administrador']);
                $rolAdmin = (object)['id' => $rolAdminId, 'nombre' => 'Administrador'];
                $this->info('✅ Rol Administrador creado');
            }

            $rolSupervisor = DB::table('Roles')->where('nombre', 'Supervisor')->first();
            if (!$rolSupervisor) {
                $rolSupervisorId = DB::table('Roles')->insertGetId(['nombre' => 'Supervisor']);
                $rolSupervisor = (object)['id' => $rolSupervisorId, 'nombre' => 'Supervisor'];
                $this->info('✅ Rol Supervisor creado');
            }

            $rolOperario = DB::table('Roles')->where('nombre', 'Operario')->first();
            if (!$rolOperario) {
                $rolOperarioId = DB::table('Roles')->insertGetId(['nombre' => 'Operario']);
                $rolOperario = (object)['id' => $rolOperarioId, 'nombre' => 'Operario'];
                $this->info('✅ Rol Operario creado');
            }

            $this->info('✅ Roles verificados/creados');

            $force = $this->option('force');

            // Crear usuario Administrador
            $adminExists = Usuario::where('usuario', 'admin')->exists();
            
            if ($adminExists && !$force) {
                $this->warn('⚠️  El usuario admin ya existe. Usa --force para recrearlo.');
            } else {
                if ($adminExists && $force) {
                    Usuario::where('usuario', 'admin')->delete();
                    $this->info('🔄 Usuario admin eliminado (forzado)');
                }

                $adminId = DB::table('Usuarios')->insertGetId([
                    'nombre' => 'Administrador',
                    'usuario' => 'admin',
                    'email' => 'admin@wms.com',
                    'password' => Hash::make('admin123'),
                    'rol_id' => $rolAdmin->id ?? $rolAdmin,
                ]);
                $admin = Usuario::find($adminId);

                $this->info('✅ Usuario Administrador creado');
            }

            // Crear usuario Supervisor
            $supervisorExists = Usuario::where('usuario', 'supervisor')->exists();
            
            if ($supervisorExists && !$force) {
                $this->warn('⚠️  El usuario supervisor ya existe. Usa --force para recrearlo.');
            } else {
                if ($supervisorExists && $force) {
                    Usuario::where('usuario', 'supervisor')->delete();
                    $this->info('🔄 Usuario supervisor eliminado (forzado)');
                }

                $supervisorId = DB::table('Usuarios')->insertGetId([
                    'nombre' => 'Supervisor',
                    'usuario' => 'supervisor',
                    'email' => 'supervisor@wms.com',
                    'password' => Hash::make('supervisor123'),
                    'rol_id' => $rolSupervisor->id ?? $rolSupervisor,
                ]);
                $supervisor = Usuario::find($supervisorId);

                $this->info('✅ Usuario Supervisor creado');
            }

            // Crear usuario Operario
            $operarioExists = Usuario::where('usuario', 'operario')->exists();
            
            if ($operarioExists && !$force) {
                $this->warn('⚠️  El usuario operario ya existe. Usa --force para recrearlo.');
            } else {
                if ($operarioExists && $force) {
                    Usuario::where('usuario', 'operario')->delete();
                    $this->info('🔄 Usuario operario eliminado (forzado)');
                }

                $operarioId = DB::table('Usuarios')->insertGetId([
                    'nombre' => 'Operario',
                    'usuario' => 'operario',
                    'email' => 'operario@wms.com',
                    'password' => Hash::make('operario123'),
                    'rol_id' => $rolOperario->id ?? $rolOperario,
                ]);
                $operario = Usuario::find($operarioId);

                $this->info('✅ Usuario Operario creado');
            }

            DB::commit();

            $this->newLine();
            $this->info('═══════════════════════════════════════════════════');
            $this->info('📋 CREDENCIALES DE ACCESO');
            $this->info('═══════════════════════════════════════════════════');
            $this->newLine();
            
            $this->table(
                ['Rol', 'Usuario', 'Contraseña', 'Email'],
                [
                    ['Administrador', 'admin', 'admin123', 'admin@wms.com'],
                    ['Supervisor', 'supervisor', 'supervisor123', 'supervisor@wms.com'],
                    ['Operario', 'operario', 'operario123', 'operario@wms.com'],
                ]
            );

            $this->newLine();
            $this->warn('⚠️  IMPORTANTE: Cambia estas contraseñas después del primer inicio de sesión');
            $this->newLine();

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error al crear usuarios: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}

