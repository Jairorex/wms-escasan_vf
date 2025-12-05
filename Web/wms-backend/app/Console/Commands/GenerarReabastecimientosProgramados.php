<?php

namespace App\Console\Commands;

use App\Services\ReabastecimientoService;
use App\Services\CompatibilidadService;
use App\Services\InventoryService;
use Illuminate\Console\Command;

class GenerarReabastecimientosProgramados extends Command
{
    protected $signature = 'wms:generar-reabastecimientos';
    protected $description = 'Genera reabastecimientos automáticos programados (cada 15 días) y por stock mínimo';

    public function handle()
    {
        $this->info('Iniciando generación de reabastecimientos...');

        $compatibilidadService = app(CompatibilidadService::class);
        $inventoryService = app(InventoryService::class);
        $reabastecimientoService = new ReabastecimientoService($compatibilidadService, $inventoryService);

        // Verificar stock mínimo
        $this->info('Verificando stock mínimo...');
        $reabastecimientosStockMin = $reabastecimientoService->verificarStockMinimo();
        $this->info('Reabastecimientos por stock mínimo: ' . count($reabastecimientosStockMin));

        // Generar programados
        $this->info('Generando reabastecimientos programados...');
        $reabastecimientosProgramados = $reabastecimientoService->generarReabastecimientosProgramados();
        $this->info('Reabastecimientos programados: ' . count($reabastecimientosProgramados));

        $total = count($reabastecimientosStockMin) + count($reabastecimientosProgramados);
        $this->info("Total de reabastecimientos generados: {$total}");

        return 0;
    }
}

