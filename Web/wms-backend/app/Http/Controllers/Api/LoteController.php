<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LoteController extends Controller
{
    public function index()
    {
        try {
            // Traemos los lotes con su producto relacionado para mostrar el nombre en la tabla
            $lotes = Lote::with('producto')->orderBy('id', 'desc')->get();
            return response()->json([
                'success' => true,
                'data' => $lotes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener lotes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'lote_codigo' => 'required|string|max:50|unique:Lotes,lote_codigo',
                'producto_id' => 'required|exists:Productos,id',
                'cantidad_original' => 'required|numeric|min:0',
                'fecha_fabricacion' => 'nullable|date',
                'fecha_caducidad' => 'nullable|date|after_or_equal:fecha_fabricacion',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $lote = Lote::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Lote creado exitosamente',
                'data' => $lote
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear lote',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $lote = Lote::find($id);

            if (!$lote) {
                return response()->json(['message' => 'Lote no encontrado'], 404);
            }

            $validator = Validator::make($request->all(), [
                'lote_codigo' => 'required|string|max:50|unique:Lotes,lote_codigo,' . $id,
                'producto_id' => 'required|exists:Productos,id',
                'cantidad_original' => 'required|numeric|min:0',
                'fecha_fabricacion' => 'nullable|date',
                'fecha_caducidad' => 'nullable|date|after_or_equal:fecha_fabricacion',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $lote->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Lote actualizado exitosamente',
                'data' => $lote
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar lote',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function destroy($id)
    {
        try {
            $lote = Lote::find($id);
            if (!$lote) return response()->json(['message' => 'Lote no encontrado'], 404);
            
            $lote->delete();
            return response()->json(['success' => true, 'message' => 'Lote eliminado'], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al eliminar'], 500);
        }
    }
}