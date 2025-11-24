<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Producto;
use App\Models\Inventario;
use App\Models\Alerta;
use Illuminate\Support\Facades\DB;

class CheckMinStock extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wms:check-min-stock';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Revisa productos con stock mínimo y genera alertas';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Buscando productos con stock bajo...');

        // Obtener todos los productos
        $productos = Producto::all();

        $alertasCreadas = 0;

        foreach ($productos as $producto) {
            // Calcular stock total del producto a través de sus lotes
            // Inventario no tiene producto_id directamente, se obtiene a través de Lote
            $stockTotal = Inventario::whereHas('lote', function ($query) use ($producto) {
                $query->where('producto_id', $producto->id);
            })
            ->where('estado', 'Disponible')
            ->sum('cantidad');

            // Aquí podrías tener un campo stock_minimo en la tabla productos
            // Por ahora, usaremos un valor por defecto o configuración
            $stockMinimo = 10; // Valor por defecto, ajustar según necesidades

            if ($stockTotal < $stockMinimo && $stockTotal > 0) {
                // Buscar si ya existe una alerta activa
                $alertaExistente = Alerta::where('referencia_id', $producto->id)
                    ->where('tabla_referencia', 'Productos')
                    ->where('tipo', 'STOCK_MIN')
                    ->where('estado', 'PENDIENTE')
                    ->first();

                if (!$alertaExistente) {
                    Alerta::create([
                        'tipo' => 'STOCK_MIN',
                        'descripcion' => "El producto {$producto->nombre} ({$producto->sku}) tiene stock bajo. Disponible: {$stockTotal}, Mínimo recomendado: {$stockMinimo}",
                        'nivel_riesgo' => 'MEDIO',
                        'referencia_id' => $producto->id,
                        'tabla_referencia' => 'Productos',
                        'estado' => 'PENDIENTE',
                        'fecha_alerta' => now()
                    ]);
                    $alertasCreadas++;
                }
            }
        }

        $this->info("Proceso completado. Alertas creadas: {$alertasCreadas}");

        return Command::SUCCESS;
    }
}

