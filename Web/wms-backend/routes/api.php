<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\InboundController;
use App\Http\Controllers\Api\OutboundController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\UbicacionController;
use App\Http\Controllers\Api\CatalogoController;
use App\Http\Controllers\Api\RolController;
use App\Http\Controllers\Api\TareaKpiController;
use App\Http\Controllers\Api\SupervisorController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\LoteController;
use App\Http\Controllers\Api\AlertaController;
use App\Http\Controllers\Api\InventarioController;
use App\Http\Controllers\Api\SubbodegaController;
use App\Http\Controllers\Api\RecepcionController;
use App\Http\Controllers\Api\ReabastecimientoController;
use App\Http\Controllers\Api\TemperaturaController;
use App\Http\Controllers\Api\MovimientoController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rutas de autenticación (públicas) - DEBEN IR PRIMERO
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/logout', [AuthController::class, 'logout']);
Route::get('auth/me', [AuthController::class, 'me']);
Route::post('auth/change-password', [AuthController::class, 'changePassword']);

// Endpoints de salud y prueba de conexión
Route::get('/health', [\App\Http\Controllers\Api\HealthController::class, 'index']);
Route::get('/health/simple', [\App\Http\Controllers\Api\HealthController::class, 'simple']);
Route::get('/health/ready', [\App\Http\Controllers\Api\HealthController::class, 'ready']);
Route::get('/health/live', [\App\Http\Controllers\Api\HealthController::class, 'live']);
Route::get('/test', [\App\Http\Controllers\Api\TestController::class, 'index']);

