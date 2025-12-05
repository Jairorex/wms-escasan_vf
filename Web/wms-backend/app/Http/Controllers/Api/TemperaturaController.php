<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LecturaTemperatura;
use App\Models\Subbodega;
use App\Services\TemperaturaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TemperaturaController extends Controller
{
    protected $temperaturaService;

    public function __construct(TemperaturaService $temperaturaService)
    {
        $this->temperaturaService = $temperaturaService;
    }

    /**
     * Obtener todas las lecturas de temperatura
     */
    public function index(Request $request)
    {
        $query = LecturaTemperatura::with(['subbodega', 'ubicacion', 'usuario']);

        if ($request->has('subbodega_id')) {
            $query->where('subbodega_id', $request->subbodega_id);
        }

        if ($request->has('ubicacion_id')) {
            $query->where('ubicacion_id', $request->ubicacion_id);
        }

        if ($request->has('dentro_rango')) {
            $query->where('dentro_rango', $request->dentro_rango === 'true' || $request->dentro_rango === '1');
        }

        if ($request->has('fecha_inicio')) {
            $query->whereDate('fecha_lectura', '>=', $request->fecha_inicio);
        }

        if ($request->has('fecha_fin')) {
            $query->whereDate('fecha_lectura', '<=', $request->fecha_fin);
        }

        $lecturas = $query->orderBy('fecha_lectura', 'desc')->limit(100)->get();

        return response()->json([
            'success' => true,
            'data' => $lecturas
        ]);
    }

    /**
     * Registrar una nueva lectura de temperatura
     */
    public function registrar(Request $request)
    {
        $request->validate([
            'subbodega_id' => 'required_without:ubicacion_id|integer|exists:Subbodegas,id',
            'ubicacion_id' => 'required_without:subbodega_id|integer|exists:Ubicaciones,id',
            'temperatura' => 'required|numeric|between:-100,100',
            'humedad' => 'nullable|numeric|between:0,100',
            'observaciones' => 'nullable|string|max:500'
        ]);

        // Obtener el usuario autenticado
        $userId = Auth::id();

        // Obtener la subbodega para validar rangos
        $subbodega = null;
        $tempMin = null;
        $tempMax = null;

        if ($request->subbodega_id) {
            $subbodega = Subbodega::find($request->subbodega_id);
            $tempMin = $subbodega->temperatura_min;
            $tempMax = $subbodega->temperatura_max;
        }

        // Determinar si está dentro del rango
        $dentroRango = true;
        if ($tempMin !== null && $tempMax !== null) {
            $dentroRango = $request->temperatura >= $tempMin && $request->temperatura <= $tempMax;
        }

        // Crear la lectura
        $lectura = LecturaTemperatura::create([
            'subbodega_id' => $request->subbodega_id,
            'ubicacion_id' => $request->ubicacion_id,
            'temperatura' => $request->temperatura,
            'humedad' => $request->humedad,
            'dentro_rango' => $dentroRango,
            'temperatura_min_esperada' => $tempMin,
            'temperatura_max_esperada' => $tempMax,
            'origen' => 'MANUAL',
            'usuario_id' => $userId,
            'fecha_lectura' => now(),
            'observaciones' => $request->observaciones
        ]);

        // Si está fuera de rango, generar alerta
        if (!$dentroRango && $subbodega) {
            $this->temperaturaService->generarAlertaTemperatura(
                $subbodega,
                $request->temperatura,
                $tempMin,
                $tempMax
            );
        }

        $lectura->load(['subbodega', 'usuario']);

        return response()->json([
            'success' => true,
            'message' => $dentroRango 
                ? 'Temperatura registrada correctamente' 
                : 'Temperatura registrada. ¡ALERTA! Fuera del rango permitido.',
            'data' => $lectura,
            'dentro_rango' => $dentroRango
        ]);
    }

    /**
     * Obtener historial de temperatura de una subbodega
     */
    public function historial($subbodegaId, Request $request)
    {
        $request->validate([
            'dias' => 'nullable|integer|min:1|max:365',
            'limit' => 'nullable|integer|min:1|max:1000'
        ]);

        $dias = $request->get('dias', 7);
        $limit = $request->get('limit', 100);

        $lecturas = LecturaTemperatura::where('subbodega_id', $subbodegaId)
            ->where('fecha_lectura', '>=', now()->subDays($dias))
            ->orderBy('fecha_lectura', 'desc')
            ->limit($limit)
            ->get();

        $subbodega = Subbodega::find($subbodegaId);

        // Calcular estadísticas
        $stats = [
            'min' => $lecturas->min('temperatura'),
            'max' => $lecturas->max('temperatura'),
            'promedio' => round($lecturas->avg('temperatura'), 2),
            'total_lecturas' => $lecturas->count(),
            'fuera_rango' => $lecturas->where('dentro_rango', false)->count(),
            'rango_permitido' => [
                'min' => $subbodega?->temperatura_min,
                'max' => $subbodega?->temperatura_max
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $lecturas,
            'estadisticas' => $stats,
            'subbodega' => $subbodega
        ]);
    }

    /**
     * Obtener última lectura de cada subbodega
     */
    public function ultimasLecturas()
    {
        $subbodegas = Subbodega::where('tipo', 'CADENA_FRIA')->get();
        $lecturas = [];

        foreach ($subbodegas as $subbodega) {
            $ultimaLectura = LecturaTemperatura::where('subbodega_id', $subbodega->id)
                ->orderBy('fecha_lectura', 'desc')
                ->first();

            $lecturas[] = [
                'subbodega' => $subbodega,
                'ultima_lectura' => $ultimaLectura,
                'estado' => $this->determinarEstado($ultimaLectura, $subbodega)
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $lecturas
        ]);
    }

    /**
     * Determinar estado de una lectura
     */
    private function determinarEstado($lectura, $subbodega)
    {
        if (!$lectura) {
            return ['status' => 'sin_datos', 'mensaje' => 'Sin lecturas registradas'];
        }

        // Verificar si la lectura es muy antigua (más de 1 hora)
        $horasDesdeUltimaLectura = now()->diffInHours($lectura->fecha_lectura);
        if ($horasDesdeUltimaLectura > 1) {
            return ['status' => 'desactualizado', 'mensaje' => "Última lectura hace {$horasDesdeUltimaLectura} horas"];
        }

        if (!$lectura->dentro_rango) {
            $temp = $lectura->temperatura;
            $min = $subbodega->temperatura_min;
            $max = $subbodega->temperatura_max;

            if ($temp < $min) {
                return ['status' => 'bajo', 'mensaje' => "Temperatura muy baja ({$temp}°C < {$min}°C)"];
            } else {
                return ['status' => 'alto', 'mensaje' => "Temperatura muy alta ({$temp}°C > {$max}°C)"];
            }
        }

        return ['status' => 'normal', 'mensaje' => 'Temperatura dentro del rango'];
    }
}

