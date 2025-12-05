<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ubicacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UbicacionController extends Controller
{
    /**
     * Listar ubicaciones
     */
    public function index(Request $request)
    {
        try {
            $query = Ubicacion::with(['tipoUbicacion', 'subbodega']);

            // Filtros opcionales
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('codigo', 'like', "%{$search}%")
                      ->orWhere('pasillo', 'like', "%{$search}%")
                      ->orWhere('estante', 'like', "%{$search}%");
                });
            }

            // Filtrar por subbodega
            if ($request->has('subbodega_id') && $request->subbodega_id) {
                $query->where('subbodega_id', $request->subbodega_id);
            }

            $ubicaciones = $query->get();

            return response()->json([
                'success' => true,
                'data' => $ubicaciones
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ubicaciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una ubicación por ID
     */
    public function show($id)
    {
        try {
            $ubicacion = Ubicacion::with('tipoUbicacion')->find($id);

            if (!$ubicacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ubicación no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $ubicacion
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ubicación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear una nueva ubicación
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'codigo' => 'required|string|unique:Ubicaciones,codigo',
                'pasillo' => 'nullable|string',
                'estante' => 'nullable|string',
                'nivel' => 'nullable|string',
                'tipo_ubicacion_id' => 'nullable|exists:Tipos_Ubicacion,id',
                'subbodega_id' => 'nullable|exists:Subbodegas,id',
                'max_peso' => 'nullable|numeric|min:0',
                'max_cantidad' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $ubicacion = Ubicacion::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Ubicación creada exitosamente',
                'data' => $ubicacion->load(['tipoUbicacion', 'subbodega'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear ubicación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar una ubicación
     */
    public function update(Request $request, $id)
    {
        try {
            $ubicacion = Ubicacion::find($id);

            if (!$ubicacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ubicación no encontrada'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'codigo' => 'sometimes|required|string|unique:Ubicaciones,codigo,' . $id,
                'pasillo' => 'nullable|string',
                'estante' => 'nullable|string',
                'nivel' => 'nullable|string',
                'tipo_ubicacion_id' => 'nullable|exists:Tipos_Ubicacion,id',
                'subbodega_id' => 'nullable|exists:Subbodegas,id',
                'max_peso' => 'nullable|numeric|min:0',
                'max_cantidad' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $ubicacion->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Ubicación actualizada exitosamente',
                'data' => $ubicacion->load('tipoUbicacion')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar ubicación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar una ubicación
     */
    public function destroy($id)
    {
        try {
            $ubicacion = Ubicacion::find($id);

            if (!$ubicacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ubicación no encontrada'
                ], 404);
            }

            $ubicacion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Ubicación eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar ubicación: ' . $e->getMessage()
            ], 500);
        }
    }
}

