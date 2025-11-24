# Script para iniciar el backend correctamente
# Ejecutar desde cualquier lugar

Write-Host "=== Iniciando Backend WMS ===" -ForegroundColor Cyan

# Cambiar al directorio correcto
$backendPath = "C:\xampp\htdocs\Wms_Propuesta2\web\wms-backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "`n❌ ERROR: No se encontró el directorio del backend" -ForegroundColor Red
    Write-Host "   Buscado en: $backendPath" -ForegroundColor Yellow
    Write-Host "`nPor favor, ejecuta este script desde el directorio raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

Set-Location $backendPath
Write-Host "`n✓ Directorio: $(Get-Location)" -ForegroundColor Green

# Verificar archivos importantes
Write-Host "`nVerificando archivos..." -ForegroundColor Yellow
$files = @(
    "routes\api.php",
    "app\Http\Controllers\Api\HealthController.php",
    "bootstrap\app.php"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file NO existe" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host "`n❌ Faltan archivos importantes. Verifica la instalación." -ForegroundColor Red
    exit 1
}

# Verificar rutas
Write-Host "`nVerificando rutas..." -ForegroundColor Yellow
$routes = php artisan route:list --path=api/health 2>&1
if ($routes -match "api/health") {
    Write-Host "  ✓ Ruta api/health registrada" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Ruta api/health no encontrada" -ForegroundColor Yellow
    Write-Host "  Limpiando caché..." -ForegroundColor Yellow
    php artisan route:clear | Out-Null
    php artisan config:clear | Out-Null
}

# Limpiar cachés
Write-Host "`nLimpiando cachés..." -ForegroundColor Yellow
php artisan route:clear | Out-Null
php artisan config:clear | Out-Null
Write-Host "  ✓ Cachés limpiados" -ForegroundColor Green

# Verificar puerto
Write-Host "`nVerificando puerto 8000..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "  ⚠ Puerto 8000 está en uso" -ForegroundColor Yellow
    Write-Host "  Detén el servidor anterior o usa otro puerto" -ForegroundColor Yellow
    $usePort = Read-Host "  ¿Usar puerto 8001? (S/N)"
    if ($usePort -eq "S" -or $usePort -eq "s") {
        $port = 8001
    } else {
        Write-Host "  Por favor, detén el servidor en el puerto 8000" -ForegroundColor Red
        exit 1
    }
} else {
    $port = 8000
}

# Iniciar servidor
Write-Host "`n=== Iniciando servidor ===" -ForegroundColor Cyan
Write-Host "  URL: http://localhost:$port" -ForegroundColor Green
Write-Host "  Endpoint de prueba: http://localhost:$port/api/health" -ForegroundColor Green
Write-Host "`nPresiona Ctrl+C para detener el servidor`n" -ForegroundColor Yellow

if ($port -eq 8001) {
    php artisan serve --port=8001
} else {
    php artisan serve
}