// Rutas de autenticación (ajustar según tu sistema de auth)
Route::middleware('auth:sanctum')->group(function () {
    
    // Rutas de Tareas
    Route::prefix('tasks')->group(function () {
        Route::get('/', [TaskController::class, 'getTasks']);
        Route::get('/{id}', [TaskController::class, 'getTask']);
        Route::post('/', [TaskController::class, 'store']);
        Route::put('/{id}', [TaskController::class, 'update']);
        Route::post('/{id}/start', [TaskController::class, 'start']);
        Route::post('/{id}/complete', [TaskController::class, 'complete']);
        Route::post('/{id}/assign', [TaskController::class, 'assign']);
        Route::post('/validate-scan', [TaskController::class, 'validateScan']);
    });

    // Rutas de KPIs de Tareas
    Route::get('/tareas/kpis', [TareaKpiController::class, 'index']);

    // Rutas de Supervisores
    Route::prefix('supervisores')->group(function () {
        Route::get('/stats', [SupervisorController::class, 'stats']);
        Route::get('/{id}/operarios', [SupervisorController::class, 'getOperarios']);
        Route::post('/{supervisorId}/operarios/{operarioId}', [SupervisorController::class, 'asignarOperario']);
    });

    // Rutas de Inbound (Recepción)
    Route::prefix('inbound')->group(function () {
        Route::post('/receive', [InboundController::class, 'receive']);
        Route::post('/orden', [InboundController::class, 'createOrden']);
    });

    // Rutas de Outbound (Picking/Salida)
    Route::prefix('outbound')->group(function () {
        Route::post('/prepare', [OutboundController::class, 'prepare']);
        Route::post('/orden', [OutboundController::class, 'createOrden']);
    });

    // Rutas de Productos
    Route::apiResource('productos', ProductoController::class);

    // Rutas de Ubicaciones
    Route::apiResource('ubicaciones', UbicacionController::class);

    // Rutas de Catálogos
    Route::prefix('catalogos')->group(function () {
        Route::get('/tipos-ubicacion', [CatalogoController::class, 'getTiposUbicacion']);
        Route::post('/tipos-ubicacion', [CatalogoController::class, 'createTipoUbicacion']);
        Route::get('/clasificaciones', [CatalogoController::class, 'getClasificaciones']);
        Route::post('/clasificaciones', [CatalogoController::class, 'createClasificacion']);
        Route::get('/tipos-producto', [CatalogoController::class, 'getTiposProducto']);
        Route::post('/tipos-producto', [CatalogoController::class, 'createTipoProducto']);
    });

    // Rutas directas para compatibilidad con frontend
    Route::get('/tipos-ubicacion', [CatalogoController::class, 'getTiposUbicacion']);
    Route::post('/tipos-ubicacion', [CatalogoController::class, 'createTipoUbicacion']);
    Route::get('/clasificaciones', [CatalogoController::class, 'getClasificaciones']);
    Route::post('/clasificaciones', [CatalogoController::class, 'createClasificacion']);
    Route::get('/tipos-producto', [CatalogoController::class, 'getTiposProducto']);
    Route::post('/tipos-producto', [CatalogoController::class, 'createTipoProducto']);

    // Rutas de Lotes (CRUD completo)
    Route::get('/lotes', [LoteController::class, 'index']);
    Route::post('/lotes', [LoteController::class, 'store']);
    Route::get('/lotes/{id}', [CatalogoController::class, 'getLote']); // Detalle con relaciones
    Route::put('/lotes/{id}', [LoteController::class, 'update']);
    Route::delete('/lotes/{id}', [LoteController::class, 'destroy']);

    // Rutas de Usuarios (CRUD completo)
    Route::apiResource('usuarios', UsuarioController::class);
    Route::post('/usuarios/{id}/reset-password', [UsuarioController::class, 'resetPassword']);

    // Rutas de Roles
    Route::get('/roles', [RolController::class, 'index']);

    // Rutas de Alertas
    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::get('/alertas/{id}', [AlertaController::class, 'show']);
    Route::post('/alertas/{id}/resolver', [AlertaController::class, 'resolver']);
    Route::post('/alertas/generar/vencimientos', [AlertaController::class, 'generarAlertasVencimientos']);
    Route::post('/alertas/generar/sin-ubicacion', [AlertaController::class, 'generarAlertasSinUbicacion']);
    Route::post('/alertas/generar/todas', [AlertaController::class, 'generarTodasLasAlertas']);

    // Rutas de Inventario
    Route::get('/inventario', [InventarioController::class, 'index']);
    Route::get('/inventario/{id}', [InventarioController::class, 'show']);
    Route::post('/inventario', [InventarioController::class, 'store']);
    Route::put('/inventario/{id}', [InventarioController::class, 'update']);
    Route::delete('/inventario/{id}', [InventarioController::class, 'destroy']);
    Route::get('/inventario/producto/{productoId}/stock', [InventarioController::class, 'stockPorProducto']);
    Route::get('/inventario/ubicacion/{ubicacionId}', [InventarioController::class, 'porUbicacion']);

    // ============================================
    // NUEVOS MÓDULOS WMS v2.0
    // ============================================

    // Rutas de Subbodegas
    Route::prefix('subbodegas')->group(function () {
        Route::get('/', [SubbodegaController::class, 'index']);
        Route::get('/tipos', [SubbodegaController::class, 'tipos']);
        Route::get('/sugerida/{productoId}', [SubbodegaController::class, 'sugerida']);
        Route::get('/{id}', [SubbodegaController::class, 'show']);
        Route::post('/', [SubbodegaController::class, 'store']);
        Route::put('/{id}', [SubbodegaController::class, 'update']);
        Route::delete('/{id}', [SubbodegaController::class, 'destroy']);
        Route::get('/{id}/ubicaciones', [SubbodegaController::class, 'ubicaciones']);
        Route::post('/{id}/ubicaciones', [SubbodegaController::class, 'asignarUbicacion']);
        Route::post('/{id}/temperatura', [SubbodegaController::class, 'registrarTemperatura']);
    });

    // Rutas de Recepciones (nuevo módulo mejorado)
    Route::prefix('recepciones')->group(function () {
        Route::get('/', [RecepcionController::class, 'index']);
        Route::get('/estadisticas', [RecepcionController::class, 'estadisticas']);
        Route::get('/{id}', [RecepcionController::class, 'show']);
        Route::post('/estandar', [RecepcionController::class, 'crearRecepcionEstandar']);
        Route::post('/cadena-fria', [RecepcionController::class, 'crearRecepcionCadenaFria']);
        Route::post('/{id}/aprobar-excepcion', [RecepcionController::class, 'aprobarConExcepcion']);
        Route::post('/{id}/rechazar', [RecepcionController::class, 'rechazar']);
    });

    // Rutas de Reabastecimientos
    Route::prefix('reabastecimientos')->group(function () {
        Route::get('/', [ReabastecimientoController::class, 'index']);
        Route::get('/estadisticas', [ReabastecimientoController::class, 'estadisticas']);
        Route::get('/{id}', [ReabastecimientoController::class, 'show']);
        Route::post('/', [ReabastecimientoController::class, 'store']);
        Route::post('/{id}/aprobar', [ReabastecimientoController::class, 'aprobar']);
        Route::post('/{id}/ejecutar', [ReabastecimientoController::class, 'ejecutar']);
        Route::post('/{id}/completar', [ReabastecimientoController::class, 'completar']);
        Route::post('/{id}/cancelar', [ReabastecimientoController::class, 'cancelar']);
        // Rutas automáticas
        Route::post('/verificar-stock', [ReabastecimientoController::class, 'verificarStockMinimo']);
        Route::post('/generar-programados', [ReabastecimientoController::class, 'generarProgramados']);
    });

    // Rutas de Categorías de Riesgo
    Route::prefix('categorias-riesgo')->group(function () {
        Route::get('/', [CatalogoController::class, 'getCategoriasRiesgo']);
        Route::post('/', [CatalogoController::class, 'createCategoriaRiesgo']);
        Route::put('/{id}', [CatalogoController::class, 'updateCategoriaRiesgo']);
    });

    // Rutas de Reglas de Compatibilidad
    Route::prefix('reglas-compatibilidad')->group(function () {
        Route::get('/', [CatalogoController::class, 'getReglasCompatibilidad']);
        Route::post('/', [CatalogoController::class, 'createReglaCompatibilidad']);
        Route::put('/{id}', [CatalogoController::class, 'updateReglaCompatibilidad']);
        Route::delete('/{id}', [CatalogoController::class, 'deleteReglaCompatibilidad']);
    });

    // Rutas de Control de Temperatura
    Route::prefix('temperaturas')->group(function () {
        Route::get('/lecturas', [TemperaturaController::class, 'index']);
        Route::post('/registrar', [TemperaturaController::class, 'registrar']);
        Route::get('/historial/{subbodegaId}', [TemperaturaController::class, 'historial']);
        Route::get('/ultimas', [TemperaturaController::class, 'ultimasLecturas']);
    });

    // Rutas de Movimientos de Inventario
    Route::prefix('movimientos')->group(function () {
        Route::get('/', [MovimientoController::class, 'index']);
        Route::post('/', [MovimientoController::class, 'store']);
        Route::get('/{id}', [MovimientoController::class, 'show']);
    });

    // Rutas de Lotes - Generar código de barras
    Route::post('/lotes/{id}/generate-barcode', [LoteController::class, 'generateBarcode']);
});

