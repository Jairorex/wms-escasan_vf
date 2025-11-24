<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tarea;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TareaKpiController extends Controller
{
    /**
     * Obtener KPIs de tareas
     * GET /api/tareas/kpis
     */
    public function index(Request $request)
    {
        try {
            // Por ahora, permitir acceso sin autenticación para desarrollo
            // En producción, usar: $user = $request->user();
            $user = $request->user(); // null si no está autenticado
            $filtros = $request->only(['fecha_desde', 'fecha_hasta', 'tipo_tarea', 'estado']);

            $query = Tarea::query();

            // Filtros por rol
            if ($user) {
                if ($user->isOperario()) {
                    // Operario solo ve sus tareas
                    $query->where('asignada_a_usuario_id', $user->id);
                } elseif ($user->isSupervisor()) {
                    // Supervisor ve tareas de sus operarios
                    $operariosIds = $user->operarios()->pluck('id');
                    if ($operariosIds->count() > 0) {
                        $query->whereIn('asignada_a_usuario_id', $operariosIds);
                    } else {
                        // Si no tiene operarios, no verá tareas
                        $query->whereRaw('1 = 0');
                    }
                }
                // Admin ve todas las tareas (sin filtro)
            }

            // Aplicar filtros adicionales
            if (isset($filtros['fecha_desde'])) {
                $query->where('fecha_creacion', '>=', $filtros['fecha_desde']);
            }
            if (isset($filtros['fecha_hasta'])) {
                $query->where('fecha_creacion', '<=', $filtros['fecha_hasta']);
            }
            if (isset($filtros['tipo_tarea'])) {
                $query->where('tipo_tarea', $filtros['tipo_tarea']);
            }
            if (isset($filtros['estado'])) {
                $query->where('estado', $filtros['estado']);
            }

            $tareas = $query->with('usuarioAsignado')->get();

            // Calcular KPIs
            $totalTareas = $tareas->count();
            $tareasCompletadas = $tareas->where('estado', 'COMPLETADA')->count();
            $tareasEnProceso = $tareas->where('estado', 'EN_PROCESO')->count();
            $tareasPendientes = $tareas->where('estado', 'CREADA')->count();

            // Calcular tiempos promedio
            $tareasCompletadasConTiempo = $tareas->filter(function($tarea) {
                return $tarea->estado === 'COMPLETADA' && $tarea->fecha_inicio && $tarea->fecha_fin;
            });

            $tiempoPromedio = null;
            if ($tareasCompletadasConTiempo->count() > 0) {
                $tiempoTotal = $tareasCompletadasConTiempo->sum(function($tarea) {
                    return $tarea->fecha_inicio->diffInMinutes($tarea->fecha_fin);
                });
                $tiempoPromedio = round($tiempoTotal / $tareasCompletadasConTiempo->count(), 2);
            }

            // Tareas por tipo
            $tareasPorTipo = $tareas->groupBy('tipo_tarea')->map(function($group) {
                return [
                    'total' => $group->count(),
                    'completadas' => $group->where('estado', 'COMPLETADA')->count(),
                    'en_proceso' => $group->where('estado', 'EN_PROCESO')->count(),
                    'pendientes' => $group->where('estado', 'CREADA')->count(),
                ];
            });

            // Tareas por operario (solo para supervisor y admin)
            $tareasPorOperario = [];
            if ($user->isSupervisor() || $user->isAdmin()) {
                $tareasPorOperario = $tareas->groupBy('asignada_a_usuario_id')->map(function($group) {
                    $usuario = $group->first()->usuarioAsignado;
                    return [
                        'usuario_id' => $usuario->id ?? null,
                        'usuario_nombre' => $usuario->nombre ?? 'Sin asignar',
                        'total' => $group->count(),
                        'completadas' => $group->where('estado', 'COMPLETADA')->count(),
                        'tiempo_promedio' => $this->calcularTiempoPromedio($group),
                    ];
                })->values();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'resumen' => [
                        'total' => $totalTareas,
                        'completadas' => $tareasCompletadas,
                        'en_proceso' => $tareasEnProceso,
                        'pendientes' => $tareasPendientes,
                        'tiempo_promedio_minutos' => $tiempoPromedio,
                        'tiempo_promedio_formateado' => $tiempoPromedio ? $this->formatearTiempo($tiempoPromedio) : null,
                    ],
                    'por_tipo' => $tareasPorTipo,
                    'por_operario' => $tareasPorOperario,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener KPIs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function calcularTiempoPromedio($tareas)
    {
        $completadas = $tareas->filter(function($tarea) {
            return $tarea->estado === 'COMPLETADA' && $tarea->fecha_inicio && $tarea->fecha_fin;
        });

        if ($completadas->count() === 0) {
            return null;
        }

        $tiempoTotal = $completadas->sum(function($tarea) {
            return $tarea->fecha_inicio->diffInMinutes($tarea->fecha_fin);
        });

        return round($tiempoTotal / $completadas->count(), 2);
    }

    private function formatearTiempo($minutos)
    {
        $horas = floor($minutos / 60);
        $mins = round($minutos % 60);

        if ($horas > 0) {
            return "{$horas}h {$mins}m";
        }
        return "{$mins}m";
    }
}

