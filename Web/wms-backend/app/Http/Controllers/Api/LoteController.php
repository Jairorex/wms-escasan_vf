<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LoteController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Lote::with('producto');

            // Filtro de búsqueda
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('lote_codigo', 'like', "%{$search}%")
                      ->orWhereHas('producto', function($q) use ($search) {
                          $q->where('nombre', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                      });
                });
            }

            // Filtro por producto
            if ($request->has('producto_id')) {
                $query->where('producto_id', $request->producto_id);
            }

            $lotes = $query->orderBy('id', 'desc')->get();
            
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

    /**
     * Generar código de barras para un lote
     */
    public function generateBarcode($id)
    {
        try {
            $lote = Lote::with('producto')->find($id);
            
            if (!$lote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lote no encontrado'
                ], 404);
            }

            // El código de barras será basado en el código del lote
            $codigoBarras = $lote->lote_codigo;
            
            // Si el producto tiene SKU, podemos incluirlo
            if ($lote->producto && $lote->producto->sku) {
                $codigoBarras = $lote->producto->sku . '-' . $lote->lote_codigo;
            }

            // Actualizar el lote con el código de barras generado (si existe el campo)
            // $lote->codigo_barras = $codigoBarras;
            // $lote->save();

            return response()->json([
                'success' => true,
                'message' => 'Código de barras generado',
                'data' => [
                    'lote_id' => $lote->id,
                    'codigo_lote' => $lote->lote_codigo,
                    'codigo_barras' => $codigoBarras,
                    'producto' => $lote->producto?->nombre,
                    'sku' => $lote->producto?->sku,
                    'fecha_caducidad' => $lote->fecha_caducidad
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar código de barras',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}