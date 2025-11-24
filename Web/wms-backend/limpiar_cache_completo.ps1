# Script para limpiar completamente el caché y forzar file cache
# Ejecutar: .\limpiar_cache_completo.ps1

Write-Host "=== Limpiando Caché de Laravel ===" -ForegroundColor Cyan

# 1. Eliminar caché de configuración
Write-Host "`n1. Eliminando caché de configuración..." -ForegroundColor Yellow
if (Test-Path "bootstrap\cache\config.php") {
    Remove-Item "bootstrap\cache\config.php" -Force
    Write-Host "   ✓ bootstrap\cache\config.php eliminado" -ForegroundColor Green
} else {
    Write-Host "   ✓ No existe bootstrap\cache\config.php" -ForegroundColor Green
}

# 2. Eliminar caché de rutas
Write-Host "`n2. Eliminando caché de rutas..." -ForegroundColor Yellow
if (Test-Path "bootstrap\cache\routes-v7.php") {
    Remove-Item "bootstrap\cache\routes-v7.php" -Force
    Write-Host "   ✓ bootstrap\cache\routes-v7.php eliminado" -ForegroundColor Green
} else {
    Write-Host "   ✓ No existe bootstrap\cache\routes-v7.php" -ForegroundColor Green
}

# 3. Eliminar caché de servicios
Write-Host "`n3. Eliminando caché de servicios..." -ForegroundColor Yellow
if (Test-Path "bootstrap\cache\services.php") {
    Remove-Item "bootstrap\cache\services.php" -Force
    Write-Host "   ✓ bootstrap\cache\services.php eliminado" -ForegroundColor Green
} else {
    Write-Host "   ✓ No existe bootstrap\cache\services.php" -ForegroundColor Green
}

# 4. Eliminar caché de archivos
Write-Host "`n4. Eliminando caché de archivos..." -ForegroundColor Yellow
if (Test-Path "storage\framework\cache\data") {
    Remove-Item "storage\framework\cache\data\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ storage\framework\cache\data limpiado" -ForegroundColor Green
} else {
    Write-Host "   ✓ No existe storage\framework\cache\data" -ForegroundColor Green
}

# 5. Verificar/Actualizar .env
Write-Host "`n5. Verificando configuración de cache en .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "CACHE_STORE=database") {
        Write-Host "   ⚠ Encontrado CACHE_STORE=database en .env" -ForegroundColor Red
        Write-Host "   → Cambiando a CACHE_STORE=file..." -ForegroundColor Yellow
        $envContent = $envContent -replace "CACHE_STORE=database", "CACHE_STORE=file"
        Set-Content ".env" -Value $envContent -NoNewline
        Write-Host "   ✓ .env actualizado" -ForegroundColor Green
    } elseif ($envContent -notmatch "CACHE_STORE") {
        Write-Host "   → Agregando CACHE_STORE=file a .env..." -ForegroundColor Yellow
        Add-Content ".env" -Value "`nCACHE_STORE=file"
        Write-Host "   ✓ CACHE_STORE=file agregado a .env" -ForegroundColor Green
    } else {
        Write-Host "   ✓ CACHE_STORE ya está configurado correctamente" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠ No existe .env, creando uno básico..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Add-Content ".env" -Value "`nCACHE_STORE=file"
    Write-Host "   ✓ .env creado con CACHE_STORE=file" -ForegroundColor Green
}

# 6. Ejecutar comandos de artisan
Write-Host "`n6. Ejecutando comandos de artisan..." -ForegroundColor Yellow
Write-Host "   → php artisan config:clear" -ForegroundColor Gray
php artisan config:clear 2>&1 | Out-Null
Write-Host "   ✓ Config cache limpiado" -ForegroundColor Green

Write-Host "   → php artisan route:clear" -ForegroundColor Gray
php artisan route:clear 2>&1 | Out-Null
Write-Host "   ✓ Route cache limpiado" -ForegroundColor Green

Write-Host "   → php artisan view:clear" -ForegroundColor Gray
php artisan view:clear 2>&1 | Out-Null
Write-Host "   ✓ View cache limpiado" -ForegroundColor Green

# 7. Verificar configuración final
Write-Host "`n7. Verificando configuración final..." -ForegroundColor Yellow
$config = php artisan tinker --execute="echo config('cache.default');" 2>&1
if ($config -match "file") {
    Write-Host "   ✓ Cache configurado como 'file'" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Cache no está configurado como 'file': $config" -ForegroundColor Red
}

Write-Host "`n=== Limpieza Completada ===" -ForegroundColor Cyan
Write-Host "`nAhora puedes ejecutar: php artisan cache:clear" -ForegroundColor Green
Write-Host "Sin errores de base de datos." -ForegroundColor Green

