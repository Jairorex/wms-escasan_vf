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
        $allowedOrigin = null;
        
        if ($origin) {
            // Verificar en lista directa
            if (in_array($origin, $allowedOrigins)) {
                $isAllowed = true;
                $allowedOrigin = $origin;
            }
            
            // Verificar patrones (regex)
            if (!$isAllowed && !empty($allowedOriginsPatterns)) {
                foreach ($allowedOriginsPatterns as $pattern) {
                    // Convertir patrón de Laravel CORS a regex
                    // Ejemplo: 'https://.*\\.vercel\\.app' -> '/^https:\/\/.*\.vercel\.app$/'
                    $regex = '#^' . str_replace(['\\', '*'], ['', '.*'], $pattern) . '$#';
                    if (preg_match($regex, $origin)) {
                        $isAllowed = true;
                        $allowedOrigin = $origin;
                        break;
                    }
                }
            }
            
            // Debug temporal: Log para verificar qué está pasando
            if (config('app.debug', false)) {
                \Log::info('CORS Debug', [
                    'origin' => $origin,
                    'allowed_origins' => $allowedOrigins,
                    'allowed_patterns' => $allowedOriginsPatterns,
                    'is_allowed' => $isAllowed,
                    'allowed_origin' => $allowedOrigin,
                ]);
            }
        }
        
        // Preparar headers de CORS
        $allowedMethods = config('cors.allowed_methods', ['*']);
        $allowedHeaders = config('cors.allowed_headers', ['*']);
        
        // Si es '*', usar valores por defecto
        if (in_array('*', $allowedMethods)) {
            $allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
        }
        if (in_array('*', $allowedHeaders)) {
            $allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'];
        }
        
        // Si es una petición OPTIONS (preflight), responder inmediatamente con headers CORS
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 204);
            
            // Agregar headers de CORS SIEMPRE para OPTIONS (preflight) si el origen está permitido
            if ($isAllowed && $allowedOrigin) {
                $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
                $response->headers->set('Access-Control-Allow-Methods', implode(', ', $allowedMethods));
                $response->headers->set('Access-Control-Allow-Headers', implode(', ', $allowedHeaders));
                $response->headers->set('Access-Control-Max-Age', (string)config('cors.max_age', 86400));
                
                if (config('cors.supports_credentials', false)) {
                    $response->headers->set('Access-Control-Allow-Credentials', 'true');
                }
            }
            
            return $response;
        }
        
        // Para otras peticiones, continuar y agregar headers CORS
        $response = $next($request);
        
        // Agregar headers de CORS si el origen está permitido
        if ($isAllowed && $allowedOrigin) {
            $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
            $response->headers->set('Access-Control-Allow-Methods', implode(', ', $allowedMethods));
            $response->headers->set('Access-Control-Allow-Headers', implode(', ', $allowedHeaders));
            
            if (config('cors.supports_credentials', false)) {
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
            }
        }
        
        return $response;
    }
}

