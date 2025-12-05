<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subbodega;
use App\Models\Ubicacion;
use App\Models\Producto;
use App\Services\TemperaturaService;
use App\Services\SubbodegaAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubbodegaController extends Controller
{
    protected TemperaturaService $temperaturaService;
    protected SubbodegaAssignmentService $assignmentService;

    public function __construct(
        TemperaturaService $temperaturaService,
        SubbodegaAssignmentService $assignmentService
    ) {
        $this->temperaturaService = $temperaturaService;
        $this->assignmentService = $assignmentService;
    }

    /**
     * Listar todas las subbodegas
     */
    public function index(Request $request): JsonResponse
    {
        $query = Subbodega::query();

        // Filtros
        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('activa')) {
            $query->where('activa', $request->boolean('activa'));
        }

        if ($request->has('requiere_temperatura')) {
            $query->where('requiere_temperatura', $request->boolean('requiere_temperatura'));
        }

        $subbodegas = $query->withCount('ubicaciones')->get();

        // Agregar información adicional
        $subbodegas->transform(function ($subbodega) {
            $subbodega->stock_total = $subbodega->getStockTotal();
            $subbodega->necesita_reabastecimiento = $subbodega->necesitaReabastecimiento();
            return $subbodega;
        });

        return response()->json([
            'success' => true,
            'data' => $subbodegas
        ]);
    }

    /**
     * Obtener una subbodega específica
     */
    public function show(int $id): JsonResponse
    {
        $subbodega = Subbodega::with(['ubicaciones', 'recepciones' => function ($q) {
            $q->orderBy('fecha_recepcion', 'desc')->limit(10);
        }])->find($id);

        if (!$subbodega) {
            return response()->json([
                'success' => false,
                'message' => 'Subbodega no encontrada'
            ], 404);
        }

        // Agregar estadísticas
        $subbodega->stock_total = $subbodega->getStockTotal();
        $subbodega->necesita_reabastecimiento = $subbodega->necesitaReabastecimiento();

        // Si es cadena fría, agregar historial de temperatura
        if ($subbodega->requiereControlTemperatura()) {
            $historial = $this->temperaturaService->getHistorialTemperaturas($subbodega);
            $subbodega->historial_temperatura = $historial['estadisticas'];
        }

        return response()->json([
            'success' => true,
            'data' => $subbodega
        ]);
    }

    /**
     * Crear nueva subbodega
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'codigo' => 'required|string|max:20|unique:Subbodegas,codigo',
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string|max:255',
            'tipo' => 'required|in:PICKING,RESGUARDO,CADENA_FRIA,QUIMICOS,ALTO_VALOR,CUARENTENA,DESTRUCCION,IMPORTACION',
            'temperatura_min' => 'nullable|numeric',
            'temperatura_max' => 'nullable|numeric|gte:temperatura_min',
            'stock_minimo' => 'nullable|integer|min:0',
            'requiere_temperatura' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        
        // Si es CADENA_FRIA, requiere temperatura automáticamente
        if ($data['tipo'] === 'CADENA_FRIA') {
            $data['requiere_temperatura'] = true;
        }

        $subbodega = Subbodega::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Subbodega creada exitosamente',
            'data' => $subbodega
        ], 201);
    }

    /**
     * Actualizar subbodega
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $subbodega = Subbodega::find($id);

        if (!$subbodega) {
            return response()->json([
                'success' => false,
                'message' => 'Subbodega no encontrada'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'codigo' => 'sometimes|string|max:20|unique:Subbodegas,codigo,' . $id,
            'nombre' => 'sometimes|string|max:100',
            'descripcion' => 'nullable|string|max:255',
            'tipo' => 'sometimes|in:PICKING,RESGUARDO,CADENA_FRIA,QUIMICOS,ALTO_VALOR,CUARENTENA,DESTRUCCION,IMPORTACION',
            'temperatura_min' => 'nullable|numeric',
            'temperatura_max' => 'nullable|numeric',
            'stock_minimo' => 'nullable|integer|min:0',
            'requiere_temperatura' => 'nullable|boolean',
            'activa' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $subbodega->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Subbodega actualizada exitosamente',
            'data' => $subbodega
        ]);
    }

    /**
     * Eliminar subbodega (soft delete - desactivar)
     */
    public function destroy(int $id): JsonResponse
    {
        $subbodega = Subbodega::find($id);

        if (!$subbodega) {
            return response()->json([
                'success' => false,
                'message' => 'Subbodega no encontrada'
            ], 404);
        }

        // Verificar si tiene ubicaciones con inventario
        $tieneInventario = $subbodega->ubicaciones()
            ->whereHas('inventarios')
            ->exists();

        if ($tieneInventario) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la subbodega porque tiene inventario asignado'
            ], 400);
        }

        // Soft delete - desactivar
        $subbodega->update(['activa' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Subbodega desactivada exitosamente'
        ]);
    }

    /**
     * Obtener ubicaciones de una subbodega
     */
    public function ubicaciones(int $id): JsonResponse
    {
        $subbodega = Subbodega::find($id);

        if (!$subbodega) {
            return response()->json([
                'success' => false,
                'message' => 'Subbodega no encontrada'
            ], 404);
        }

        $ubicaciones = $subbodega->ubicaciones()
            ->with(['inventarios.lote.producto'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ubicaciones
        ]);
    }

    /**
     * Asignar ubicación a subbodega
     */
    public function asignarUbicacion(Request $request, int $id): JsonResponse
    {
        $subbodega = Subbodega::find($id);

        if (!$subbodega) {
            return response()->json([
                'success' => false,
                'message' => 'Subbodega no encontrada'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'ubicacion_id' => 'required|integer|exists:Ubicaciones,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $ubicacion = Ubicacion::find($request->ubicacion_id);
        $ubicacion->update([
            'subbodega_id' => $subbodega->id,
            'tiene_control_temperatura' => $subbodega->requiereControlTemperatura()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ubicación asignada exitosamente',
            'data' => $ubicacion
        ]);
    }

    /**
     * Registrar temperatura en subbodega
     */
    public function registrarTemperatura(Request $request, int $id): JsonResponse
    {
        $subbodega = Subbodega::find($id);

        if (!$subbodega) {
            return response()->json([
                'success' => false,
                'message' => 'Subbodega no encontrada'
            ], 404);
        }

        if (!$subbodega->requiereControlTemperatura()) {
            return response()->json([
                'success' => false,
                'message' => 'Esta subbodega no requiere control de temperatura'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'temperatura' => 'required|numeric',
            'humedad' => 'nullable|numeric|min:0|max:100',
            'observaciones' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $lectura = $this->temperaturaService->registrarLecturaSubbodega(
            $subbodega,
            $request->temperatura,
            $request->humedad,
            $request->user()?->id
        );

        // Validar temperatura
        $validacion = $subbodega->validarTemperatura($request->temperatura);

        return response()->json([
            'success' => true,
            'message' => $validacion['mensaje'],
            'data' => [
                'lectura' => $lectura,
                'dentro_rango' => $validacion['valido'],
                'alerta_generada' => !$lectura->dentro_rango
            ]
        ], $validacion['valido'] ? 200 : 201);
    }

    /**
     * Obtener tipos de subbodega disponibles
     */
    public function tipos(): JsonResponse
    {
        $tipos = [
            ['codigo' => 'PICKING', 'nombre' => 'Picking', 'descripcion' => 'Área de preparación de pedidos'],
            ['codigo' => 'RESGUARDO', 'nombre' => 'Resguardo', 'descripcion' => 'Almacenamiento principal'],
            ['codigo' => 'CADENA_FRIA', 'nombre' => 'Cadena Fría', 'descripcion' => 'Productos refrigerados'],
            ['codigo' => 'QUIMICOS', 'nombre' => 'Químicos', 'descripcion' => 'Productos químicos controlados'],
            ['codigo' => 'ALTO_VALOR', 'nombre' => 'Alto Valor', 'descripcion' => 'Productos de alto valor'],
            ['codigo' => 'CUARENTENA', 'nombre' => 'Cuarentena', 'descripcion' => 'Productos en observación'],
            ['codigo' => 'DESTRUCCION', 'nombre' => 'Destrucción', 'descripcion' => 'Productos para destrucción'],
            ['codigo' => 'IMPORTACION', 'nombre' => 'Importación', 'descripcion' => 'Productos importados']
        ];

        return response()->json([
            'success' => true,
            'data' => $tipos
        ]);
    }

    /**
     * Obtener subbodega sugerida para un producto
     * GET /api/subbodegas/sugerida/{productoId}
     */
    public function sugerida(int $productoId): JsonResponse
    {
        try {
            $producto = Producto::with('categoriaRiesgo')->findOrFail($productoId);
            
            $subbodegaOptima = $this->assignmentService->findOptimalSubbodega($producto);
            $subbodegasCompatibles = $this->assignmentService->getCompatibleSubbodegas($producto);

            return response()->json([
                'success' => true,
                'data' => [
                    'subbodega_optima' => $subbodegaOptima,
                    'subbodegas_compatibles' => $subbodegasCompatibles
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener subbodega sugerida: ' . $e->getMessage()
            ], 500);
        }
    }
}

