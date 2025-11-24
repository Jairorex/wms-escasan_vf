<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TipoUbicacion;
use App\Models\Clasificacion;
use App\Models\TipoProducto;
use App\Models\Lote;
use App\Models\Usuario;
use Illuminate\Http\Request;

class CatalogoController extends Controller
{
    /**
     * Obtener tipos de ubicación
     */
    public function getTiposUbicacion()
    {
        try {
            $tipos = TipoUbicacion::all();
            return response()->json([
                'success' => true,
                'data' => $tipos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tipos de ubicación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear tipo de ubicación
     */
    public function createTipoUbicacion(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:100|unique:Tipos_Ubicacion,nombre'
            ]);

            $tipo = TipoUbicacion::create([
                'nombre' => $request->nombre
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tipo de ubicación creado exitosamente',
                'data' => $tipo
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear tipo de ubicación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener clasificaciones
     */
    public function getClasificaciones()
    {
        try {
            $clasificaciones = Clasificacion::all();
            return response()->json([
                'success' => true,
                'data' => $clasificaciones
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener clasificaciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear clasificación
     */
    public function createClasificacion(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:100|unique:Clasificaciones,nombre'
            ]);

            $clasificacion = Clasificacion::create([
                'nombre' => $request->nombre
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Clasificación creada exitosamente',
                'data' => $clasificacion
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear clasificación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener tipos de producto
     */
    public function getTiposProducto()
    {
        try {
            $tipos = TipoProducto::all();
            return response()->json([
                'success' => true,
                'data' => $tipos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tipos de producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear tipo de producto
     */
    public function createTipoProducto(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:100|unique:Tipos_Producto,nombre'
            ]);

            $tipo = TipoProducto::create([
                'nombre' => $request->nombre
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tipo de producto creado exitosamente',
                'data' => $tipo
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear tipo de producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar lotes
     */
    public function getLotes(Request $request)
    {
        try {
            $query = Lote::with(['producto']);

            // Filtros opcionales
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('lote_codigo', 'like', "%{$search}%")
                      ->orWhereHas('producto', function($q) use ($search) {
                          $q->where('nombre', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                      });
                });
            }

            $lotes = $query->get();

            return response()->json([
                'success' => true,
                'data' => $lotes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener lotes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un lote por ID
     */
    public function getLote($id)
    {
        try {
            $lote = Lote::with(['producto'])->find($id);

            if (!$lote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lote no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $lote
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener lote: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar usuarios
     */
    public function getUsuarios(Request $request)
    {
        try {
            $query = Usuario::with('rol');

            // Filtros opcionales
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('usuario', 'like', "%{$search}%")
                      ->orWhere('nombre', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $usuarios = $query->get();

            return response()->json([
                'success' => true,
                'data' => $usuarios
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un usuario por ID
     */
    public function getUsuario($id)
    {
        try {
            $usuario = Usuario::with('rol')->find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $usuario
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuario: ' . $e->getMessage()
            ], 500);
        }
    }
}

