<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Log de la petición entrante (solo información básica para evitar errores)
            Log::info('API Request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'origin' => $request->header('Origin'),
            ]);
        } catch (\Exception $e) {
            // Si hay error en el log, continuar de todas formas
        }

        $response = $next($request);

        try {
            // Log de la respuesta
            Log::info('API Response', [
                'status' => $response->getStatusCode(),
                'url' => $request->fullUrl(),
            ]);
        } catch (\Exception $e) {
            // Si hay error en el log, continuar de todas formas
        }

        return $response;
    }
}

