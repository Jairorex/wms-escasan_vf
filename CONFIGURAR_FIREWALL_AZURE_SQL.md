# 🔥 Configurar Firewall de Azure SQL Database para Railway

## ✅ Progreso

¡Excelente! El Microsoft ODBC Driver 18 está instalado correctamente. El problema ahora es el **firewall de Azure SQL Database**.

## 🔍 Información del Error

- **IP de Railway:** `162.220.234.123`
- **Servidor Azure SQL:** `wms-escasan-server.database.windows.net`
- **Error:** El firewall está bloqueando la conexión

## 🔧 Solución: Agregar Regla de Firewall

### Opción 1: Desde Azure Portal (Recomendado)

1. **Ve a Azure Portal:**
   - https://portal.azure.com
   - Busca tu servidor SQL: `wms-escasan-server`

2. **Configura el Firewall:**
   - Click en **"Networking"** o **"Firewalls and virtual networks"**
   - Click en **"+ Add client IP"** (esto agrega tu IP actual)
   - O agrega manualmente:
     - **Rule name:** `Railway-Production`
     - **Start IP address:** `162.220.234.123`
     - **End IP address:** `162.220.234.123`
   - Click en **"Save"**

3. **Habilitar Acceso desde Azure (Opcional pero Recomendado):**
   - Marca la casilla **"Allow Azure services and resources to access this server"**
   - Esto permite que servicios de Azure (incluyendo Railway si está en Azure) se conecten

### Opción 2: Usando Azure CLI

```bash
az sql server firewall-rule create \
  --resource-group tu-resource-group \
  --server wms-escasan-server \
  --name Railway-Production \
  --start-ip-address 162.220.234.123 \
  --end-ip-address 162.220.234.123
```

### Opción 3: Usando SQL (sp_set_firewall_rule)

Conéctate a la base de datos `master` y ejecuta:

```sql
EXEC sp_set_firewall_rule 
  @name = N'Railway-Production',
  @start_ip_address = '162.220.234.123',
  @end_ip_address = '162.220.234.123';
```

## ⚠️ Nota Importante sobre IPs de Railway

**Railway puede cambiar la IP del contenedor** en cada deploy. Tienes dos opciones:

### Opción A: Agregar IP Manualmente (Cada vez que cambie)

1. Verifica la IP actual en los logs de Railway
2. Agrega esa IP al firewall de Azure SQL

### Opción B: Habilitar "Allow Azure services" (Recomendado)

Si Railway está en Azure (o si Azure permite conexiones desde servicios externos):
1. En Azure Portal → SQL Server → Networking
2. Marca **"Allow Azure services and resources to access this server"**
3. Esto permite conexiones desde cualquier servicio de Azure

### Opción C: Usar Rango de IPs (Si conoces el rango de Railway)

Si Railway publica un rango de IPs, puedes agregar ese rango completo.

## 📋 Pasos Rápidos

1. **Abre Azure Portal:**
   ```
   https://portal.azure.com
   ```

2. **Busca tu servidor SQL:**
   - Busca: `wms-escasan-server`

3. **Ve a Networking/Firewall:**
   - Click en **"Networking"** o **"Firewalls and virtual networks"**

4. **Agrega la IP de Railway:**
   - **Start IP:** `162.220.234.123`
   - **End IP:** `162.220.234.123`
   - **Name:** `Railway-Production`
   - Click **"Save"**

5. **Espera 1-5 minutos** para que el cambio tome efecto

6. **Prueba de nuevo:**
   ```
   https://wms-escasanvf-production.up.railway.app/api/health
   ```

## ✅ Verificación

Después de agregar la regla de firewall, el endpoint `/api/health` debería mostrar:

```json
{
  "database": {
    "connected": true,
    "driver": "sqlsrv",
    "database": "wms_db"
  },
  "tables": {
    "Tareas": {
      "exists": true,
      "count": 0
    },
    ...
  }
}
```

## 🆘 Si la IP Cambia

Si Railway cambia la IP (puede pasar en cada deploy), necesitarás:

1. **Verificar la nueva IP** en los logs de Railway o en el error
2. **Agregar la nueva IP** al firewall de Azure SQL
3. **O mejor:** Habilitar "Allow Azure services" si es posible

## 💡 Recomendación

Para evitar tener que agregar IPs manualmente cada vez:

1. **Habilita "Allow Azure services"** en Azure SQL
2. **O usa un servicio de Azure** para el backend (Azure App Service en lugar de Railway)
3. **O configura un rango de IPs** si Railway lo proporciona

¡Una vez configurado el firewall, el servidor debería funcionar perfectamente! 🚀

