<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupervisorController extends Controller
{
    /**
     * Obtener estadísticas de supervisores
     * GET /api/supervisores/stats
     */
    public function stats(Request $request)
    {
        try {
            $user = $request->user();

            // Permitir acceso sin autenticación para desarrollo
            // En producción, descomentar la validación:
            // if (!$user || !$user->isAdmin()) {
            if ($user && !$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo los administradores pueden ver estas estadísticas'
                ], 403);
            }

            $supervisores = Usuario::whereHas('rol', function($q) {
                $q->where('nombre', 'Supervisor');
            })->withCount('operarios')->get();

            $totalSupervisores = $supervisores->count();
            $totalOperarios = Usuario::whereHas('rol', function($q) {
                $q->where('nombre', 'Operario');
            })->count();

            $supervisoresConOperarios = $supervisores->map(function($supervisor) {
                return [
                    'id' => $supervisor->id,
                    'nombre' => $supervisor->nombre,
                    'usuario' => $supervisor->usuario,
                    'email' => $supervisor->email,
                    'operarios_count' => $supervisor->operarios_count,
                    'operarios' => $supervisor->operarios->map(function($operario) {
                        return [
                            'id' => $operario->id,
                            'nombre' => $operario->nombre,
                            'usuario' => $operario->usuario,
                        ];
                    })
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_supervisores' => $totalSupervisores,
                    'total_operarios' => $totalOperarios,
                    'supervisores' => $supervisoresConOperarios,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar operario a supervisor
     * POST /api/supervisores/{supervisorId}/operarios/{operarioId}
     */
    public function asignarOperario(Request $request, $supervisorId, $operarioId)
    {
        try {
            $user = $request->user();

            if (!$user->isAdmin() && !$user->isSupervisor()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para asignar operarios'
                ], 403);
            }

            // Si es supervisor, solo puede asignar a sí mismo
            if ($user->isSupervisor() && $user->id != $supervisorId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo puedes asignar operarios a tu propio equipo'
                ], 403);
            }

            $supervisor = Usuario::findOrFail($supervisorId);
            if (!$supervisor->isSupervisor()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario especificado no es un supervisor'
                ], 400);
            }

            $operario = Usuario::findOrFail($operarioId);
            if (!$operario->isOperario()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario especificado no es un operario'
                ], 400);
            }

            $operario->supervisor_id = $supervisorId;
            $operario->save();

            return response()->json([
                'success' => true,
                'message' => 'Operario asignado exitosamente',
                'data' => [
                    'supervisor' => $supervisor->load('operarios'),
                    'operario' => $operario->load('supervisor'),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar operario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener operarios de un supervisor
     * GET /api/supervisores/{id}/operarios
     */
    public function getOperarios(Request $request, $id)
    {
        try {
            $user = $request->user();
            $supervisor = Usuario::findOrFail($id);

            // Verificar permisos
            if (!$user->isAdmin() && !$user->isSupervisor()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver esta información'
                ], 403);
            }

            // Si es supervisor, solo puede ver sus propios operarios
            if ($user->isSupervisor() && $user->id != $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo puedes ver tus propios operarios'
                ], 403);
            }

            $operarios = $supervisor->operarios()->with('rol')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'supervisor' => [
                        'id' => $supervisor->id,
                        'nombre' => $supervisor->nombre,
                        'usuario' => $supervisor->usuario,
                    ],
                    'operarios' => $operarios,
                    'count' => $operarios->count(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener operarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

