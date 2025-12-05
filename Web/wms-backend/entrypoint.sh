#!/bin/sh
set -e

echo "🚀 Iniciando WMS ESCASAN API..."
echo "📋 Verificando configuración..."

# Verificar que APP_KEY esté configurado
if [ -z "$APP_KEY" ]; then
    echo "⚠️  ADVERTENCIA: APP_KEY no está configurado"
    echo "⚠️  Generando APP_KEY..."
    php artisan key:generate --force || {
        echo "❌ Error al generar APP_KEY"
        exit 1
    }
    echo "✅ APP_KEY generado"
else
    echo "✅ APP_KEY está configurado"
fi

# Limpiar cache
echo "🧹 Limpiando cache..."
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Verificar permisos de storage
echo "📁 Verificando permisos de storage..."
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Verificar PHP
echo "🔍 Verificando PHP..."
php -v

# Verificar Laravel
echo "🔍 Verificando Laravel..."
php artisan --version

# Verificar conexión a base de datos (sin fallar si no conecta)
echo "🔍 Verificando conexión a base de datos..."
php artisan tinker --execute="DB::connection()->getPdo();" 2>&1 | head -5 || echo "⚠️  No se pudo verificar BD (puede ser normal si no está configurada)"

# Configurar APP_DEBUG para producción (mostrar errores en logs)
if [ "$APP_ENV" = "production" ]; then
    echo "🔧 Configurando para producción..."
    # NO cachear configuración para que las variables de entorno se lean dinámicamente
    # Esto es importante para CORS y otras configuraciones que dependen de ENV
    echo "⚠️  NO se cacheará la configuración para permitir cambios dinámicos de ENV"
    # php artisan config:cache || true  # Comentado para permitir lectura dinámica de ENV
fi

# Iniciar servidor
echo "✅ Iniciando servidor en puerto ${PORT:-8080}..."
echo "🌐 Servidor disponible en: http://0.0.0.0:${PORT:-8080}"
echo "📝 Los errores se registrarán en storage/logs/laravel.log"

# Iniciar servidor (usar exec para que sea el proceso principal)
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}

