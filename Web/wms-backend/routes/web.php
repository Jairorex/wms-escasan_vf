<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'WMS ESCASAN API',
        'version' => '2.0',
        'status' => 'running',
        'endpoints' => [
            'health' => '/api/health',
            'api_base' => '/api',
        ]
    ]);
});

// Ruta de prueba para verificar que el servidor funciona
Route::get('/test', function () {
    return response()->json([
        'message' => 'Server is running',
        'timestamp' => now()->toDateTimeString(),
        'php_version' => PHP_VERSION,
    ]);
});
