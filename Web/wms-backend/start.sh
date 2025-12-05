#!/bin/sh
set -e  # Salir si hay algún error

# Script de inicio para Railway
# Verifica variables críticas antes de iniciar

echo "🚀 Iniciando WMS ESCASAN API..."
echo "📋 Variables de entorno:"
echo "   PORT: ${PORT:-8080}"
echo "   APP_ENV: ${APP_ENV:-not set}"
echo "   APP_KEY: ${APP_KEY:+set}${APP_KEY:-not set}"

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
php artisan config:clear || echo "⚠️  No se pudo limpiar config cache"
php artisan cache:clear || echo "⚠️  No se pudo limpiar cache"
php artisan route:clear || echo "⚠️  No se pudo limpiar route cache"

# Verificar permisos de storage
echo "📁 Verificando permisos de storage..."
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || echo "⚠️  No se pudieron cambiar permisos (puede ser normal)"

# Verificar que PHP esté funcionando
echo "🔍 Verificando PHP..."
php -v || {
    echo "❌ PHP no está funcionando"
    exit 1
}

# Verificar que Laravel esté funcionando
echo "🔍 Verificando Laravel..."
php artisan --version || {
    echo "❌ Laravel no está funcionando"
    exit 1
}

# Iniciar servidor
echo "✅ Iniciando servidor en puerto ${PORT:-8080}..."
echo "🌐 Servidor disponible en: http://0.0.0.0:${PORT:-8080}"

# Usar exec para que el proceso principal sea el servidor
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}

