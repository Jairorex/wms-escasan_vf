<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use App\Models\Lote;
use App\Models\Ubicacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InventarioController extends Controller
{
    /**
     * Listar inventario con filtros
     */
    public function index(Request $request)
    {
        try {
            $query = Inventario::with(['lote.producto', 'ubicacion']);

            // Filtros
            if ($request->has('producto_id')) {
                $query->whereHas('lote', function($q) use ($request) {
                    $q->where('producto_id', $request->producto_id);
                });
            }

            if ($request->has('lote_id')) {
                $query->where('lote_id', $request->lote_id);
            }

            if ($request->has('ubicacion_id')) {
                $query->where('ubicacion_id', $request->ubicacion_id);
            }

            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('lote.producto', function($q) use ($search) {
                    $q->where('sku', 'like', "%{$search}%")
                      ->orWhere('nombre', 'like', "%{$search}%");
                })->orWhereHas('lote', function($q) use ($search) {
                    $q->where('lote_codigo', 'like', "%{$search}%");
                })->orWhereHas('ubicacion', function($q) use ($search) {
                    $q->where('codigo', 'like', "%{$search}%");
                });
            }

            $inventario = $query->orderBy('id', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $inventario
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener inventario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un registro de inventario específico
     */
    public function show($id)
    {
        try {
            $inventario = Inventario::with(['lote.producto', 'ubicacion'])->find($id);

            if (!$inventario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registro de inventario no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $inventario
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener inventario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo registro de inventario
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'lote_id' => 'required|exists:Lotes,id',
                'ubicacion_id' => 'required|exists:Ubicaciones,id',
                'cantidad' => 'required|numeric|min:0',
                'estado' => 'nullable|string|in:Disponible,Cuarentena,Dañado,Transito'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar si ya existe un registro para este lote y ubicación
            $existente = Inventario::where('lote_id', $request->lote_id)
                ->where('ubicacion_id', $request->ubicacion_id)
                ->first();

            if ($existente) {
                // Actualizar cantidad existente
                $existente->cantidad += $request->cantidad;
                $existente->estado = $request->estado ?? $existente->estado;
                $existente->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Inventario actualizado exitosamente',
                    'data' => $existente->load(['lote.producto', 'ubicacion'])
                ]);
            }

            // Crear nuevo registro
            $inventario = Inventario::create([
                'lote_id' => $request->lote_id,
                'ubicacion_id' => $request->ubicacion_id,
                'cantidad' => $request->cantidad,
                'estado' => $request->estado ?? 'Disponible'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inventario creado exitosamente',
                'data' => $inventario->load(['lote.producto', 'ubicacion'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear inventario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar registro de inventario
     */
    public function update(Request $request, $id)
    {
        try {
            $inventario = Inventario::find($id);

            if (!$inventario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registro de inventario no encontrado'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'cantidad' => 'sometimes|required|numeric|min:0',
                'estado' => 'sometimes|nullable|string|in:Disponible,Cuarentena,Dañado,Transito'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $inventario->update($request->only(['cantidad', 'estado']));

            return response()->json([
                'success' => true,
                'message' => 'Inventario actualizado exitosamente',
                'data' => $inventario->load(['lote.producto', 'ubicacion'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar inventario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar registro de inventario
     */
    public function destroy($id)
    {
        try {
            $inventario = Inventario::find($id);

            if (!$inventario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registro de inventario no encontrado'
                ], 404);
            }

            $inventario->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inventario eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar inventario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener stock total por producto
     */
    public function stockPorProducto($productoId)
    {
        try {
            $stock = DB::table('Inventario')
                ->join('Lotes', 'Inventario.lote_id', '=', 'Lotes.id')
                ->where('Lotes.producto_id', $productoId)
                ->where('Inventario.estado', 'Disponible')
                ->sum('Inventario.cantidad');

            return response()->json([
                'success' => true,
                'data' => [
                    'producto_id' => $productoId,
                    'stock_total' => $stock ?? 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener inventario por ubicación
     */
    public function porUbicacion($ubicacionId)
    {
        try {
            $inventario = Inventario::with(['lote.producto'])
                ->where('ubicacion_id', $ubicacionId)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $inventario
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener inventario por ubicación',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

