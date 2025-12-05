<?php

namespace App\Services;

use App\Models\Producto;
use App\Models\Subbodega;
use App\Models\Ubicacion;
use App\Models\ReglaCompatibilidad;
use App\Models\Alerta;
use Illuminate\Support\Facades\Log;

class CompatibilidadService
{
    /**
     * Verificar si un producto puede almacenarse en una subbodega
     */
    public function verificarCompatibilidadProductoSubbodega(
        Producto $producto, 
        Subbodega $subbodega
    ): array {
        // Si el producto no tiene categoría de riesgo, permitir
        if (!$producto->categoria_riesgo_id) {
            return [
                'compatible' => true,
                'mensaje' => 'Producto sin categoría de riesgo asignada - permitido por defecto',
                'advertencias' => ['Se recomienda asignar una categoría de riesgo al producto']
            ];
        }

        // Verificar regla de compatibilidad
        $regla = ReglaCompatibilidad::where('categoria_riesgo_id', $producto->categoria_riesgo_id)
            ->where('tipo_subbodega', $subbodega->tipo)
            ->where('activa', true)
            ->first();

        if (!$regla) {
            // Sin regla definida - permitir con advertencia
            return [
                'compatible' => true,
                'mensaje' => 'Sin regla de compatibilidad definida - permitido por defecto',
                'advertencias' => ['No existe regla de compatibilidad para esta combinación']
            ];
        }

        if (!$regla->permitido) {
            // No compatible - crear alerta
            $this->crearAlertaIncompatibilidad($producto, $subbodega, $regla->motivo_restriccion);
            
            return [
                'compatible' => false,
                'mensaje' => $regla->motivo_restriccion ?? 'Almacenamiento no permitido por reglas de compatibilidad',
                'advertencias' => []
            ];
        }

        return [
            'compatible' => true,
            'mensaje' => 'Producto compatible con la subbodega',
            'advertencias' => []
        ];
    }

    /**
     * Verificar si un producto puede almacenarse en una ubicación específica
     */
    public function verificarCompatibilidadProductoUbicacion(
        Producto $producto, 
        Ubicacion $ubicacion
    ): array {
        // Si la ubicación no tiene subbodega, permitir
        if (!$ubicacion->subbodega_id) {
            return [
                'compatible' => true,
                'mensaje' => 'Ubicación sin subbodega asignada - permitido por defecto',
                'advertencias' => ['Se recomienda asignar una subbodega a la ubicación']
            ];
        }

        $subbodega = $ubicacion->subbodega;
        
        // Verificar compatibilidad con subbodega
        $resultado = $this->verificarCompatibilidadProductoSubbodega($producto, $subbodega);
        
        // Verificar también requerimientos de temperatura
        if ($producto->requiereControlTemperatura() && !$subbodega->requiereControlTemperatura()) {
            $resultado['compatible'] = false;
            $resultado['mensaje'] = 'El producto requiere control de temperatura pero la subbodega no lo tiene';
            $resultado['advertencias'][] = 'Buscar ubicación en subbodega con cadena de frío';
        }

        return $resultado;
    }

    /**
     * Encontrar subbodegas compatibles para un producto
     */
    public function encontrarSubbodegasCompatibles(Producto $producto): array
    {
        $subbodegasCompatibles = [];
        $subbodegas = Subbodega::activas()->get();

        foreach ($subbodegas as $subbodega) {
            $resultado = $this->verificarCompatibilidadProductoSubbodega($producto, $subbodega);
            
            if ($resultado['compatible']) {
                // Verificar también temperatura si es necesario
                if ($producto->requiereControlTemperatura()) {
                    if ($subbodega->requiereControlTemperatura()) {
                        $subbodegasCompatibles[] = [
                            'subbodega' => $subbodega,
                            'score' => 100, // Mejor opción
                            'mensaje' => 'Compatible con control de temperatura'
                        ];
                    }
                } else {
                    $subbodegasCompatibles[] = [
                        'subbodega' => $subbodega,
                        'score' => $subbodega->tipo === Subbodega::TIPO_RESGUARDO ? 80 : 60,
                        'mensaje' => $resultado['mensaje']
                    ];
                }
            }
        }

        // Ordenar por score
        usort($subbodegasCompatibles, fn($a, $b) => $b['score'] <=> $a['score']);

        return $subbodegasCompatibles;
    }

    /**
     * Encontrar ubicación óptima para un producto
     */
    public function encontrarUbicacionOptima(
        Producto $producto, 
        float $cantidad,
        ?int $subbodegaPreferida = null
    ): ?Ubicacion {
        $query = Ubicacion::disponibles()
            ->with('subbodega')
            ->whereNotNull('subbodega_id');

        if ($subbodegaPreferida) {
            $query->where('subbodega_id', $subbodegaPreferida);
        }

        $ubicaciones = $query->get();

        foreach ($ubicaciones as $ubicacion) {
            $resultado = $this->verificarCompatibilidadProductoUbicacion($producto, $ubicacion);
            
            if ($resultado['compatible']) {
                // Verificar capacidad
                $capacidadDisponible = $this->calcularCapacidadDisponible($ubicacion);
                
                if ($capacidadDisponible >= $cantidad) {
                    return $ubicacion;
                }
            }
        }

        return null;
    }

    /**
     * Calcular capacidad disponible en una ubicación
     */
    protected function calcularCapacidadDisponible(Ubicacion $ubicacion): float
    {
        $cantidadActual = $ubicacion->inventarios()->sum('cantidad');
        $maxCantidad = $ubicacion->max_cantidad ?? PHP_INT_MAX;
        
        return max(0, $maxCantidad - $cantidadActual);
    }

    /**
     * Crear alerta por incompatibilidad
     */
    protected function crearAlertaIncompatibilidad(
        Producto $producto, 
        Subbodega $subbodega, 
        ?string $motivo
    ): Alerta {
        $descripcion = sprintf(
            "Intento de almacenar producto incompatible: %s (%s) en subbodega %s (%s). %s",
            $producto->nombre,
            $producto->sku,
            $subbodega->nombre,
            $subbodega->tipo,
            $motivo ?? 'Sin motivo especificado'
        );

        return Alerta::create([
            'tipo' => 'COMPATIBILIDAD',
            'descripcion' => $descripcion,
            'nivel_riesgo' => 'ALTO',
            'referencia_id' => $producto->id,
            'tabla_referencia' => 'Productos',
            'estado' => 'PENDIENTE',
            'fecha_alerta' => now()
        ]);
    }

    /**
     * Validar movimiento de producto entre ubicaciones
     */
    public function validarMovimiento(
        Producto $producto,
        Ubicacion $origen,
        Ubicacion $destino
    ): array {
        $errores = [];
        $advertencias = [];

        // Verificar compatibilidad con destino
        $compatibilidad = $this->verificarCompatibilidadProductoUbicacion($producto, $destino);
        
        if (!$compatibilidad['compatible']) {
            $errores[] = $compatibilidad['mensaje'];
        }
        
        $advertencias = array_merge($advertencias, $compatibilidad['advertencias']);

        // Verificar estado de la ubicación destino
        if (!$destino->estaDisponible()) {
            $errores[] = "La ubicación destino no está disponible (estado: {$destino->estado})";
        }

        return [
            'valido' => empty($errores),
            'errores' => $errores,
            'advertencias' => $advertencias
        ];
    }
}

