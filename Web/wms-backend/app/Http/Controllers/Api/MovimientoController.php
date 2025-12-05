<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MovimientoController extends Controller
{
    /**
     * Listar movimientos de inventario
     */
    public function index(Request $request)
    {
        $query = Movimiento::with(['producto', 'ubicacionOrigen', 'ubicacionDestino', 'lote', 'usuario']);

        // Filtros
        if ($request->has('producto_id')) {
            $query->where('producto_id', $request->producto_id);
        }

        if ($request->has('tipo_movimiento')) {
            $query->where('tipo_movimiento', $request->tipo_movimiento);
        }

        if ($request->has('fecha_inicio')) {
            $query->whereDate('fecha_movimiento', '>=', $request->fecha_inicio);
        }

        if ($request->has('fecha_fin')) {
            $query->whereDate('fecha_movimiento', '<=', $request->fecha_fin);
        }

        $movimientos = $query->orderBy('fecha_movimiento', 'desc')
            ->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $movimientos->items(),
            'meta' => [
                'total' => $movimientos->total(),
                'current_page' => $movimientos->currentPage(),
                'last_page' => $movimientos->lastPage(),
                'per_page' => $movimientos->perPage()
            ]
        ]);
    }

    /**
     * Crear un nuevo movimiento
     */
    public function store(Request $request)
    {
        $request->validate([
            'producto_id' => 'required|integer|exists:Productos,id',
            'tipo_movimiento' => 'required|string|in:ENTRADA,SALIDA,TRANSFERENCIA,AJUSTE',
            'cantidad' => 'required|integer|min:1',
            'ubicacion_origen_id' => 'nullable|integer|exists:Ubicaciones,id',
            'ubicacion_destino_id' => 'nullable|integer|exists:Ubicaciones,id',
            'lote_id' => 'nullable|integer|exists:Lotes,id',
            'motivo' => 'nullable|string|max:500',
            'referencia' => 'nullable|string|max:100'
        ]);

        $movimiento = Movimiento::create([
            'producto_id' => $request->producto_id,
            'tipo_movimiento' => $request->tipo_movimiento,
            'cantidad' => $request->cantidad,
            'ubicacion_origen_id' => $request->ubicacion_origen_id,
            'ubicacion_destino_id' => $request->ubicacion_destino_id,
            'lote_id' => $request->lote_id,
            'usuario_id' => Auth::id(),
            'fecha_movimiento' => now(),
            'motivo' => $request->motivo,
            'referencia' => $request->referencia
        ]);

        $movimiento->load(['producto', 'ubicacionOrigen', 'ubicacionDestino', 'lote', 'usuario']);

        return response()->json([
            'success' => true,
            'message' => 'Movimiento registrado correctamente',
            'data' => $movimiento
        ], 201);
    }

    /**
     * Mostrar un movimiento específico
     */
    public function show($id)
    {
        $movimiento = Movimiento::with(['producto', 'ubicacionOrigen', 'ubicacionDestino', 'lote', 'usuario'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $movimiento
        ]);
    }
}

