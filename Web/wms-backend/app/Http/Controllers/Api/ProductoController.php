<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductoController extends Controller
{
    /**
     * Listar productos
     */
    public function index(Request $request)
    {
        try {
            $query = Producto::with(['clasificacion', 'tipoProducto']);

            // Filtros opcionales
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('sku', 'like', "%{$search}%")
                      ->orWhere('nombre', 'like', "%{$search}%");
                });
            }

            // Filtro por requiere_temperatura
            if ($request->has('requiere_temperatura')) {
                $query->where('requiere_temperatura', $request->boolean('requiere_temperatura'));
            }

            $productos = $query->get();

            return response()->json([
                'success' => true,
                'data' => $productos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener productos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un producto por ID
     */
    public function show($id)
    {
        try {
            $producto = Producto::with(['clasificacion', 'tipoProducto'])->find($id);

            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Producto no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $producto
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo producto
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'sku' => 'required|string|unique:Productos,sku',
                'nombre' => 'required|string|max:255',
                'descripcion' => 'nullable|string',
                'peso' => 'nullable|numeric|min:0',
                'volumen' => 'nullable|numeric|min:0',
                'clasificacion_id' => 'nullable|exists:Clasificaciones,id',
                'tipo_producto_id' => 'nullable|exists:Tipos_Producto,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $producto = Producto::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Producto creado exitosamente',
                'data' => $producto->load(['clasificacion', 'tipoProducto'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un producto
     */
    public function update(Request $request, $id)
    {
        try {
            $producto = Producto::find($id);

            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Producto no encontrado'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'sku' => 'sometimes|required|string|unique:Productos,sku,' . $id,
                'nombre' => 'sometimes|required|string|max:255',
                'descripcion' => 'nullable|string',
                'peso' => 'nullable|numeric|min:0',
                'volumen' => 'nullable|numeric|min:0',
                'clasificacion_id' => 'nullable|exists:Clasificaciones,id',
                'tipo_producto_id' => 'nullable|exists:Tipos_Producto,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $producto->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Producto actualizado exitosamente',
                'data' => $producto->load(['clasificacion', 'tipoProducto'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un producto
     */
    public function destroy($id)
    {
        try {
            $producto = Producto::find($id);

            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'message' => 'Producto no encontrado'
                ], 404);
            }

            $producto->delete();

            return response()->json([
                'success' => true,
                'message' => 'Producto eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar producto: ' . $e->getMessage()
            ], 500);
        }
    }
}

