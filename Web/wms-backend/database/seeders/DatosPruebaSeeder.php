<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Producto;
use App\Models\Subbodega;
use App\Models\Ubicacion;
use App\Models\TipoUbicacion;
use App\Models\CategoriaRiesgo;

class DatosPruebaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌱 Creando datos de prueba...');

        // 1. Las categorías de riesgo ya existen por migración
        $this->command->info('✓ Categorías de Riesgo (ya existen por migración)');

        // 2. Crear Subbodegas
        $subbodegas = $this->crearSubbodegas();

        // 3. Crear Tipos de Ubicación
        $tiposUbicacion = $this->crearTiposUbicacion();

        // 4. Crear Ubicaciones en cada subbodega
        $ubicaciones = $this->crearUbicaciones($subbodegas, $tiposUbicacion);

        // 5. Crear Productos de prueba
        $this->crearProductos();

        $this->command->info('✅ Datos de prueba creados exitosamente');
    }

    private function crearSubbodegas()
    {
        // Las subbodegas ya existen en la base de datos por la migración
        // Solo las obtenemos
        $subbodegas = Subbodega::where('activa', true)->get();

        $this->command->info('✓ Subbodegas obtenidas: ' . $subbodegas->count());
        return $subbodegas;
    }

    private function crearTiposUbicacion()
    {
        $tipos = [
            ['nombre' => 'Rack'],
            ['nombre' => 'Estantería'],
            ['nombre' => 'Piso'],
            ['nombre' => 'Refrigerador'],
            ['nombre' => 'Zona Segura'],
        ];

        $created = [];
        foreach ($tipos as $tipo) {
            $tipoUbicacion = TipoUbicacion::firstOrCreate(['nombre' => $tipo['nombre']]);
            $created[] = $tipoUbicacion;
        }

        $this->command->info('✓ Tipos de Ubicación creados: ' . count($created));
        return $created;
    }

    private function crearUbicaciones($subbodegas, $tiposUbicacion)
    {
        $ubicaciones = [];

        // Tipo Rack por defecto
        $tipoRack = TipoUbicacion::where('nombre', 'Rack')->first();
        $tipoRefri = TipoUbicacion::where('nombre', 'Refrigerador')->first();

        foreach ($subbodegas as $subbodega) {
            // Determinar tipo de ubicación según subbodega
            $tipoUbicacionId = $tipoRack->id;
            if ($subbodega->tipo === 'CADENA_FRIA') {
                $tipoUbicacionId = $tipoRefri ? $tipoRefri->id : $tipoRack->id;
            }

            // Crear 5 ubicaciones por subbodega
            for ($i = 1; $i <= 5; $i++) {
                $pasillo = chr(64 + $i); // A, B, C, D, E
                $codigo = "{$pasillo}-01-01";

                $ubicacion = Ubicacion::firstOrCreate(
                    ['codigo' => $codigo . '-' . $subbodega->id],
                    [
                        'codigo' => $codigo . '-' . $subbodega->id,
                        'pasillo' => $pasillo,
                        'estante' => '01',
                        'nivel' => '01',
                        'tipo_ubicacion_id' => $tipoUbicacionId,
                        'subbodega_id' => $subbodega->id,
                        'max_peso' => 1000,
                        'max_cantidad' => 500,
                        'estado' => 'DISPONIBLE',
                    ]
                );
                $ubicaciones[] = $ubicacion;
            }
        }

        $this->command->info('✓ Ubicaciones creadas: ' . count($ubicaciones));
        return $ubicaciones;
    }

    private function crearProductos()
    {
        // Obtener categorías por código (están en la migración)
        $catAlimenticio = CategoriaRiesgo::where('codigo', 'CAT-ALI')->first();
        $catGeneral = CategoriaRiesgo::where('codigo', 'CAT-GEN')->first();
        $catRefrigerado = CategoriaRiesgo::where('codigo', 'CAT-REFRI')->first();
        $catQuimico = CategoriaRiesgo::where('codigo', 'CAT-QUIM')->first();

        $productos = [
            // Productos Generales
            [
                'sku' => 'PROD-001',
                'nombre' => 'Caja de Cartón Grande',
                'descripcion' => 'Caja de cartón para empaque, 60x40x40 cm',
                'peso' => 0.5,
                'volumen' => 0.096,
                'categoria_riesgo_id' => $catGeneral?->id,
                'requiere_temperatura' => false,
                'rotacion' => 'ALTA',
                'stock_minimo' => 100,
                'stock_maximo' => 1000,
            ],
            [
                'sku' => 'PROD-002',
                'nombre' => 'Bolsa Plástica 50x70',
                'descripcion' => 'Bolsa plástica resistente',
                'peso' => 0.05,
                'volumen' => 0.001,
                'categoria_riesgo_id' => $catGeneral?->id,
                'requiere_temperatura' => false,
                'rotacion' => 'MEDIA',
                'stock_minimo' => 500,
                'stock_maximo' => 5000,
            ],

            // Productos Alimenticios (sin temperatura)
            [
                'sku' => 'ALIM-001',
                'nombre' => 'Arroz Blanco 1kg',
                'descripcion' => 'Arroz blanco grano largo',
                'peso' => 1.0,
                'volumen' => 0.001,
                'categoria_riesgo_id' => $catAlimenticio?->id,
                'requiere_temperatura' => false,
                'rotacion' => 'ALTA',
                'stock_minimo' => 200,
                'stock_maximo' => 2000,
            ],
            [
                'sku' => 'ALIM-002',
                'nombre' => 'Aceite Vegetal 1L',
                'descripcion' => 'Aceite vegetal comestible',
                'peso' => 0.92,
                'volumen' => 0.001,
                'categoria_riesgo_id' => $catAlimenticio?->id,
                'requiere_temperatura' => false,
                'rotacion' => 'MEDIA',
                'stock_minimo' => 100,
                'stock_maximo' => 1000,
            ],

            // Productos Refrigerados
            [
                'sku' => 'REFR-001',
                'nombre' => 'Leche Entera 1L',
                'descripcion' => 'Leche entera pasteurizada',
                'peso' => 1.03,
                'volumen' => 0.001,
                'categoria_riesgo_id' => $catRefrigerado?->id,
                'requiere_temperatura' => true,
                'temperatura_min' => 2,
                'temperatura_max' => 8,
                'rotacion' => 'ALTA',
                'stock_minimo' => 50,
                'stock_maximo' => 500,
            ],
            [
                'sku' => 'REFR-002',
                'nombre' => 'Yogurt Natural 200g',
                'descripcion' => 'Yogurt natural sin azúcar',
                'peso' => 0.2,
                'volumen' => 0.0002,
                'categoria_riesgo_id' => $catRefrigerado?->id,
                'requiere_temperatura' => true,
                'temperatura_min' => 0,
                'temperatura_max' => 6,
                'rotacion' => 'ALTA',
                'stock_minimo' => 100,
                'stock_maximo' => 1000,
            ],

            // Productos Químicos
            [
                'sku' => 'QUIM-001',
                'nombre' => 'Desinfectante 1L',
                'descripcion' => 'Desinfectante multiusos',
                'peso' => 1.0,
                'volumen' => 0.001,
                'categoria_riesgo_id' => $catQuimico?->id,
                'requiere_temperatura' => false,
                'rotacion' => 'MEDIA',
                'stock_minimo' => 50,
                'stock_maximo' => 500,
            ],
        ];

        $created = 0;
        foreach ($productos as $data) {
            $producto = Producto::firstOrCreate(
                ['sku' => $data['sku']],
                $data
            );
            $created++;
        }

        $this->command->info('✓ Productos creados: ' . $created);
    }
}

