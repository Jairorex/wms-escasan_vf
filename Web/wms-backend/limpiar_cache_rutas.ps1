# Script para limpiar caché de rutas de Laravel
# Ejecutar desde la carpeta web/wms-backend

Write-Host "Limpiando caché de rutas..." -ForegroundColor Yellow

# Limpiar caché de rutas
php artisan route:clear
Write-Host "✓ Caché de rutas limpiado" -ForegroundColor Green

# Limpiar caché de configuración
php artisan config:clear
Write-Host "✓ Caché de configuración limpiado" -ForegroundColor Green

# Limpiar caché general
php artisan cache:clear
Write-Host "✓ Caché general limpiado" -ForegroundColor Green

# Optimizar (opcional)
# php artisan route:cache
# Write-Host "✓ Rutas optimizadas" -ForegroundColor Green

Write-Host "`n¡Caché limpiado exitosamente!" -ForegroundColor Green
Write-Host "Reinicia el servidor con: php artisan serve" -ForegroundColor Cyan

