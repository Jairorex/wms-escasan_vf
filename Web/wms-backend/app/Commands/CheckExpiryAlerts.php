<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lote;
use App\Models\Inventario;
use App\Models\Alerta;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CheckExpiryAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wms:check-expiry {--days=30 : Días antes de vencimiento para alertar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Revisa lotes próximos a vencer y genera alertas';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dias = (int) $this->option('days');
        $fechaLimite = Carbon::now()->addDays($dias);

        $this->info("Buscando lotes que vencen antes del {$fechaLimite->format('Y-m-d')}...");

        // Buscar lotes que vencen en los próximos N días
        $lotes = Lote::where('fecha_caducidad', '<=', $fechaLimite)
            ->where('fecha_caducidad', '>=', Carbon::now())
            ->with('producto')
            ->get();

        $alertasCreadas = 0;
        $alertasActualizadas = 0;

        foreach ($lotes as $lote) {
            // Verificar si el lote tiene cantidad > 0 en inventario
            $inventarioTotal = Inventario::where('lote_id', $lote->id)
                ->sum('cantidad');

            if ($lote->fecha_caducidad && $lote->fecha_caducidad <= Carbon::now()) {
                $nivelRiesgo = 'ALTO';
                $descripcion = "El lote {$lote->lote_codigo} del producto {$lote->producto->nombre} ha vencido el {$lote->fecha_caducidad->format('d/m/Y')}. Stock disponible: {$inventarioTotal}";
            } else {
                $diasRestantes = $lote->fecha_caducidad ? (int) Carbon::now()->diffInDays($lote->fecha_caducidad) : 0;
                $nivelRiesgo = $diasRestantes <= 7 ? 'ALTO' : ($diasRestantes <= 15 ? 'MEDIO' : 'BAJO');
                $descripcion = "El lote {$lote->lote_codigo} del producto {$lote->producto->nombre} vence el {$lote->fecha_caducidad->format('d/m/Y')} ({$diasRestantes} " . ($diasRestantes === 1 ? 'día' : 'días') . " restantes). Stock disponible: {$inventarioTotal}";
            }

            if ($inventarioTotal > 0) {
                // Buscar si ya existe una alerta activa para este lote
                $alertaExistente = Alerta::where('referencia_id', $lote->id)
                    ->where('tabla_referencia', 'Lotes')
                    ->where('tipo', 'VENCIMIENTO')
                    ->where('estado', 'PENDIENTE')
                    ->first();

                if ($alertaExistente) {
                    // Actualizar alerta existente
                    $alertaExistente->update([
                        'descripcion' => $descripcion,
                        'nivel_riesgo' => $nivelRiesgo,
                        'fecha_alerta' => now()
                    ]);
                    $alertasActualizadas++;
                } else {
                    // Crear nueva alerta
                    Alerta::create([
                        'tipo' => 'VENCIMIENTO',
                        'descripcion' => $descripcion,
                        'nivel_riesgo' => $nivelRiesgo,
                        'referencia_id' => $lote->id,
                        'tabla_referencia' => 'Lotes',
                        'estado' => 'PENDIENTE',
                        'fecha_alerta' => now()
                    ]);
                    $alertasCreadas++;
                }
            }
        }

        $this->info("Proceso completado:");
        $this->info("- Alertas creadas: {$alertasCreadas}");
        $this->info("- Alertas actualizadas: {$alertasActualizadas}");
        $this->info("- Total de lotes revisados: " . $lotes->count());

        return Command::SUCCESS;
    }
}

