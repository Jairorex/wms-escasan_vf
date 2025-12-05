<?php

namespace App\Services;

use App\Models\Producto;
use App\Models\Subbodega;
use App\Models\CategoriaRiesgo;
use App\Services\CompatibilidadService;
use Illuminate\Support\Facades\Log;

class SubbodegaAssignmentService
{
    protected CompatibilidadService $compatibilidadService;

    public function __construct(CompatibilidadService $compatibilidadService)
    {
        $this->compatibilidadService = $compatibilidadService;
    }

    /**
     * Encuentra la subbodega óptima para un producto basado en:
     * 1. Categoría de riesgo (compatibilidad)
     * 2. Índice de rotación (alta rotación → PICKING, baja → RESGUARDO)
     * 3. Requerimientos de temperatura (cadena fría)
     * 
     * @param Producto $producto
     * @return Subbodega|null
     */
    public function findOptimalSubbodega(Producto $producto): ?Subbodega
    {
        // Si requiere temperatura, buscar subbodega de cadena fría compatible
        if ($producto->requiere_temperatura) {
            return $this->findSubbodegaCadenaFria($producto);
        }

        // Si tiene categoría de riesgo, buscar subbodega compatible
        if ($producto->categoria_riesgo_id) {
            $subbodegaPorRiesgo = $this->findSubbodegaPorCategoriaRiesgo($producto);
            if ($subbodegaPorRiesgo) {
                return $subbodegaPorRiesgo;
            }
        }

        // Asignar por índice de rotación
        return $this->findSubbodegaPorRotacion($producto);
    }

    /**
     * Encuentra subbodega de cadena fría compatible con el producto
     */
    protected function findSubbodegaCadenaFria(Producto $producto): ?Subbodega
    {
        $subbodegasFrias = Subbodega::where('tipo', 'CADENA_FRIA')
            ->where('activa', true)
            ->get();

        foreach ($subbodegasFrias as $subbodega) {
            // Verificar rango de temperatura
            if ($producto->temperatura_min !== null && $producto->temperatura_max !== null) {
                // Verificar que el rango del producto esté dentro del rango de la subbodega
                if ($subbodega->temperatura_min !== null && $subbodega->temperatura_max !== null) {
                    $productoMin = $producto->temperatura_min;
                    $productoMax = $producto->temperatura_max;
                    $subMin = $subbodega->temperatura_min;
                    $subMax = $subbodega->temperatura_max;

                    // El rango del producto debe estar dentro del rango de la subbodega
                    if ($productoMin >= $subMin && $productoMax <= $subMax) {
                        // Verificar compatibilidad por categoría de riesgo
                        if ($this->compatibilidadService->verificarCompatibilidadProductoSubbodega($producto, $subbodega)['compatible']) {
                            return $subbodega;
                        }
                    }
                }
            } else {
                // Si el producto no tiene rango específico, usar cualquier cadena fría compatible
                if ($this->compatibilidadService->verificarCompatibilidadProductoSubbodega($producto, $subbodega)['compatible']) {
                    return $subbodega;
                }
            }
        }

        return null;
    }

    /**
     * Encuentra subbodega por categoría de riesgo
     */
    protected function findSubbodegaPorCategoriaRiesgo(Producto $producto): ?Subbodega
    {
        $categoria = $producto->categoriaRiesgo;
        if (!$categoria) {
            return null;
        }

        // Mapeo de categorías de riesgo a tipos de subbodega
        $mapeoRiesgoSubbodega = [
            'Químico' => 'QUIMICOS',
            'Químico/Pesticida' => 'QUIMICOS',
            'Farmacéutico' => 'ALTO_VALOR', // Medicamentos van a alto valor
            'Alto Valor' => 'ALTO_VALOR',
            'Alimenticio' => 'RESGUARDO', // Por defecto
            'General' => 'RESGUARDO',
            'Refrigerado' => 'CADENA_FRIA',
        ];

        $tipoSubbodega = $mapeoRiesgoSubbodega[$categoria->nombre] ?? null;

        if ($tipoSubbodega) {
            $subbodegas = Subbodega::where('tipo', $tipoSubbodega)
                ->where('activa', true)
                ->get();

            foreach ($subbodegas as $subbodega) {
                if ($this->compatibilidadService->verificarCompatibilidadProductoSubbodega($producto, $subbodega)['compatible']) {
                    return $subbodega;
                }
            }
        }

        return null;
    }

