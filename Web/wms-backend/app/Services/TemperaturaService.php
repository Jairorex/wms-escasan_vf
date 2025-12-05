<?php

namespace App\Services;

use App\Models\Producto;
use App\Models\Subbodega;
use App\Models\Ubicacion;
use App\Models\LecturaTemperatura;
use App\Models\Recepcion;
use App\Models\Alerta;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TemperaturaService
{
    /**
     * Validar temperatura de recepción
     */
    public function validarTemperaturaRecepcion(
        Recepcion $recepcion,
        float $temperatura
    ): array {
        // Verificar si la recepción requiere control de temperatura
        if (!$recepcion->requiereValidacionTemperatura()) {
            return [
                'valido' => true,
                'mensaje' => 'Recepción no requiere control de temperatura',
                'accion' => null
            ];
        }

        // Obtener rangos de la subbodega destino
        $subbodega = $recepcion->subbodegaDestino;
        
        if (!$subbodega) {
            return [
                'valido' => false,
                'mensaje' => 'No se ha definido subbodega destino para validar temperatura',
                'accion' => 'DEFINIR_DESTINO'
            ];
        }

        $resultado = $subbodega->validarTemperatura($temperatura);

        if (!$resultado['valido']) {
            // Temperatura fuera de rango
            $this->crearAlertaTemperaturaRecepcion($recepcion, $temperatura, $subbodega);
            
            return [
                'valido' => false,
                'mensaje' => $resultado['mensaje'],
                'accion' => 'RECHAZAR_O_CUARENTENA',
                'sugerencias' => [
                    'Rechazar el producto',
                    'Enviar a cuarentena para evaluación',
                    'Contactar al supervisor de calidad'
                ]
            ];
        }

        return [
            'valido' => true,
            'mensaje' => 'Temperatura dentro del rango permitido',
            'accion' => null
        ];
    }

    /**
     * Validar temperatura de un producto específico
     */
    public function validarTemperaturaProducto(
        Producto $producto,
        float $temperatura
    ): array {
        if (!$producto->requiereControlTemperatura()) {
            return [
                'valido' => true,
                'mensaje' => 'Producto no requiere control de temperatura'
            ];
        }

        return $producto->validarTemperatura($temperatura);
    }

    /**
     * Registrar lectura de temperatura en ubicación
     */
    public function registrarLecturaUbicacion(
        Ubicacion $ubicacion,
        float $temperatura,
        ?float $humedad = null,
        ?int $usuarioId = null,
        string $origen = 'MANUAL'
    ): LecturaTemperatura {
        $lectura = LecturaTemperatura::registrar([
            'ubicacion_id' => $ubicacion->id,
            'subbodega_id' => $ubicacion->subbodega_id,
            'temperatura' => $temperatura,
            'humedad' => $humedad,
            'origen' => $origen,
            'usuario_id' => $usuarioId,
            'fecha_lectura' => now()
        ]);

        // Actualizar temperatura actual de la ubicación
        $ubicacion->update([
            'temperatura_actual' => $temperatura,
            'ultima_lectura_temperatura' => now()
        ]);

        return $lectura;
    }

    /**
     * Registrar lectura de temperatura en subbodega
     */
    public function registrarLecturaSubbodega(
        Subbodega $subbodega,
        float $temperatura,
        ?float $humedad = null,
        ?int $usuarioId = null,
        string $origen = 'MANUAL',
        ?string $sensorId = null
    ): LecturaTemperatura {
        return LecturaTemperatura::registrar([
            'subbodega_id' => $subbodega->id,
            'temperatura' => $temperatura,
            'humedad' => $humedad,
            'origen' => $origen,
            'sensor_id' => $sensorId,
            'usuario_id' => $usuarioId,
            'fecha_lectura' => now()
        ]);
    }

    /**
     * Obtener historial de temperaturas de una subbodega
     */
    public function getHistorialTemperaturas(
        Subbodega $subbodega,
        ?Carbon $desde = null,
        ?Carbon $hasta = null
    ): array {
        $query = LecturaTemperatura::where('subbodega_id', $subbodega->id)
            ->orderBy('fecha_lectura', 'desc');

        if ($desde) {
            $query->where('fecha_lectura', '>=', $desde);
        }

        if ($hasta) {
            $query->where('fecha_lectura', '<=', $hasta);
        }

        $lecturas = $query->get();

        // Calcular estadísticas
        $temperaturas = $lecturas->pluck('temperatura');
        
        return [
            'lecturas' => $lecturas,
            'estadisticas' => [
                'total_lecturas' => $lecturas->count(),
                'temperatura_promedio' => $temperaturas->avg(),
                'temperatura_minima' => $temperaturas->min(),
                'temperatura_maxima' => $temperaturas->max(),
                'lecturas_fuera_rango' => $lecturas->where('dentro_rango', false)->count()
            ]
        ];
    }

    /**
     * Verificar alertas de temperatura pendientes
     */
    public function verificarAlertasTemperaturaPendientes(): array
    {
        $subbodegasFrias = Subbodega::cadenaFria()->activas()->get();
        $alertasGeneradas = [];

        foreach ($subbodegasFrias as $subbodega) {
            // Verificar última lectura
            $ultimaLectura = LecturaTemperatura::where('subbodega_id', $subbodega->id)
                ->orderBy('fecha_lectura', 'desc')
                ->first();

            if (!$ultimaLectura) {
                // Sin lecturas - generar alerta
                $alerta = $this->crearAlertaSinLecturas($subbodega);
                $alertasGeneradas[] = $alerta;
                continue;
            }

            // Verificar antigüedad de la lectura
            $horasDesdeUltimaLectura = $ultimaLectura->fecha_lectura->diffInHours(now());
            
            if ($horasDesdeUltimaLectura > 4) {
                // Lectura muy antigua
                $alerta = $this->crearAlertaLecturaAntigua($subbodega, $ultimaLectura);
                $alertasGeneradas[] = $alerta;
            }

            // Verificar si está fuera de rango
            if (!$ultimaLectura->dentro_rango) {
                // Ya debería haber alerta, pero verificar
                if (!$ultimaLectura->alerta_id) {
                    $ultimaLectura->crearAlertaTemperatura();
                    $alertasGeneradas[] = $ultimaLectura->fresh()->alerta;
                }
            }
        }

        return $alertasGeneradas;
    }

    /**
     * Generar reporte de cadena de frío
     */
    public function generarReporteCadenaFrio(
        ?Carbon $desde = null,
        ?Carbon $hasta = null
    ): array {
        $desde = $desde ?? Carbon::now()->subDays(7);
        $hasta = $hasta ?? Carbon::now();

        $subbodegasFrias = Subbodega::cadenaFria()->activas()->get();
        $reporte = [];

        foreach ($subbodegasFrias as $subbodega) {
            $historial = $this->getHistorialTemperaturas($subbodega, $desde, $hasta);
            
            $reporte[] = [
                'subbodega' => [
                    'id' => $subbodega->id,
                    'nombre' => $subbodega->nombre,
                    'rango' => [
                        'min' => $subbodega->temperatura_min,
                        'max' => $subbodega->temperatura_max
                    ]
                ],
                'periodo' => [
                    'desde' => $desde->toDateTimeString(),
                    'hasta' => $hasta->toDateTimeString()
                ],
                'estadisticas' => $historial['estadisticas'],
                'cumplimiento' => $this->calcularCumplimiento($historial['lecturas']),
                'incidentes' => $historial['lecturas']->where('dentro_rango', false)->count()
            ];
        }

        return $reporte;
    }

    /**
     * Calcular porcentaje de cumplimiento
     */
    protected function calcularCumplimiento($lecturas): float
    {
        if ($lecturas->isEmpty()) {
            return 0;
        }

        $dentroRango = $lecturas->where('dentro_rango', true)->count();
        return round(($dentroRango / $lecturas->count()) * 100, 2);
    }

    /**
     * Crear alerta por temperatura fuera de rango en recepción
     */
    protected function crearAlertaTemperaturaRecepcion(
        Recepcion $recepcion,
        float $temperatura,
        Subbodega $subbodega
    ): Alerta {
        $descripcion = sprintf(
            "[TEMPERATURA] Fuera de rango en recepción %s: %.2f°C (Rango: %.2f°C - %.2f°C). Proveedor: %s",
            $recepcion->numero_recepcion,
            $temperatura,
            $subbodega->temperatura_min ?? 0,
            $subbodega->temperatura_max ?? 0,
            $recepcion->proveedor ?? 'No especificado'
        );

        return Alerta::create([
            'tipo' => 'CAPACIDAD_EXCEDIDA', // Usamos este tipo para alertas de temperatura
            'descripcion' => $descripcion,
            'nivel_riesgo' => 'ALTO',
            'referencia_id' => $recepcion->id,
            'tabla_referencia' => 'Recepciones',
            'estado' => 'PENDIENTE',
            'fecha_alerta' => now()
        ]);
    }

    /**
     * Crear alerta por falta de lecturas
     */
    protected function crearAlertaSinLecturas(Subbodega $subbodega): Alerta
    {
        return Alerta::create([
            'tipo' => 'CAPACIDAD_EXCEDIDA', // Usamos este tipo para alertas de temperatura
            'descripcion' => "[TEMPERATURA] La subbodega {$subbodega->nombre} no tiene lecturas de temperatura registradas",
            'nivel_riesgo' => 'ALTO',
            'referencia_id' => $subbodega->id,
            'tabla_referencia' => 'Subbodegas',
            'estado' => 'PENDIENTE',
            'fecha_alerta' => now()
        ]);
    }

    /**
     * Crear alerta por lectura antigua
     */
    protected function crearAlertaLecturaAntigua(
        Subbodega $subbodega, 
        LecturaTemperatura $ultimaLectura
    ): Alerta {
        $horas = $ultimaLectura->fecha_lectura->diffInHours(now());
        
        return Alerta::create([
            'tipo' => 'CAPACIDAD_EXCEDIDA', // Usamos este tipo para alertas de temperatura
            'descripcion' => "[TEMPERATURA] La subbodega {$subbodega->nombre} no ha registrado temperatura en las últimas {$horas} horas",
            'nivel_riesgo' => 'MEDIO',
            'referencia_id' => $subbodega->id,
            'tabla_referencia' => 'Subbodegas',
            'estado' => 'PENDIENTE',
            'fecha_alerta' => now()
        ]);
    }
}

