<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla de permisos
        Schema::create('Permisos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 50)->unique();
            $table->string('nombre', 100);
            $table->string('modulo', 50); // Módulo al que pertenece
            $table->string('descripcion', 255)->nullable();
            $table->boolean('activo')->default(true);
        });

        // Tabla pivot Roles_Permisos
        Schema::create('Roles_Permisos', function (Blueprint $table) {
            $table->id();
            $table->integer('rol_id'); // Roles usa int
            $table->foreignId('permiso_id')->constrained('Permisos')->onDelete('cascade');
            $table->unique(['rol_id', 'permiso_id']);
        });

        // Insertar permisos por módulo
        $permisos = [
            // Recepción
            ['codigo' => 'RECEPCION_VER', 'nombre' => 'Ver recepciones', 'modulo' => 'RECEPCION'],
            ['codigo' => 'RECEPCION_CREAR', 'nombre' => 'Crear recepciones', 'modulo' => 'RECEPCION'],
            ['codigo' => 'RECEPCION_EDITAR', 'nombre' => 'Editar recepciones', 'modulo' => 'RECEPCION'],
            ['codigo' => 'RECEPCION_VALIDAR', 'nombre' => 'Validar recepciones', 'modulo' => 'RECEPCION'],
            ['codigo' => 'RECEPCION_FRIA', 'nombre' => 'Gestionar cadena fría', 'modulo' => 'RECEPCION'],
            
            // Inventario
            ['codigo' => 'INVENTARIO_VER', 'nombre' => 'Ver inventario', 'modulo' => 'INVENTARIO'],
            ['codigo' => 'INVENTARIO_AJUSTAR', 'nombre' => 'Ajustar inventario', 'modulo' => 'INVENTARIO'],
            ['codigo' => 'INVENTARIO_MOVER', 'nombre' => 'Mover inventario', 'modulo' => 'INVENTARIO'],
            ['codigo' => 'INVENTARIO_REPORTE', 'nombre' => 'Reportes de inventario', 'modulo' => 'INVENTARIO'],
            
            // Picking
            ['codigo' => 'PICKING_VER', 'nombre' => 'Ver tareas picking', 'modulo' => 'PICKING'],
            ['codigo' => 'PICKING_EJECUTAR', 'nombre' => 'Ejecutar picking', 'modulo' => 'PICKING'],
            ['codigo' => 'PICKING_ASIGNAR', 'nombre' => 'Asignar tareas picking', 'modulo' => 'PICKING'],
            
            // Packing
            ['codigo' => 'PACKING_VER', 'nombre' => 'Ver tareas packing', 'modulo' => 'PACKING'],
            ['codigo' => 'PACKING_EJECUTAR', 'nombre' => 'Ejecutar packing', 'modulo' => 'PACKING'],
            
            // Reabastecimiento
            ['codigo' => 'REABASTECIMIENTO_VER', 'nombre' => 'Ver reabastecimientos', 'modulo' => 'REABASTECIMIENTO'],
            ['codigo' => 'REABASTECIMIENTO_CREAR', 'nombre' => 'Crear reabastecimientos', 'modulo' => 'REABASTECIMIENTO'],
            ['codigo' => 'REABASTECIMIENTO_APROBAR', 'nombre' => 'Aprobar reabastecimientos', 'modulo' => 'REABASTECIMIENTO'],
            
            // Subbodegas
            ['codigo' => 'SUBBODEGA_VER', 'nombre' => 'Ver subbodegas', 'modulo' => 'SUBBODEGA'],
            ['codigo' => 'SUBBODEGA_GESTIONAR', 'nombre' => 'Gestionar subbodegas', 'modulo' => 'SUBBODEGA'],
            
            // Alertas
            ['codigo' => 'ALERTAS_VER', 'nombre' => 'Ver alertas', 'modulo' => 'ALERTAS'],
            ['codigo' => 'ALERTAS_RESOLVER', 'nombre' => 'Resolver alertas', 'modulo' => 'ALERTAS'],
            ['codigo' => 'ALERTAS_TEMPERATURA', 'nombre' => 'Alertas de temperatura', 'modulo' => 'ALERTAS'],
            
            // Catálogos
            ['codigo' => 'CATALOGOS_VER', 'nombre' => 'Ver catálogos', 'modulo' => 'CATALOGOS'],
            ['codigo' => 'CATALOGOS_GESTIONAR', 'nombre' => 'Gestionar catálogos', 'modulo' => 'CATALOGOS'],
            
            // Usuarios
            ['codigo' => 'USUARIOS_VER', 'nombre' => 'Ver usuarios', 'modulo' => 'USUARIOS'],
            ['codigo' => 'USUARIOS_GESTIONAR', 'nombre' => 'Gestionar usuarios', 'modulo' => 'USUARIOS'],
            
            // Reportes
            ['codigo' => 'REPORTES_VER', 'nombre' => 'Ver reportes', 'modulo' => 'REPORTES'],
            ['codigo' => 'REPORTES_EXPORTAR', 'nombre' => 'Exportar reportes', 'modulo' => 'REPORTES'],
            
            // Dashboard
            ['codigo' => 'DASHBOARD_VER', 'nombre' => 'Ver dashboard', 'modulo' => 'DASHBOARD'],
            ['codigo' => 'DASHBOARD_KPI', 'nombre' => 'Ver KPIs', 'modulo' => 'DASHBOARD'],
        ];

        foreach ($permisos as $permiso) {
            DB::table('Permisos')->insert(array_merge($permiso, ['activo' => true]));
        }

        // Insertar roles adicionales si no existen
        $rolesExistentes = DB::table('Roles')->pluck('nombre')->toArray();
        
        $nuevosRoles = [
            'Recepcionista',
            'Operario Cadena Fría',
            'Operario Picking',
            'Supervisor Inventario'
        ];

        foreach ($nuevosRoles as $rol) {
            if (!in_array($rol, $rolesExistentes)) {
                DB::table('Roles')->insert(['nombre' => $rol]);
            }
        }

        // Asignar permisos a roles
        $adminId = DB::table('Roles')->where('nombre', 'Administrador')->value('id');
        $supervisorId = DB::table('Roles')->where('nombre', 'Supervisor')->value('id');
        $operarioId = DB::table('Roles')->where('nombre', 'Operario')->value('id');
        $recepcionistaId = DB::table('Roles')->where('nombre', 'Recepcionista')->value('id');
        $operarioFrioId = DB::table('Roles')->where('nombre', 'Operario Cadena Fría')->value('id');
        $operarioPickingId = DB::table('Roles')->where('nombre', 'Operario Picking')->value('id');
        $supervisorInvId = DB::table('Roles')->where('nombre', 'Supervisor Inventario')->value('id');

        // Helper function para insertar si no existe
        $insertIfNotExists = function($rolId, $permisoId) {
            $exists = DB::table('Roles_Permisos')
                ->where('rol_id', $rolId)
                ->where('permiso_id', $permisoId)
                ->exists();
            if (!$exists) {
                DB::table('Roles_Permisos')->insert(['rol_id' => $rolId, 'permiso_id' => $permisoId]);
            }
        };

        // Admin tiene todos los permisos
        if ($adminId) {
            $todosPermisos = DB::table('Permisos')->pluck('id');
            foreach ($todosPermisos as $permisoId) {
                $insertIfNotExists($adminId, $permisoId);
            }
        }

        // Recepcionista
        if ($recepcionistaId) {
            $permisosRecepcionista = DB::table('Permisos')
                ->whereIn('codigo', ['RECEPCION_VER', 'RECEPCION_CREAR', 'RECEPCION_VALIDAR', 'CATALOGOS_VER', 'DASHBOARD_VER'])
                ->pluck('id');
            foreach ($permisosRecepcionista as $permisoId) {
                $insertIfNotExists($recepcionistaId, $permisoId);
            }
        }

        // Operario Cadena Fría
        if ($operarioFrioId) {
            $permisosFrio = DB::table('Permisos')
                ->whereIn('codigo', ['RECEPCION_VER', 'RECEPCION_CREAR', 'RECEPCION_FRIA', 'ALERTAS_VER', 'ALERTAS_TEMPERATURA', 'DASHBOARD_VER'])
                ->pluck('id');
            foreach ($permisosFrio as $permisoId) {
                $insertIfNotExists($operarioFrioId, $permisoId);
            }
        }

        // Operario Picking
        if ($operarioPickingId) {
            $permisosPicking = DB::table('Permisos')
                ->whereIn('codigo', ['PICKING_VER', 'PICKING_EJECUTAR', 'PACKING_VER', 'PACKING_EJECUTAR', 'REABASTECIMIENTO_VER', 'INVENTARIO_VER', 'DASHBOARD_VER'])
                ->pluck('id');
            foreach ($permisosPicking as $permisoId) {
                $insertIfNotExists($operarioPickingId, $permisoId);
            }
        }

        // Supervisor Inventario
        if ($supervisorInvId) {
            $permisosSupervisorInv = DB::table('Permisos')
                ->whereIn('codigo', [
                    'INVENTARIO_VER', 'INVENTARIO_AJUSTAR', 'INVENTARIO_MOVER', 'INVENTARIO_REPORTE',
                    'SUBBODEGA_VER', 'ALERTAS_VER', 'ALERTAS_RESOLVER', 'REPORTES_VER', 'REPORTES_EXPORTAR', 'DASHBOARD_VER', 'DASHBOARD_KPI'
                ])
                ->pluck('id');
            foreach ($permisosSupervisorInv as $permisoId) {
                $insertIfNotExists($supervisorInvId, $permisoId);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('Roles_Permisos');
        Schema::dropIfExists('Permisos');
        
        // Eliminar roles agregados
        DB::table('Roles')->whereIn('nombre', [
            'Recepcionista',
            'Operario Cadena Fría',
            'Operario Picking',
            'Supervisor Inventario'
        ])->delete();
    }
};

