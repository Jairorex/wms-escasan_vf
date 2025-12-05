<?php

namespace App\Console\Commands;

use App\Services\TemperaturaService;
use Illuminate\Console\Command;

class VerificarTemperaturas extends Command
{
    protected $signature = 'wms:verificar-temperaturas';
    protected $description = 'Verifica las temperaturas de las subbodegas de cadena fría y genera alertas si es necesario';

    public function handle()
    {
        $this->info('Verificando temperaturas de cadena fría...');

        $temperaturaService = app(TemperaturaService::class);
        $alertas = $temperaturaService->verificarAlertasTemperaturaPendientes();

        if (count($alertas) > 0) {
            $this->warn('Se generaron ' . count($alertas) . ' alertas de temperatura');
            foreach ($alertas as $alerta) {
                $this->line("  - [{$alerta->nivel_riesgo}] {$alerta->descripcion}");
            }
        } else {
            $this->info('Todas las temperaturas están dentro del rango normal');
        }

        return 0;
    }
}

