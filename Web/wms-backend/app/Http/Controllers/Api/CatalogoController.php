<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TipoUbicacion;
use App\Models\Clasificacion;
use App\Models\TipoProducto;
use App\Models\Lote;
use App\Models\Usuario;
use App\Models\CategoriaRiesgo;
use App\Models\ReglaCompatibilidad;
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

    // ============================================
    // CATEGORÍAS DE RIESGO
    // ============================================

    /**
     * Obtener categorías de riesgo
     */
    public function getCategoriasRiesgo()
    {
        try {
            $categorias = CategoriaRiesgo::activas()->get();
            return response()->json([
                'success' => true,
                'data' => $categorias
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener categorías de riesgo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear categoría de riesgo
     */
    public function createCategoriaRiesgo(Request $request)
    {
        try {
            $request->validate([
                'codigo' => 'required|string|max:20|unique:Categorias_Riesgo,codigo',
                'nombre' => 'required|string|max:100',
                'descripcion' => 'nullable|string|max:255',
                'nivel_riesgo' => 'required|in:BAJO,MEDIO,ALTO,CRITICO',
                'requiere_certificacion' => 'nullable|boolean',
                'requiere_temperatura' => 'nullable|boolean'
            ]);

            $categoria = CategoriaRiesgo::create([
                'codigo' => $request->codigo,
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'nivel_riesgo' => $request->nivel_riesgo,
                'requiere_certificacion' => $request->requiere_certificacion ?? false,
                'requiere_temperatura' => $request->requiere_temperatura ?? false,
                'activa' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Categoría de riesgo creada exitosamente',
                'data' => $categoria
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
                'message' => 'Error al crear categoría de riesgo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar categoría de riesgo
     */
    public function updateCategoriaRiesgo(Request $request, $id)
    {
        try {
            $categoria = CategoriaRiesgo::find($id);

            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría de riesgo no encontrada'
                ], 404);
            }

            $request->validate([
                'codigo' => 'sometimes|string|max:20|unique:Categorias_Riesgo,codigo,' . $id,
                'nombre' => 'sometimes|string|max:100',
                'descripcion' => 'nullable|string|max:255',
                'nivel_riesgo' => 'sometimes|in:BAJO,MEDIO,ALTO,CRITICO',
                'requiere_certificacion' => 'nullable|boolean',
                'requiere_temperatura' => 'nullable|boolean',
                'activa' => 'nullable|boolean'
            ]);

            $categoria->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Categoría de riesgo actualizada exitosamente',
                'data' => $categoria
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar categoría de riesgo: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // REGLAS DE COMPATIBILIDAD
    // ============================================

    /**
     * Obtener reglas de compatibilidad
     */
    public function getReglasCompatibilidad(Request $request)
    {
        try {
            $query = ReglaCompatibilidad::with('categoriaRiesgo')->activas();

            if ($request->has('categoria_riesgo_id')) {
                $query->where('categoria_riesgo_id', $request->categoria_riesgo_id);
            }

            if ($request->has('tipo_subbodega')) {
                $query->where('tipo_subbodega', $request->tipo_subbodega);
            }

            $reglas = $query->get();

            return response()->json([
                'success' => true,
                'data' => $reglas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener reglas de compatibilidad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear regla de compatibilidad
     */
    public function createReglaCompatibilidad(Request $request)
    {
        try {
            $request->validate([
                'categoria_riesgo_id' => 'required|integer|exists:Categorias_Riesgo,id',
                'tipo_subbodega' => 'required|string|in:PICKING,RESGUARDO,CADENA_FRIA,QUIMICOS,ALTO_VALOR,CUARENTENA,DESTRUCCION,IMPORTACION',
                'permitido' => 'required|boolean',
                'motivo_restriccion' => 'nullable|string|max:255'
            ]);

            // Verificar si ya existe la combinación
            $existente = ReglaCompatibilidad::where('categoria_riesgo_id', $request->categoria_riesgo_id)
                ->where('tipo_subbodega', $request->tipo_subbodega)
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe una regla para esta combinación de categoría y tipo de subbodega'
                ], 400);
            }

            $regla = ReglaCompatibilidad::create([
                'categoria_riesgo_id' => $request->categoria_riesgo_id,
                'tipo_subbodega' => $request->tipo_subbodega,
                'permitido' => $request->permitido,
                'motivo_restriccion' => $request->motivo_restriccion,
                'activa' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Regla de compatibilidad creada exitosamente',
                'data' => $regla->load('categoriaRiesgo')
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
                'message' => 'Error al crear regla de compatibilidad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar regla de compatibilidad
     */
    public function updateReglaCompatibilidad(Request $request, $id)
    {
        try {
            $regla = ReglaCompatibilidad::find($id);

            if (!$regla) {
                return response()->json([
                    'success' => false,
                    'message' => 'Regla de compatibilidad no encontrada'
                ], 404);
            }

            $request->validate([
                'permitido' => 'sometimes|boolean',
                'motivo_restriccion' => 'nullable|string|max:255',
                'activa' => 'nullable|boolean'
            ]);

            $regla->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Regla de compatibilidad actualizada exitosamente',
                'data' => $regla->load('categoriaRiesgo')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar regla de compatibilidad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar regla de compatibilidad
     */
    public function deleteReglaCompatibilidad($id)
    {
        try {
            $regla = ReglaCompatibilidad::find($id);

            if (!$regla) {
                return response()->json([
                    'success' => false,
                    'message' => 'Regla de compatibilidad no encontrada'
                ], 404);
            }

            $regla->update(['activa' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Regla de compatibilidad desactivada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar regla de compatibilidad: ' . $e->getMessage()
            ], 500);
        }
    }
}

