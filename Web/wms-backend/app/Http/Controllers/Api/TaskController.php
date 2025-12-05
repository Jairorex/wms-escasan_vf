<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ValidateScanRequest;
use App\Services\TaskEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    protected TaskEngineService $taskEngineService;

    public function __construct(TaskEngineService $taskEngineService)
    {
        $this->taskEngineService = $taskEngineService;
    }

    /**
     * Valida un escaneo durante la ejecución de una tarea
     * 
     * POST /api/validate-scan
     */
    public function validateScan(ValidateScanRequest $request): JsonResponse
    {
        try {
            $tareaId = $request->input('tarea_id');
            $tipoEscaneo = $request->input('tipo_escaneo');
            $valor = $request->input('valor');
            $cantidad = $request->input('cantidad');
            $usuarioId = $request->user()?->id;

            $resultado = $this->taskEngineService->validateStep(
                $tareaId,
                $tipoEscaneo,
                $valor,
                $cantidad,
                $usuarioId
            );

            if ($resultado['success']) {
                return response()->json([
                    'status' => 'success',
                    'message' => $resultado['message'],
                    'next_step' => $resultado['next_step'],
                    'data' => $resultado['data'] ?? null
                ], 200);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => $resultado['message'],
                    'next_step' => $resultado['next_step'] ?? null
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Error en validateScan: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar la validación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene las tareas asignadas a un usuario
     * 
     * GET /api/tasks
     */
    public function getTasks(Request $request): JsonResponse
    {
        try {
            // Primero verificar que la tabla existe
            $tableExists = \Illuminate\Support\Facades\Schema::hasTable('Tareas');
            if (!$tableExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'La tabla Tareas no existe en la base de datos'
                ], 500);
            }

            $query = \App\Models\Tarea::query();

            // Filtro por estado si se proporciona
            if ($request->has('estado')) {
                $estado = $request->query('estado');
                $query->where('estado', $estado);
            }

            // Filtro por tipo_tarea si se proporciona
            if ($request->has('tipo_tarea')) {
                $tipoTarea = $request->query('tipo_tarea');
                $query->where('tipo_tarea', $tipoTarea);
            }

            // Filtros por rol
            $user = $request->user();
            if ($user) {
                if ($user->isOperario()) {
                    // Operario solo ve sus tareas asignadas
                    $query->where('asignada_a_usuario_id', $user->id);
                } elseif ($user->isSupervisor()) {
                    // Supervisor ve TODAS las tareas para poder asignarlas
                    // No aplicamos filtro - ve todas las tareas como el admin
                    // Esto permite que pueda asignar tareas a cualquier operario
                }
                // Admin y Supervisor ven todas las tareas (sin filtro adicional)
            }

            // Obtener las tareas básicas primero
            $tareas = $query->orderBy('fecha_creacion', 'desc')->get();

            // Cargar relaciones de forma segura con try-catch
            foreach ($tareas as $tarea) {
                try {
                    $tarea->load('orden');
                    $tarea->load('usuarioAsignado');
                    $tarea->load('detalleTareas');
                    
                    // Cargar relaciones de detalleTareas
                    foreach ($tarea->detalleTareas as $detalle) {
                        try {
                            if ($detalle->lote_id) {
                                $detalle->load('lote');
                                if ($detalle->lote && $detalle->lote->producto_id) {
                                    $detalle->lote->load('producto');
                                }
                            }
                            if ($detalle->ubicacion_origen_id) {
                                $detalle->load('ubicacionOrigen');
                            }
                            if ($detalle->ubicacion_destino_id) {
                                $detalle->load('ubicacionDestino');
                            }
                        } catch (\Exception $e) {
                            Log::warning('Error cargando relaciones de detalleTarea: ' . $e->getMessage());
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('Error cargando relaciones de tarea: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'data' => $tareas
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en getTasks: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las tareas: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Obtiene los detalles de una tarea específica
     * 
     * GET /api/tasks/{id}
     */
    public function getTask(int $id): JsonResponse
    {
        try {
            $tarea = \App\Models\Tarea::with([
                'detalleTareas' => function($q) {
                    $q->with(['lote' => function($q) {
                        $q->with('producto');
                    }]);
                    $q->with('ubicacionOrigen');
                    $q->with('ubicacionDestino');
                },
                'orden',
                'usuarioAsignado'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $tarea
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en getTask: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la tarea: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crea una nueva tarea
     * 
     * POST /api/tasks
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'tipo_tarea' => 'required|string|in:CONTEO,REABASTECER,PUTAWAY,PICK',
                'prioridad' => 'nullable|string|in:BAJA,NORMAL,ALTA,URGENTE',
                'orden_id' => 'nullable|integer', // ✅ permite tareas sin orden
                'usuario_asignado_id' => 'nullable|integer|exists:Usuarios,id',
                'observaciones' => 'nullable|string',
            ]);
    
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }
    
            // 🔹 Mapeo de prioridad texto → número
            $prioridadTexto = strtoupper($request->input('prioridad', 'NORMAL'));
            $prioridadMap = [
                'BAJA' => 1,
                'NORMAL' => 2,
                'ALTA' => 3,
                'URGENTE' => 4,
            ];
            $prioridadValor = $prioridadMap[$prioridadTexto] ?? 2;
    
            // 🔹 Crear tarea con valores válidos
            $tarea = \App\Models\Tarea::create([
                'tipo_tarea' => $request->input('tipo_tarea'),
                'prioridad' => $prioridadValor,
                'orden_id' => $request->input('orden_id'),
                'asignada_a_usuario_id' => $request->input('usuario_asignado_id'),
                'estado' => 'CREADA',
                'fecha_creacion' => now(),
            ]);
    
            return response()->json([
                'success' => true,
                'message' => 'Tarea creada exitosamente',
                'data' => $tarea->load(['detalleTareas', 'orden'])
            ], 201);
    
        } catch (\Exception $e) {
            Log::error('Error en store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la tarea: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Actualiza una tarea
     * 
     * PUT /api/tasks/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $tarea = \App\Models\Tarea::findOrFail($id);
            $estadoAnterior = $tarea->estado;
            $nuevoEstado = $request->input('estado', $tarea->estado);

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'tipo_tarea' => 'sometimes|required|string|in:PUTAWAY,PICK,MOVE,COUNT',
                'prioridad' => 'nullable|string|in:BAJA,NORMAL,ALTA,URGENTE',
                'orden_id' => 'nullable|integer|exists:Ordenes,id',
                'usuario_asignado_id' => 'nullable|integer|exists:Usuarios,id',
                'estado' => 'nullable|string|in:CREADA,ASIGNADA,EN_CURSO,EN_PROCESO,COMPLETADA,CANCELADA',
                'observaciones' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'tipo_tarea' => $request->input('tipo_tarea', $tarea->tipo_tarea),
                'prioridad' => $request->input('prioridad', $tarea->prioridad),
                'orden_id' => $request->input('orden_id', $tarea->orden_id),
                'asignada_a_usuario_id' => $request->input('usuario_asignado_id', $tarea->asignada_a_usuario_id),
                'estado' => $nuevoEstado,
            ];

            // Manejar timestamps según cambio de estado
            if ($estadoAnterior !== $nuevoEstado) {
                // Si cambia a EN_CURSO o EN_PROCESO y no tiene fecha_inicio, establecerla
                if (($nuevoEstado === 'EN_CURSO' || $nuevoEstado === 'EN_PROCESO') && !$tarea->fecha_inicio) {
                    $updateData['fecha_inicio'] = now();
                }
                // Si cambia a COMPLETADA y no tiene fecha_fin, establecerla
                if ($nuevoEstado === 'COMPLETADA' && !$tarea->fecha_fin) {
                    $updateData['fecha_fin'] = now();
                    $updateData['fecha_finalizacion'] = now();
                }
            }

            $tarea->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Tarea actualizada exitosamente',
                'data' => $tarea->load(['detalleTareas', 'orden'])
            ]);

        } catch (\Exception $e) {
            Log::error('Error en update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la tarea: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Iniciar una tarea (cambiar estado a EN_CURSO)
     * POST /api/tasks/{id}/start
     */
    public function start(Request $request, int $id): JsonResponse
    {
        try {
            $tarea = \App\Models\Tarea::findOrFail($id);

            if ($tarea->estado === 'COMPLETADA') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede iniciar una tarea ya completada'
                ], 400);
            }

            // Usar actualización directa con DB para evitar problemas con triggers
            $updateData = [
                'estado' => 'EN_CURSO',
            ];
            
            // Solo actualizar fecha_inicio si no existe
            if (!$tarea->fecha_inicio) {
                $updateData['fecha_inicio'] = now();
            }
            
            // Actualizar usando DB directamente para evitar problemas con eventos/triggers
            DB::table('Tareas')
                ->where('id', $id)
                ->update($updateData);
            
            // Recargar la tarea
            $tarea->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Tarea iniciada',
                'data' => $tarea->load(['detalleTareas', 'orden', 'usuarioAsignado'])
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en start: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'tarea_id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar la tarea: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Finalizar una tarea (cambiar estado a COMPLETADA)
     * POST /api/tasks/{id}/complete
     * Si es una tarea PICK, crea automáticamente una tarea PACK
     */
    public function complete(Request $request, int $id): JsonResponse
    {
        try {
            $tarea = \App\Models\Tarea::with('detalleTareas')->findOrFail($id);

            if ($tarea->estado === 'COMPLETADA') {
                return response()->json([
                    'success' => false,
                    'message' => 'La tarea ya está completada'
                ], 400);
            }

            $updateData = [
                'estado' => 'COMPLETADA',
                'fecha_fin' => now(),
                'fecha_finalizacion' => now(),
            ];

            // Si no tiene fecha_inicio, establecerla ahora
            if (!$tarea->fecha_inicio) {
                $updateData['fecha_inicio'] = now();
            }

            $tarea->update($updateData);

            $packingTaskId = null;

            // Si es una tarea PICK, crear automáticamente una tarea PACK
            if ($tarea->tipo_tarea === 'PICK' && $tarea->orden_id) {
                try {
                    // Generar número de tarea para packing
                    $ultimaTarea = \App\Models\Tarea::orderBy('id', 'desc')->first();
                    $numeroTarea = 'PACK-' . str_pad(($ultimaTarea ? $ultimaTarea->id + 1 : 1), 6, '0', STR_PAD_LEFT);
                    
                    $packingTask = \App\Models\Tarea::create([
                        'orden_id' => $tarea->orden_id,
                        'tipo_tarea' => 'PACK',
                        'estado' => 'CREADA',
                        'prioridad' => $tarea->prioridad ?? 5,
                        'asignada_a_usuario_id' => null, // Sin asignar - supervisor asignará
                        'fecha_creacion' => now(),
                        'numero_tarea' => $numeroTarea,
                        'descripcion' => 'Tarea de Packing generada automáticamente al completar Picking #' . $tarea->numero_tarea
                    ]);

                    // Cargar los detalles de picking con sus relaciones
                    $tarea->load(['detalleTareas.lote', 'detalleTareas.producto']);
                    
                    // Crear detalles de packing basados en los detalles de picking
                    foreach ($tarea->detalleTareas as $detallePick) {
                        \App\Models\DetalleTarea::create([
                            'tarea_id' => $packingTask->id,
                            'lote_id' => $detallePick->lote_id,
                            'cantidad_solicitada' => $detallePick->cantidad_solicitada,
                            'producto_id' => $detallePick->lote->producto_id ?? $detallePick->producto_id ?? null,
                            // Para packing, no necesitamos ubicaciones específicas
                        ]);
                    }
                    
                    \Illuminate\Support\Facades\Log::info("Detalles de packing creados: " . $tarea->detalleTareas->count() . " detalles");

                    $packingTaskId = $packingTask->id;

                    \Illuminate\Support\Facades\Log::info("Tarea de packing creada automáticamente: {$packingTask->id} desde picking: {$tarea->id}");
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Error al crear tarea de packing: " . $e->getMessage());
                    // No fallar la completación de picking si falla la creación de packing
                }
            }

            $response = [
                'success' => true,
                'message' => 'Tarea completada',
                'data' => $tarea->load(['detalleTareas', 'orden', 'usuarioAsignado'])
            ];

            // Incluir ID de tarea de packing si se creó
            if ($packingTaskId) {
                $response['packing_task_id'] = $packingTaskId;
                $response['message'] = 'Tarea completada - Tarea de packing creada automáticamente';
            }

            return response()->json($response, 200);

        } catch (\Exception $e) {
            Log::error('Error en complete: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al completar la tarea: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar una tarea a un operario
     * POST /api/tasks/{id}/assign
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'usuario_id' => 'required|integer|exists:Usuarios,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $tarea = \App\Models\Tarea::findOrFail($id);

            // Validar que la tarea esté en estado CREADA
            if ($tarea->estado !== 'CREADA') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden asignar tareas en estado CREADA'
                ], 400);
            }

            // Validar que el usuario sea un operario
            $usuario = \App\Models\Usuario::findOrFail($request->input('usuario_id'));
            $rolUsuario = $usuario->rol;
            $rolNombre = is_string($rolUsuario) ? $rolUsuario : ($rolUsuario->nombre ?? '');
            
            if (!str_contains(strtolower($rolNombre), 'operario')) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario debe ser un operario'
                ], 400);
            }

            // Asignar la tarea
            $tarea->asignada_a_usuario_id = $request->input('usuario_id');
            $tarea->estado = 'ASIGNADA';
            $tarea->save();

            return response()->json([
                'success' => true,
                'message' => 'Tarea asignada exitosamente',
                'data' => $tarea->load(['detalleTareas', 'orden', 'usuarioAsignado'])
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en assign: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar la tarea: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
