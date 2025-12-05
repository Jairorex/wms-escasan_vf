import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptor para agregar token de autenticación (cuando se implemente)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Log de peticiones (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, config.data || config.params)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => {
    // Log de respuestas exitosas (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status, response.data)
    }
    return response
  },
  (error) => {
    // Log de errores (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status, error.response?.data || error.message)
    }
    if (error.response?.status === 401) {
      // Redirigir a login si no está autenticado
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const api = {
  // Health Check - Completo
  health: async () => {
    const response = await apiClient.get('/health')
    return response.data
  },

  // Health Check - Simple (más rápido)
  healthSimple: async () => {
    const response = await apiClient.get('/health/simple')
    return response.data
  },

  // Health Check - Ready
  healthReady: async () => {
    const response = await apiClient.get('/health/ready')
    return response.data
  },

  // Health Check - Live
  healthLive: async () => {
    const response = await apiClient.get('/health/live')
    return response.data
  },

  // Autenticación
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  changePassword: async (data) => {
    const response = await apiClient.post('/auth/change-password', data)
    return response.data
  },

  // Tareas
  getTasks: async (params = {}) => {
    const response = await apiClient.get('/tasks', { params })
    return response.data.data || []
  },

  getTask: async (id) => {
    const response = await apiClient.get(`/tasks/${id}`)
    return response.data.data || response.data
  },

  asignarTarea: async (tareaId, operarioId) => {
    const response = await apiClient.post(`/tasks/${tareaId}/assign`, {
      usuario_id: operarioId
    })
    return response.data
  },

  validateScan: async (data) => {
    const response = await apiClient.post('/tasks/validate-scan', data)
    return response.data
  },

  // Inbound (Recepción)
  receiveProduct: async (data) => {
    const response = await apiClient.post('/inbound/receive', data)
    return response.data
  },

  createOrdenCompra: async (data) => {
    const response = await apiClient.post('/inbound/orden', data)
    return response.data
  },

  // Outbound (Picking/Salida)
  preparePicking: async (data) => {
    const response = await apiClient.post('/outbound/prepare', data)
    return response.data
  },

  createOrdenVenta: async (data) => {
    const response = await apiClient.post('/outbound/orden', data)
    return response.data
  },

  // Alertas
  getAlertas: async (params = {}) => {
    try {
      const response = await apiClient.get('/alertas', { params })
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data
      }
      if (Array.isArray(response.data)) {
        return response.data
      }
      if (Array.isArray(response.data?.data)) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Error al obtener alertas:', error)
      return []
    }
  },

  getAlerta: async (id) => {
    const response = await apiClient.get(`/alertas/${id}`)
    return response.data.data || response.data
  },

  resolverAlerta: async (id) => {
    const response = await apiClient.post(`/alertas/${id}/resolver`)
    return response.data
  },

  generarAlertasVencimientos: async (diasAnticipacion = 30) => {
    const response = await apiClient.post('/alertas/generar/vencimientos', { dias_anticipacion: diasAnticipacion })
    return response.data
  },

  generarAlertasSinUbicacion: async () => {
    const response = await apiClient.post('/alertas/generar/sin-ubicacion')
    return response.data
  },

  generarTodasLasAlertas: async (diasAnticipacion = 30) => {
    const response = await apiClient.post('/alertas/generar/todas', { dias_anticipacion: diasAnticipacion })
    return response.data
  },

  // Inventario
  getInventario: async (params = {}) => {
    try {
      const response = await apiClient.get('/inventario', { params })
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data
      }
      if (Array.isArray(response.data)) {
        return response.data
      }
      if (Array.isArray(response.data?.data)) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Error al obtener inventario:', error)
      return []
    }
  },

  getInventarioItem: async (id) => {
    const response = await apiClient.get(`/inventario/${id}`)
    return response.data.data || response.data
  },

  createInventario: async (data) => {
    const response = await apiClient.post('/inventario', data)
    return response.data
  },

  updateInventario: async (id, data) => {
    const response = await apiClient.put(`/inventario/${id}`, data)
    return response.data
  },

  deleteInventario: async (id) => {
    const response = await apiClient.delete(`/inventario/${id}`)
    return response.data
  },

  getStockPorProducto: async (productoId) => {
    const response = await apiClient.get(`/inventario/producto/${productoId}/stock`)
    return response.data.data || response.data
  },

  getInventarioPorUbicacion: async (ubicacionId) => {
    const response = await apiClient.get(`/inventario/ubicacion/${ubicacionId}`)
    return response.data.data || response.data
  },

  getInventarioItem: async (id) => {
    const response = await apiClient.get(`/inventario/${id}`)
    return response.data.data || response.data
  },

  // Tareas - CRUD
  createTask: async (data) => {
    const response = await apiClient.post('/tasks', data)
    return response.data
  },

  startTask: async (id) => {
    const response = await apiClient.post(`/tasks/${id}/start`)
    return response.data
  },

  completeTask: async (id) => {
    const response = await apiClient.post(`/tasks/${id}/complete`)
    return response.data
  },

  // KPIs de Tareas
  getTareasKpis: async (params = {}) => {
    const response = await apiClient.get('/tareas/kpis', { params })
    return response.data
  },

  // Supervisores
  getSupervisoresStats: async () => {
    const response = await apiClient.get('/supervisores/stats')
    return response.data
  },

  getOperariosBySupervisor: async (supervisorId) => {
    const response = await apiClient.get(`/supervisores/${supervisorId}/operarios`)
    return response.data
  },

  asignarOperario: async (supervisorId, operarioId) => {
    const response = await apiClient.post(`/supervisores/${supervisorId}/operarios/${operarioId}`)
    return response.data
  },

  updateTask: async (id, data) => {
    const response = await apiClient.put(`/tasks/${id}`, data)
    return response.data
  },

  // Productos - CRUD
  getProductos: async (params = {}) => {
    try {
      const response = await apiClient.get('/productos', { params })
      // El backend devuelve { success: true, data: [...] }
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data
      }
      // Fallback: si viene directamente como array
      if (Array.isArray(response.data)) {
        return response.data
      }
      // Fallback: si viene en response.data.data
      if (Array.isArray(response.data?.data)) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Error al obtener productos:', error)
      return []
    }
  },

  getProducto: async (id) => {
    const response = await apiClient.get(`/productos/${id}`)
    return response.data.data || response.data
  },

  createProducto: async (data) => {
    const response = await apiClient.post('/productos', data)
    return response.data
  },

  updateProducto: async (id, data) => {
    const response = await apiClient.put(`/productos/${id}`, data)
    return response.data
  },

  deleteProducto: async (id) => {
    const response = await apiClient.delete(`/productos/${id}`)
    return response.data
  },

  // Ubicaciones - CRUD
  getUbicaciones: async (params = {}) => {
    const response = await apiClient.get('/ubicaciones', { params })
    return response.data.data || response.data || []
  },

  getUbicacion: async (id) => {
    const response = await apiClient.get(`/ubicaciones/${id}`)
    return response.data.data || response.data
  },

  createUbicacion: async (data) => {
    const response = await apiClient.post('/ubicaciones', data)
    return response.data
  },

  updateUbicacion: async (id, data) => {
    const response = await apiClient.put(`/ubicaciones/${id}`, data)
    return response.data
  },

  deleteUbicacion: async (id) => {
    const response = await apiClient.delete(`/ubicaciones/${id}`)
    return response.data
  },

  // Tipos de Ubicación
  getTiposUbicacion: async () => {
    const response = await apiClient.get('/tipos-ubicacion')
    return response.data.data || response.data || []
  },

  createTipoUbicacion: async (nombre) => {
    const response = await apiClient.post('/tipos-ubicacion', { nombre })
    return response.data.data || response.data
  },

  // Clasificaciones
  getClasificaciones: async () => {
    const response = await apiClient.get('/clasificaciones')
    return response.data.data || response.data || []
  },

  createClasificacion: async (nombre) => {
    const response = await apiClient.post('/clasificaciones', { nombre })
    return response.data.data || response.data
  },

  // Tipos de Producto
  getTiposProducto: async () => {
    const response = await apiClient.get('/tipos-producto')
    return response.data.data || response.data || []
  },

  createTipoProducto: async (nombre) => {
    const response = await apiClient.post('/tipos-producto', { nombre })
    return response.data.data || response.data
  },

  // Lotes - CRUD
  getLotes: async (params = {}) => {
    try {
      const response = await apiClient.get('/lotes', { params })
      // El backend devuelve { success: true, data: [...] }
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data
      }
      // Fallback: si viene directamente como array
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data }
      }
      // Fallback: si viene con data anidado
      if (Array.isArray(response.data?.data)) {
        return { success: true, data: response.data.data }
      }
      return { success: false, data: [] }
    } catch (error) {
      console.error('Error al obtener lotes:', error)
      return { success: false, data: [], error: error.message }
    }
  },

  getLote: async (id) => {
    const response = await apiClient.get(`/lotes/${id}`)
    return response.data.data || response.data
  },

  createLote: async (data) => {
    const response = await apiClient.post('/lotes', data)
    return response.data
  },

  updateLote: async (id, data) => {
    const response = await apiClient.put(`/lotes/${id}`, data)
    return response.data
  },

  deleteLote: async (id) => {
    const response = await apiClient.delete(`/lotes/${id}`)
    return response.data
  },

  // Usuarios
  getUsuarios: async (params = {}) => {
    const response = await apiClient.get('/usuarios', { params })
    return response.data.data || response.data || []
  },

  getUsuario: async (id) => {
    const response = await apiClient.get(`/usuarios/${id}`)
    return response.data.data || response.data
  },

  createUsuario: async (data) => {
    const response = await apiClient.post('/usuarios', data)
    return response.data
  },

  updateUsuario: async (id, data) => {
    const response = await apiClient.put(`/usuarios/${id}`, data)
    return response.data
  },

  deleteUsuario: async (id) => {
    const response = await apiClient.delete(`/usuarios/${id}`)
    return response.data
  },

  // Roles
  getRoles: async () => {
    const response = await apiClient.get('/roles')
    return response.data.data || response.data || []
  },

  // ============================================
  // NUEVOS MÓDULOS WMS v2.0
  // ============================================

  // Subbodegas
  getSubbodegas: async (params = {}) => {
    try {
      const response = await apiClient.get('/subbodegas', { params })
      // El backend devuelve { success: true, data: [...] }
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data
      }
      // Fallback: si viene directamente como array
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data }
      }
      // Fallback: si viene con data anidado
      if (Array.isArray(response.data?.data)) {
        return { success: true, data: response.data.data }
      }
      return { success: false, data: [] }
    } catch (error) {
      console.error('Error al obtener subbodegas:', error)
      return { success: false, data: [], error: error.message }
    }
  },

  getSubbodega: async (id) => {
    const response = await apiClient.get(`/subbodegas/${id}`)
    return response.data
  },

  createSubbodega: async (data) => {
    const response = await apiClient.post('/subbodegas', data)
    return response.data
  },

  updateSubbodega: async (id, data) => {
    const response = await apiClient.put(`/subbodegas/${id}`, data)
    return response.data
  },

  deleteSubbodega: async (id) => {
    const response = await apiClient.delete(`/subbodegas/${id}`)
    return response.data
  },

      getTiposSubbodega: async () => {
        const response = await apiClient.get('/subbodegas/tipos')
        return response.data.data || response.data || []
      },

      getSubbodegaSugerida: async (productoId) => {
        const response = await apiClient.get(`/subbodegas/sugerida/${productoId}`)
        return response.data
      },

  getUbicacionesSubbodega: async (id) => {
    const response = await apiClient.get(`/subbodegas/${id}/ubicaciones`)
    return response.data.data || response.data || []
  },

  asignarUbicacionSubbodega: async (subbodegaId, ubicacionId) => {
    const response = await apiClient.post(`/subbodegas/${subbodegaId}/ubicaciones`, { ubicacion_id: ubicacionId })
    return response.data
  },

  registrarTemperaturaSubbodega: async (id, data) => {
    const response = await apiClient.post(`/subbodegas/${id}/temperatura`, data)
    return response.data
  },

  // Recepciones
  getRecepciones: async (params = {}) => {
    const response = await apiClient.get('/recepciones', { params })
    return response.data.data || response.data || []
  },

  getRecepcion: async (id) => {
    const response = await apiClient.get(`/recepciones/${id}`)
    return response.data
  },

  crearRecepcionEstandar: async (data) => {
    const response = await apiClient.post('/recepciones/estandar', data)
    return response.data
  },

  crearRecepcionCadenaFria: async (data) => {
    const response = await apiClient.post('/recepciones/cadena-fria', data)
    return response.data
  },

  aprobarRecepcionExcepcion: async (id, data) => {
    const response = await apiClient.post(`/recepciones/${id}/aprobar-excepcion`, data)
    return response.data
  },

  rechazarRecepcion: async (id, data) => {
    const response = await apiClient.post(`/recepciones/${id}/rechazar`, data)
    return response.data
  },

  getEstadisticasRecepciones: async (params = {}) => {
    const response = await apiClient.get('/recepciones/estadisticas', { params })
    return response.data.data || response.data
  },

  // Reabastecimientos
  getReabastecimientos: async (params = {}) => {
    const response = await apiClient.get('/reabastecimientos', { params })
    return response.data
  },

  getReabastecimiento: async (id) => {
    const response = await apiClient.get(`/reabastecimientos/${id}`)
    return response.data
  },

  crearReabastecimiento: async (data) => {
    const response = await apiClient.post('/reabastecimientos', data)
    return response.data
  },

  aprobarReabastecimiento: async (id, data = {}) => {
    const response = await apiClient.post(`/reabastecimientos/${id}/aprobar`, data)
    return response.data
  },

  ejecutarReabastecimiento: async (id) => {
    const response = await apiClient.post(`/reabastecimientos/${id}/ejecutar`)
    return response.data
  },

  completarReabastecimiento: async (id) => {
    const response = await apiClient.post(`/reabastecimientos/${id}/completar`)
    return response.data
  },

  cancelarReabastecimiento: async (id, motivo) => {
    const response = await apiClient.post(`/reabastecimientos/${id}/cancelar`, { motivo })
    return response.data
  },

  verificarStockMinimo: async () => {
    const response = await apiClient.post('/reabastecimientos/verificar-stock')
    return response.data
  },

  generarReabastecimientosProgramados: async () => {
    const response = await apiClient.post('/reabastecimientos/generar-programados')
    return response.data
  },

  getEstadisticasReabastecimientos: async (params = {}) => {
    const response = await apiClient.get('/reabastecimientos/estadisticas', { params })
    return response.data.data || response.data
  },

  // Categorías de Riesgo
  getCategoriasRiesgo: async () => {
    const response = await apiClient.get('/categorias-riesgo')
    return response.data.data || response.data || []
  },

  createCategoriaRiesgo: async (data) => {
    const response = await apiClient.post('/categorias-riesgo', data)
    return response.data
  },

  updateCategoriaRiesgo: async (id, data) => {
    const response = await apiClient.put(`/categorias-riesgo/${id}`, data)
    return response.data
  },

  // Reglas de Compatibilidad
  getReglasCompatibilidad: async (params = {}) => {
    const response = await apiClient.get('/reglas-compatibilidad', { params })
    return response.data.data || response.data || []
  },

  createReglaCompatibilidad: async (data) => {
    const response = await apiClient.post('/reglas-compatibilidad', data)
    return response.data
  },

  updateReglaCompatibilidad: async (id, data) => {
    const response = await apiClient.put(`/reglas-compatibilidad/${id}`, data)
    return response.data
  },

  deleteReglaCompatibilidad: async (id) => {
    const response = await apiClient.delete(`/reglas-compatibilidad/${id}`)
    return response.data
  },

  // ============================================
  // CONTROL DE TEMPERATURA
  // ============================================

  // Lecturas de temperatura
  getLecturasTemperatura: async (params = {}) => {
    try {
      const response = await apiClient.get('/temperaturas/lecturas', { params })
      // El backend devuelve { success: true, data: [...] }
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data
      }
      // Fallback: si viene directamente como array
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data }
      }
      // Fallback: si viene con data anidado
      if (Array.isArray(response.data?.data)) {
        return { success: true, data: response.data.data }
      }
      return { success: false, data: [] }
    } catch (error) {
      console.error('Error al obtener lecturas de temperatura:', error)
      return { success: false, data: [], error: error.message }
    }
  },

  registrarTemperatura: async (data) => {
    const response = await apiClient.post('/temperaturas/registrar', data)
    return response.data
  },

  getHistorialTemperatura: async (subbodegaId, params = {}) => {
    const response = await apiClient.get(`/temperaturas/historial/${subbodegaId}`, { params })
    return response.data.data || response.data || []
  },

  // Recepción cadena fría (alias más claro)
  createRecepcionCadenaFria: async (data) => {
    const response = await apiClient.post('/recepciones/cadena-fria', data)
    return response.data
  },

  // ============================================
  // MOVIMIENTOS DE INVENTARIO
  // ============================================

  getMovimientos: async (params = {}) => {
    const response = await apiClient.get('/movimientos', { params })
    return response.data.data || response.data || []
  },

  createMovimiento: async (data) => {
    const response = await apiClient.post('/movimientos', data)
    return response.data
  },

  // ============================================
  // CÓDIGOS DE BARRAS / ETIQUETAS
  // ============================================

  generateBarcode: async (loteId) => {
    const response = await apiClient.post(`/lotes/${loteId}/generate-barcode`)
    return response.data
  },

  printEtiquetas: async (loteIds) => {
    const response = await apiClient.post('/lotes/print-etiquetas', { lote_ids: loteIds })
    return response.data
  },
}

export default api
