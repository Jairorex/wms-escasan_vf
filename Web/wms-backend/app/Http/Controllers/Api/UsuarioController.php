<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UsuarioController extends Controller
{
    /**
     * Listar todos los usuarios
     * GET /api/usuarios
     */
    public function index(Request $request)
    {
        try {
            $query = Usuario::with(['rol', 'supervisor']);

            // Filtros opcionales
            if ($request->has('rol_id')) {
                $query->where('rol_id', $request->rol_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                      ->orWhere('usuario', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $usuarios = $query->orderBy('nombre')->get();

            return response()->json([
                'success' => true,
                'data' => $usuarios,
                'count' => $usuarios->count(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener un usuario específico
     * GET /api/usuarios/{id}
     */
    public function show($id)
    {
        try {
            $usuario = Usuario::with('rol')->find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $usuario,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear un nuevo usuario
     * POST /api/usuarios
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:255',
                'usuario' => 'required|string|max:50|unique:Usuarios,usuario',
                'email' => 'required|email|max:255|unique:Usuarios,email',
                'password' => 'required|string|min:6',
                'rol_id' => 'required|exists:Roles,id',
                'supervisor_id' => 'nullable|exists:Usuarios,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            DB::beginTransaction();

            $usuario = Usuario::create([
                'nombre' => $request->nombre,
                'usuario' => $request->usuario,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'rol_id' => $request->rol_id,
                'supervisor_id' => $request->supervisor_id,
            ]);

            $usuario->load(['rol', 'supervisor']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => $usuario,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar un usuario
     * PUT /api/usuarios/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $usuario = Usuario::find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre' => 'sometimes|required|string|max:255',
                'usuario' => 'sometimes|required|string|max:50|unique:Usuarios,usuario,' . $id,
                'email' => 'sometimes|required|email|max:255|unique:Usuarios,email,' . $id,
                'password' => 'sometimes|string|min:6',
                'rol_id' => 'sometimes|required|exists:Roles,id',
                'supervisor_id' => 'nullable|exists:Usuarios,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            DB::beginTransaction();

            $data = $request->only(['nombre', 'usuario', 'email', 'rol_id', 'supervisor_id']);

            if ($request->has('password')) {
                $data['password'] = Hash::make($request->password);
            }

            // Si el rol cambia y no es operario, limpiar supervisor_id
            if ($request->has('rol_id')) {
                $rol = \App\Models\Rol::find($request->rol_id);
                if ($rol && strtolower($rol->nombre) !== 'operario') {
                    $data['supervisor_id'] = null;
                }
            }

            $usuario->update($data);
            $usuario->load(['rol', 'supervisor']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente',
                'data' => $usuario,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un usuario
     * DELETE /api/usuarios/{id}
     */
    public function destroy($id)
    {
        try {
            $usuario = Usuario::find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado',
                ], 404);
            }

            // Verificar si el usuario tiene tareas o movimientos asignados
            $tieneTareas = $usuario->tareas()->count() > 0;
            $tieneMovimientos = $usuario->movimientos()->count() > 0;

            if ($tieneTareas || $tieneMovimientos) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el usuario porque tiene tareas o movimientos asociados',
                ], 400);
            }

            DB::beginTransaction();
            $usuario->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Usuario eliminado exitosamente',
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resetear contraseña de usuario
     * POST /api/usuarios/{id}/reset-password
     */
    public function resetPassword(Request $request, $id)
    {
        try {
            $usuario = Usuario::find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'new_password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $usuario->password = Hash::make($request->new_password);
            $usuario->save();

            return response()->json([
                'success' => true,
                'message' => 'Contraseña reseteada exitosamente',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al resetear contraseña',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

