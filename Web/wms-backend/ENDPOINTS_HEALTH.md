# Endpoints de Health Check

## Descripción

El sistema incluye varios endpoints de health check para monitorear el estado de la API.

## Endpoints Disponibles

### 1. Health Check Completo
**GET** `/api/health`

Verifica el estado completo del sistema:
- Conexión a base de datos
- Existencia de tablas principales
- Funcionamiento del cache
- Permisos de almacenamiento

**Respuesta exitosa (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000000Z",
  "version": "1.0.0",
  "service": "WMS API",
  "database": {
    "connected": true,
    "driver": "sqlsrv",
    "database": "wms_db",
    "error": null
  },
  "tables": {
    "Tareas": {
      "exists": true,
      "count": 10
    },
    "Productos": {
      "exists": true,
      "count": 50
    },
    ...
  },
  "cache": {
    "working": true,
    "driver": "file",
    "error": null
  },
  "storage": {
    "storage": {
      "path": "C:\\xampp\\htdocs\\Wms_Propuesta2\\web\\wms-backend\\storage",
      "writable": true,
      "exists": true
    },
    ...
  },
  "request": {
    "method": "GET",
    "url": "http://localhost:8000/api/health",
    "ip": "127.0.0.1",
    "user_agent": "Mozilla/5.0...",
    "origin": "http://localhost:3000"
  }
}
```

**Respuesta degradada (503):**
Si algún componente falla, el status será `"degraded"` y el código HTTP será 503.

---

### 2. Health Check Simple
**GET** `/api/health/simple`

Endpoint ligero que solo verifica que la API esté funcionando, sin verificaciones pesadas.

**Respuesta (200):**
```json
{
  "status": "ok",
  "message": "API WMS está funcionando",
  "timestamp": "2024-01-01T12:00:00.000000Z",
  "version": "1.0.0"
}
```

**Uso:** Ideal para checks frecuentes o monitoreo básico.

---

### 3. Readiness Check
**GET** `/api/health/ready`

Verifica que la API esté lista para recibir tráfico (conexión a BD funcionando).

**Respuesta exitosa (200):**
```json
{
  "status": "ready",
  "message": "API está lista para recibir tráfico",
  "timestamp": "2024-01-01T12:00:00.000000Z"
}
```

**Respuesta no lista (503):**
```json
{
  "status": "not_ready",
  "message": "API no está lista: [error]",
  "timestamp": "2024-01-01T12:00:00.000000Z"
}
```

**Uso:** Para verificar antes de enviar tráfico de producción.

---

### 4. Liveness Check
**GET** `/api/health/live`

Verifica que el servicio esté vivo (mínima verificación).

**Respuesta (200):**
```json
{
  "status": "alive",
  "timestamp": "2024-01-01T12:00:00.000000Z"
}
```

**Uso:** Para verificar que el proceso esté corriendo.

---

## Ejemplos de Uso

### Desde el Navegador
```
http://localhost:8000/api/health
http://localhost:8000/api/health/simple
http://localhost:8000/api/health/ready
http://localhost:8000/api/health/live
```

### Desde PowerShell
```powershell
# Health completo
Invoke-WebRequest -Uri "http://localhost:8000/api/health" | Select-Object -ExpandProperty Content

# Health simple
Invoke-WebRequest -Uri "http://localhost:8000/api/health/simple" | Select-Object -ExpandProperty Content

# Readiness
Invoke-WebRequest -Uri "http://localhost:8000/api/health/ready" | Select-Object -ExpandProperty Content

# Liveness
Invoke-WebRequest -Uri "http://localhost:8000/api/health/live" | Select-Object -ExpandProperty Content
```

### Desde curl
```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/health/simple
curl http://localhost:8000/api/health/ready
curl http://localhost:8000/api/health/live
```

### Desde JavaScript/Frontend
```javascript
// Health completo
fetch('http://localhost:8000/api/health')
  .then(r => r.json())
  .then(console.log);

// Health simple (más rápido)
fetch('http://localhost:8000/api/health/simple')
  .then(r => r.json())
  .then(console.log);
```

## Casos de Uso

### Monitoreo Completo
Usa `/api/health` para:
- Dashboard de monitoreo
- Alertas de sistema
- Verificación manual completa

### Monitoreo Frecuente
Usa `/api/health/simple` para:
- Checks cada pocos segundos
- Monitoreo básico sin sobrecarga
- Verificación rápida de disponibilidad

### Kubernetes/Docker
- **Liveness Probe:** `/api/health/live`
- **Readiness Probe:** `/api/health/ready`

### Load Balancer
- **Health Check:** `/api/health/simple` o `/api/health/live`
- **Readiness Check:** `/api/health/ready`

## Estados

- **healthy**: Todo funciona correctamente
- **degraded**: Algunos componentes tienen problemas pero la API sigue funcionando
- **ready**: Listo para recibir tráfico
- **not_ready**: No listo (problemas críticos)
- **alive**: El proceso está vivo
- **ok**: Estado básico de funcionamiento

## Notas

- El endpoint `/api/health` puede ser más lento porque verifica múltiples componentes
- Los endpoints `/api/health/simple`, `/api/health/live` son muy rápidos
- El endpoint `/api/health/ready` verifica la conexión a BD, puede fallar si hay problemas de red o BD

