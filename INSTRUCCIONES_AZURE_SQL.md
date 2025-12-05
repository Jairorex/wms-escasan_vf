# 📋 Instrucciones para Crear Base de Datos en Azure SQL Database

## 🎯 Pasos para Ejecutar el Script SQL

### 1. Crear Base de Datos en Azure

1. Ve al [Portal de Azure](https://portal.azure.com)
2. Busca "SQL databases" o "Azure SQL"
3. Click en "Create" o "Crear"
4. Configura:
   - **Subscription:** Tu suscripción
   - **Resource group:** Crea uno nuevo o usa existente
   - **Database name:** `WMS_ESCASAN_VF` (o el nombre que prefieras)
   - **Server:** Crea un nuevo servidor o selecciona uno existente
   - **Compute + storage:** Selecciona el plan (Basic, S0, S1, etc.)
   - **Authentication:** SQL authentication
5. Click "Review + create" y luego "Create"

### 2. Obtener Cadena de Conexión

1. Una vez creada la base de datos, ve a "Connection strings"
2. Copia la cadena de conexión para **ADO.NET** o **ODBC**
3. Ejemplo:
   ```
   Server=tcp:tu-servidor.database.windows.net,1433;Initial Catalog=WMS_ESCASAN_VF;Persist Security Info=False;User ID=tu-usuario;Password=tu-password;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

### 3. Ejecutar el Script SQL

#### Opción A: Usando Azure Portal (Query Editor)

1. En la base de datos, ve a "Query editor (preview)"
2. Inicia sesión con tu usuario SQL
3. Abre el archivo `database_sql_server_complete.sql`
4. Copia y pega todo el contenido
5. Click en "Run" o presiona F5
6. Verifica que todas las tablas se crearon correctamente

#### Opción B: Usando SQL Server Management Studio (SSMS)

1. Descarga e instala [SSMS](https://docs.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms)
2. Conecta a tu servidor Azure SQL:
   - **Server name:** `tu-servidor.database.windows.net`
   - **Authentication:** SQL Server Authentication
   - **Login:** Tu usuario
   - **Password:** Tu contraseña
3. Abre el archivo `database_sql_server_complete.sql`
4. Ejecuta el script (F5)
5. Verifica los mensajes de éxito

#### Opción C: Usando Azure Data Studio

1. Descarga [Azure Data Studio](https://docs.microsoft.com/sql/azure-data-studio/download-azure-data-studio)
2. Conecta a tu servidor Azure SQL
3. Abre el archivo `database_sql_server_complete.sql`
4. Ejecuta el script

#### Opción D: Usando sqlcmd (Línea de comandos)

```bash
sqlcmd -S tu-servidor.database.windows.net -d WMS_ESCASAN_VF -U tu-usuario -P tu-password -i database_sql_server_complete.sql
```

### 4. Verificar la Creación

Ejecuta este query para verificar todas las tablas:

```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

Deberías ver estas tablas:
- Alertas
- Categorias_Riesgo
- Configuracion_Reabastecimiento
- Detalle_Recepciones
- Detalle_Reabastecimientos
- Detalle_Tarea
- Inventario
- Lecturas_Temperatura
- Lotes
- Movimientos
- Ordenes
- Permisos
- Productos
- Recepciones
- Reabastecimientos
- Reglas_Compatibilidad
- Roles
- Roles_Permisos
- Subbodegas
- Tareas
- Tipos_Ubicacion
- Ubicaciones
- Usuarios

### 5. Configurar Firewall de Azure

Si no puedes conectarte, agrega tu IP al firewall:

1. En Azure Portal, ve a tu servidor SQL
2. Ve a "Networking" o "Firewall and virtual networks"
3. Click "Add client IP" o agrega manualmente tu IP
4. Guarda los cambios

### 6. Actualizar .env del Backend

Actualiza tu archivo `.env` en `Web/wms-backend/.env`:

```env
DB_CONNECTION=sqlsrv
DB_HOST=tu-servidor.database.windows.net
DB_PORT=1433
DB_DATABASE=WMS_ESCASAN_VF
DB_USERNAME=tu-usuario
DB_PASSWORD=tu-password
```

### 7. Probar la Conexión

Desde Laravel, ejecuta:

```bash
cd Web/wms-backend
php artisan migrate:status
```

O crea un usuario de prueba:

```sql
-- Crear usuario administrador de prueba
-- La contraseña debe estar hasheada con bcrypt
-- Usa: Hash::make('password123') desde Laravel o genera una con:
-- https://bcrypt-generator.com/

INSERT INTO [dbo].[Usuarios] ([nombre], [usuario], [email], [password], [rol_id])
VALUES ('Admin', 'admin', 'admin@escasan.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);
-- La contraseña es: password
```

## ⚠️ Notas Importantes

1. **Nombres de Tablas:** Todas las tablas usan nombres con mayúscula inicial (Roles, Usuarios, etc.) para coincidir con SQL Server.

2. **Tipos de Datos:**
   - `BIGINT IDENTITY(1,1)` para IDs autoincrementales
   - `NVARCHAR` para texto (soporta Unicode)
   - `DECIMAL(10,2)` para cantidades
   - `BIT` para booleanos
   - `DATETIME` para fechas

3. **Foreign Keys:** Todas las relaciones están configuradas con `ON DELETE NO ACTION` o `ON DELETE CASCADE` según corresponda.

4. **Datos Iniciales:** El script inserta:
   - Roles básicos
   - Subbodegas por defecto
   - Categorías de riesgo

5. **Seguridad:**
   - Usa contraseñas seguras
   - Habilita solo las IPs necesarias en el firewall
   - Considera usar Azure Active Directory para autenticación

## 🔧 Solución de Problemas

### Error: "Cannot open server"
- Verifica que el firewall permita tu IP
- Verifica que el servidor esté activo en Azure

### Error: "Login failed"
- Verifica usuario y contraseña
- Asegúrate de usar SQL Authentication, no Windows Authentication

### Error: "Database does not exist"
- Verifica el nombre de la base de datos
- Asegúrate de estar conectado al servidor correcto

### Error: "Table already exists"
- El script verifica si las tablas existen antes de crearlas
- Si quieres recrear, primero elimina las tablas existentes

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Azure Portal
2. Verifica la cadena de conexión
3. Prueba conectarte con SSMS primero
4. Revisa la documentación de Azure SQL Database

¡Listo! Tu base de datos está configurada. 🎉

