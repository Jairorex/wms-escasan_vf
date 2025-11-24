# Configuración de SQL Server para WMS

## ⚠️ Problema Detectado

Si ves el error:
```
SQLSTATE[HY000]: General error: 1 no such table: INFORMATION_SCHEMA.TABLES (Connection: sqlite...)
```

Significa que Laravel está usando **SQLite** en lugar de **SQL Server**. 

## Solución: Configurar .env Correctamente

### Paso 1: Editar archivo `.env`

Abre el archivo `.env` en la raíz de tu proyecto Laravel y configura:

```env
DB_CONNECTION=sqlsrv
DB_HOST=tu_servidor_sql
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
```

### Paso 2: Ejemplos de Configuración

#### Opción A: SQL Server Local (localhost)

```env
DB_CONNECTION=sqlsrv
DB_HOST=localhost
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=sa
DB_PASSWORD=tu_contraseña_sa
```

#### Opción B: SQL Server con Instancia Nombrada

```env
DB_CONNECTION=sqlsrv
DB_HOST=localhost\SQLEXPRESS
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=sa
DB_PASSWORD=tu_contraseña
```

#### Opción C: Autenticación Windows (Integrated Security)

```env
DB_CONNECTION=sqlsrv
DB_HOST=tu_servidor
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=
DB_PASSWORD=
```

Y en `config/database.php`, agrega en la configuración de `sqlsrv`:

```php
'options' => [
    'TrustServerCertificate' => true,
    'ConnectionPooling' => false,
    'Encrypt' => false,
    'IntegratedSecurity' => true,  // Para autenticación Windows
],
```

### Paso 3: Verificar Configuración

Después de editar `.env`, ejecuta:

```bash
php artisan config:clear
php artisan cache:clear
```

Luego prueba la conexión:

```bash
php artisan wms:test-connection
```

## Verificar que SQL Server Driver esté Instalado

### En Windows

1. Abre **Administrador de Dispositivos** o ejecuta:
   ```powershell
   Get-OdbcDriver | Where-Object {$_.Name -like "*SQL Server*"}
   ```

2. O verifica en el registro:
   ```powershell
   Get-ItemProperty "HKLM:\SOFTWARE\ODBC\ODBCINST.INI\ODBC Drivers"
   ```

### Instalar SQL Server Driver

Si no está instalado:

1. **SQL Server Native Client** (recomendado para aplicaciones antiguas)
   - Descargar desde Microsoft

2. **ODBC Driver for SQL Server** (recomendado, más reciente)
   - Descargar desde: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

3. **Microsoft ODBC Driver 17 for SQL Server** (más común)
   - Incluido en muchas instalaciones de SQL Server

## Verificar Conexión Manualmente

### Usando PowerShell

```powershell
# Probar conexión ODBC
$connectionString = "Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=wms_db;Trusted_Connection=yes;"
$conn = New-Object System.Data.Odbc.OdbcConnection($connectionString)
$conn.Open()
Write-Host "Conexión exitosa!"
$conn.Close()
```

### Usando sqlcmd

```bash
sqlcmd -S localhost -d wms_db -E
# O con usuario/password
sqlcmd -S localhost -d wms_db -U sa -P tu_password
```

## Solución de Problemas

### Error: "Driver not found"

**Solución:** Instala el driver de SQL Server (ver arriba)

### Error: "Login failed"

**Solución:** 
- Verifica credenciales en `.env`
- Verifica que el usuario tenga permisos en la base de datos
- Para autenticación Windows, verifica que el usuario tenga acceso

### Error: "Cannot open database"

**Solución:**
- Verifica que la base de datos `wms_db` exista
- Verifica que el usuario tenga permisos en la base de datos
- Verifica el nombre de la base de datos en `.env`

### Error: "Connection timeout"

**Solución:**
- Verifica que SQL Server esté corriendo
- Verifica el firewall (puerto 1433)
- Verifica que el servidor sea accesible desde tu máquina

## Configuración Recomendada para Desarrollo

```env
DB_CONNECTION=sqlsrv
DB_HOST=localhost
DB_PORT=1433
DB_DATABASE=wms_db
DB_USERNAME=sa
DB_PASSWORD=tu_password_segura

# Opciones adicionales en config/database.php
'options' => [
    'TrustServerCertificate' => true,  // Solo para desarrollo
    'ConnectionPooling' => false,
    'Encrypt' => false,  // Solo para desarrollo local
],
```

## Después de Configurar

1. Limpia la caché:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

2. Prueba la conexión:
   ```bash
   php artisan wms:test-connection
   ```

3. Deberías ver:
   ```
   ✅ Conexión exitosa
   Driver: sqlsrv
   Base de datos: wms_db
   ```

Si aún ves `sqlite`, verifica que el archivo `.env` esté en la raíz del proyecto y que no haya un `.env.example` que esté siendo usado por error.