    /**
     * Encuentra subbodega por índice de rotación
     */
    protected function findSubbodegaPorRotacion(Producto $producto): ?Subbodega
    {
        $rotacion = $producto->rotacion ?? 'MEDIA';

        // Alta rotación → Picking (cerca de zona de salida)
        if ($rotacion === 'ALTA') {
            $subbodega = Subbodega::where('tipo', 'PICKING')
                ->where('activa', true)
                ->first();
            
            if ($subbodega) {
                return $subbodega;
            }
        }

        // Media/Baja rotación → Resguardo (almacenamiento principal)
        $subbodega = Subbodega::where('tipo', 'RESGUARDO')
            ->where('activa', true)
            ->first();

        if ($subbodega) {
            return $subbodega;
        }

        // Si no hay resguardo, usar cualquier subbodega activa (excepto cuarentena y destrucción)
        return Subbodega::where('activa', true)
            ->whereNotIn('tipo', ['CUARENTENA', 'DESTRUCCION'])
            ->first();
    }

    /**
     * Obtiene lista de subbodegas compatibles para un producto
     * (para mostrar opciones al usuario)
     */
    public function getCompatibleSubbodegas(Producto $producto): array
    {
        $compatibles = [];
        $subbodegas = Subbodega::where('activa', true)->get();

        foreach ($subbodegas as $subbodega) {
            $resultado = $this->compatibilidadService->verificarCompatibilidadProductoSubbodega($producto, $subbodega);
            
            if ($resultado['compatible']) {
                // Verificar temperatura si aplica
                if ($producto->requiere_temperatura) {
                    if ($subbodega->tipo === 'CADENA_FRIA') {
                        if ($producto->temperatura_min !== null && $producto->temperatura_max !== null &&
                            $subbodega->temperatura_min !== null && $subbodega->temperatura_max !== null) {
                            $productoMin = $producto->temperatura_min;
                            $productoMax = $producto->temperatura_max;
                            $subMin = $subbodega->temperatura_min;
                            $subMax = $subbodega->temperatura_max;

                            if ($productoMin >= $subMin && $productoMax <= $subMax) {
                                $compatibles[] = [
                                    'subbodega' => $subbodega,
                                    'prioridad' => 1, // Alta prioridad (compatible y temperatura OK)
                                    'motivo' => 'Compatible y rango de temperatura adecuado'
                                ];
                            }
                        }
                    }
                } else {
                    // No requiere temperatura
                    if ($subbodega->tipo !== 'CADENA_FRIA') {
                        $prioridad = $this->calcularPrioridad($producto, $subbodega);
                        $compatibles[] = [
                            'subbodega' => $subbodega,
                            'prioridad' => $prioridad,
                            'motivo' => $this->getMotivoPrioridad($producto, $subbodega)
                        ];
                    }
                }
            }
        }

        // Ordenar por prioridad (mayor primero)
        usort($compatibles, fn($a, $b) => $b['prioridad'] <=> $a['prioridad']);

        return array_map(fn($item) => $item['subbodega'], $compatibles);
    }

    /**
     * Calcula prioridad de asignación
     */
    protected function calcularPrioridad(Producto $producto, Subbodega $subbodega): int
    {
        $prioridad = 5; // Base

        // Alta rotación → Picking tiene mayor prioridad
        if ($producto->rotacion === 'ALTA' && $subbodega->tipo === 'PICKING') {
            $prioridad += 10;
        }

        // Media rotación → Resguardo tiene mayor prioridad
        if (in_array($producto->rotacion, ['MEDIA', 'BAJA']) && $subbodega->tipo === 'RESGUARDO') {
            $prioridad += 5;
        }

        // Categoría de riesgo específica
        if ($producto->categoria_riesgo_id) {
            $categoria = $producto->categoriaRiesgo;
            if ($categoria) {
                $mapeo = [
                    'Químico' => 'QUIMICOS',
                    'Químico/Pesticida' => 'QUIMICOS',
                    'Farmacéutico' => 'ALTO_VALOR',
                    'Alto Valor' => 'ALTO_VALOR',
                ];

                if (isset($mapeo[$categoria->nombre]) && $subbodega->tipo === $mapeo[$categoria->nombre]) {
                    $prioridad += 15;
                }
            }
        }

        return $prioridad;
    }

    /**
     * Obtiene motivo de prioridad
     */
    protected function getMotivoPrioridad(Producto $producto, Subbodega $subbodega): string
    {
        if ($producto->rotacion === 'ALTA' && $subbodega->tipo === 'PICKING') {
            return 'Alta rotación - Zona de picking';
        }

        if (in_array($producto->rotacion, ['MEDIA', 'BAJA']) && $subbodega->tipo === 'RESGUARDO') {
            return 'Rotación media/baja - Almacenamiento principal';
        }

        if ($producto->categoria_riesgo_id) {
            return 'Compatible por categoría de riesgo';
        }

        return 'Compatible';
    }
}

