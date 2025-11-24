<?php

/**
 * Script para verificar que las rutas estén correctamente configuradas
 * Ejecutar: php verificar_rutas.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "=== Verificación de Rutas API ===\n\n";

// Verificar que el archivo de rutas existe
$routesFile = __DIR__.'/routes/api.php';
if (file_exists($routesFile)) {
    echo "✓ Archivo de rutas existe: routes/api.php\n";
} else {
    echo "✗ Archivo de rutas NO existe: routes/api.php\n";
    exit(1);
}

// Verificar que HealthController existe
$healthController = __DIR__.'/app/Http/Controllers/Api/HealthController.php';
if (file_exists($healthController)) {
    echo "✓ HealthController existe\n";
} else {
    echo "✗ HealthController NO existe\n";
    exit(1);
}

// Verificar que TestController existe
$testController = __DIR__.'/app/Http/Controllers/Api/TestController.php';
if (file_exists($testController)) {
    echo "✓ TestController existe\n";
} else {
    echo "✗ TestController NO existe\n";
}

// Verificar bootstrap/app.php
$bootstrapFile = __DIR__.'/bootstrap/app.php';
if (file_exists($bootstrapFile)) {
    $content = file_get_contents($bootstrapFile);
    if (strpos($content, "api: __DIR__.'/../routes/api.php'") !== false) {
        echo "✓ Rutas API registradas en bootstrap/app.php\n";
    } else {
        echo "✗ Rutas API NO registradas en bootstrap/app.php\n";
    }
} else {
    echo "✗ bootstrap/app.php NO existe\n";
}

echo "\n=== Rutas disponibles ===\n";
echo "Para ver todas las rutas, ejecuta: php artisan route:list --path=api\n";
echo "\n=== Endpoints de prueba ===\n";
echo "GET http://localhost:8000/api/health\n";
echo "GET http://localhost:8000/api/test\n";
echo "GET http://localhost:8000/api/tasks\n";

