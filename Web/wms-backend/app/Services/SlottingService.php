<?php

namespace App\Services;

use App\Models\Producto;
use App\Models\Ubicacion;
use Illuminate\Support\Facades\DB;

class SlottingService
{
    /**
     * Encuentra la ubicación óptima para almacenar un producto
     * 
     * @param Producto $producto
     * @param float $cantidad
     * @param float $pesoTotal
     * @return Ubicacion|null
     */
    public function findOptimalLocation(Producto $producto, float $cantidad, float $pesoTotal): ?Ubicacion
    {
        // Regla 1: Compatibilidad - Tipo_Producto debe coincidir con Tipo_Ubicacion
        $tipoProductoNombre = $producto->tipoProducto ? $producto->tipoProducto->nombre : null;
        
        if (!$tipoProductoNombre) {
            return null;
        }

        $ubicacionesCompatibles = Ubicacion::whereHas('tipoUbicacion', function ($query) use ($tipoProductoNombre) {
            $query->where('nombre', $tipoProductoNombre);
        })->get();

        if ($ubicacionesCompatibles->isEmpty()) {
            return null;
        }

        // Regla 2: Capacidad - Filtrar ubicaciones con espacio disponible
        $ubicacionesConEspacio = $ubicacionesCompatibles->filter(function ($ubicacion) use ($cantidad, $pesoTotal) {
            // Calcular cantidad y peso actual de la ubicación
            $cantidadActual = $ubicacion->inventarios()->sum('cantidad');
            $pesoActual = $ubicacion->inventarios()
                ->with('lote.producto')
                ->get()
                ->sum(function ($inv) {
                    return $inv->cantidad * ($inv->lote->producto->peso ?? 0);
                });

            $tieneEspacioCantidad = $ubicacion->max_cantidad && (($cantidadActual + $cantidad) <= $ubicacion->max_cantidad);
            $tieneEspacioPeso = $ubicacion->max_peso && (($pesoActual + $pesoTotal) <= $ubicacion->max_peso);
            
            return $tieneEspacioCantidad && $tieneEspacioPeso;
        });

        if ($ubicacionesConEspacio->isEmpty()) {
            // Regla 3: Overflow - No hay espacio, retornar null para sugerir ubicación de desborde
            return null;
        }

        // Priorizar ubicaciones que ya tengan lotes del mismo producto (agrupar)
        $ubicacionOptima = $ubicacionesConEspacio->sortByDesc(function ($ubicacion) use ($producto) {
            // Contar cuántos inventarios de este producto hay en esta ubicación
            return $ubicacion->inventarios()
                ->whereHas('lote', function ($query) use ($producto) {
                    $query->where('producto_id', $producto->id);
                })
                ->sum('cantidad');
        })->first();

        return $ubicacionOptima;
    }

    /**
     * Busca ubicación de desborde (overflow) cuando no hay espacio en ubicaciones normales
     * 
     * @param Producto $producto
     * @return Ubicacion|null
     */
    public function findOverflowLocation(Producto $producto): ?Ubicacion
    {
        $tipoProductoNombre = $producto->tipoProducto ? $producto->tipoProducto->nombre : null;
        
        // Buscar ubicaciones de tipo "Overflow" o "Desborde"
        $ubicacionOverflow = Ubicacion::whereHas('tipoUbicacion', function ($query) use ($tipoProductoNombre) {
            if ($tipoProductoNombre) {
                $query->where('nombre', $tipoProductoNombre);
            }
            $query->orWhere('nombre', 'LIKE', '%Overflow%')
                  ->orWhere('nombre', 'LIKE', '%Desborde%');
        })
        ->where('zona', 'LIKE', '%OVERFLOW%')
        ->first();

        return $ubicacionOverflow;
    }

    /**
     * Valida si una ubicación puede recibir el producto
     * 
     * @param Ubicacion $ubicacion
     * @param Producto $producto
     * @param float $cantidad
     * @param float $pesoTotal
     * @return array ['valid' => bool, 'message' => string]
     */
    public function validateLocation(Ubicacion $ubicacion, Producto $producto, float $cantidad, float $pesoTotal): array
    {
        $tipoProductoNombre = $producto->tipoProducto ? $producto->tipoProducto->nombre : null;
        $tipoUbicacionNombre = $ubicacion->tipoUbicacion ? $ubicacion->tipoUbicacion->nombre : null;
        
        // Validar compatibilidad de tipo SOLO si ambos tienen tipo definido
        if ($tipoProductoNombre && $tipoUbicacionNombre && $tipoUbicacionNombre !== $tipoProductoNombre) {
            return [
                'valid' => false,
                'message' => "El tipo de ubicación ({$tipoUbicacionNombre}) no es compatible con el tipo de producto ({$tipoProductoNombre})"
            ];
        }
        
        // Si alguno no tiene tipo definido, permitir pero advertir
        if (!$tipoProductoNombre || !$tipoUbicacionNombre) {
            // Continuamos la validación pero es compatible en cuanto a tipos
        }

        // Calcular cantidad y peso actual
        $cantidadActual = $ubicacion->inventarios()->sum('cantidad');
        $pesoActual = $ubicacion->inventarios()
            ->with('lote.producto')
            ->get()
            ->sum(function ($inv) {
                return $inv->cantidad * ($inv->lote->producto->peso ?? 0);
            });

        // Validar capacidad de cantidad
        if ($ubicacion->max_cantidad && (($cantidadActual + $cantidad) > $ubicacion->max_cantidad)) {
            return [
                'valid' => false,
                'message' => "La ubicación no tiene suficiente capacidad. Disponible: " . ($ubicacion->max_cantidad - $cantidadActual) . ", Requerido: {$cantidad}"
            ];
        }

        // Validar capacidad de peso
        if ($ubicacion->max_peso && (($pesoActual + $pesoTotal) > $ubicacion->max_peso)) {
            return [
                'valid' => false,
                'message' => "La ubicación no tiene suficiente capacidad de peso. Disponible: " . ($ubicacion->max_peso - $pesoActual) . ", Requerido: {$pesoTotal}"
            ];
        }

        return [
            'valid' => true,
            'message' => 'Ubicación válida'
        ];
    }
}

