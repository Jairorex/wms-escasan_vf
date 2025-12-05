<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Obtener origen de la petición
        $origin = $request->headers->get('Origin');
        
        // Obtener configuración de CORS
        $allowedOrigins = config('cors.allowed_origins', []);
        $allowedOriginsPatterns = config('cors.allowed_origins_patterns', []);
        
        // Verificar si el origen está permitido
        $isAllowed = false;
        
        if ($origin) {
            // Verificar en lista directa
            if (in_array($origin, $allowedOrigins)) {
                $isAllowed = true;
            }
            
            // Verificar patrones
            if (!$isAllowed) {
                foreach ($allowedOriginsPatterns as $pattern) {
                    if (preg_match('#^' . str_replace(['*', '.'], ['.*', '\.'], $pattern) . '$#', $origin)) {
                        $isAllowed = true;
                        break;
                    }
                }
            }
        }
        
        // Si es una petición OPTIONS (preflight), responder inmediatamente
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }
        
        // Agregar headers de CORS si el origen está permitido
        if ($isAllowed && $origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', implode(', ', config('cors.allowed_methods', ['*'])));
            $response->headers->set('Access-Control-Allow-Headers', implode(', ', config('cors.allowed_headers', ['*'])));
            $response->headers->set('Access-Control-Max-Age', config('cors.max_age', 0));
            
            if (config('cors.supports_credentials', false)) {
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
            }
        }
        
        return $response;
    }
}

