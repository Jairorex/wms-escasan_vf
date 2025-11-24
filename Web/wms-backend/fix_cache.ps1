# Script rápido para cambiar CACHE_STORE a file
# Ejecutar desde: web\wms-backend

Write-Host "=== Corrigiendo Configuración de Cache ===" -ForegroundColor Cyan

# Cambiar CACHE_STORE en .env
if (Test-Path ".env") {
    Write-Host "`n1. Actualizando .env..." -ForegroundColor Yellow
    $content = Get-Content ".env" -Raw
    if ($content -match "CACHE_STORE=database") {
        $content = $content -replace "CACHE_STORE=database", "CACHE_STORE=file"
        Set-Content ".env" -Value $content -NoNewline
        Write-Host "   ✓ CACHE_STORE cambiado de 'database' a 'file'" -ForegroundColor Green
    } elseif ($content -notmatch "CACHE_STORE") {
        Add-Content ".env" -Value "`nCACHE_STORE=file"
        Write-Host "   ✓ CACHE_STORE=file agregado" -ForegroundColor Green
    } else {
        Write-Host "   ✓ CACHE_STORE ya está configurado correctamente" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠ No se encontró .env" -ForegroundColor Red
    exit 1
}

# Eliminar caché de configuración
Write-Host "`n2. Eliminando caché de configuración..." -ForegroundColor Yellow
if (Test-Path "bootstrap\cache\config.php") {
    Remove-Item "bootstrap\cache\config.php" -Force
    Write-Host "   ✓ Cache eliminado" -ForegroundColor Green
} else {
    Write-Host "   ✓ No hay caché para eliminar" -ForegroundColor Green
}

# Limpiar cachés
Write-Host "`n3. Limpiando cachés..." -ForegroundColor Yellow
php artisan config:clear | Out-Null
Write-Host "   ✓ Config cache limpiado" -ForegroundColor Green

# Probar cache:clear
Write-Host "`n4. Probando cache:clear..." -ForegroundColor Yellow
$result = php artisan cache:clear 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ cache:clear ejecutado exitosamente" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Error al ejecutar cache:clear" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
}

Write-Host "`n=== Completado ===" -ForegroundColor Cyan
Write-Host "`nAhora puedes ejecutar 'php artisan cache:clear' sin errores." -ForegroundColor Green

