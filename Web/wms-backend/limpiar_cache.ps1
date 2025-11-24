# Script para limpiar cache de Laravel
# Ejecutar desde la raíz del proyecto Laravel

Write-Host "Limpiando cache de Laravel..." -ForegroundColor Yellow

# Limpiar cache de configuración
php artisan config:clear
Write-Host "✓ Cache de configuración limpiado" -ForegroundColor Green

# Limpiar cache de aplicación (usando file cache)
php artisan cache:clear
Write-Host "✓ Cache de aplicación limpiado" -ForegroundColor Green

# Limpiar cache de rutas
php artisan route:clear
Write-Host "✓ Cache de rutas limpiado" -ForegroundColor Green

# Limpiar cache de vistas
php artisan view:clear
Write-Host "✓ Cache de vistas limpiado" -ForegroundColor Green

Write-Host "`n¡Cache limpiado exitosamente!" -ForegroundColor Green

