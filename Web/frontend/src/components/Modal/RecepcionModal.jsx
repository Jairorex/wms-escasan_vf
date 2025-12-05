import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Inbox, Package, Calendar, Hash, Plus, MapPin, Tag, User, FileText, Warehouse } from 'lucide-react'
import Modal from './Modal'
import LoteFormModal from './LoteFormModal'
import ProductoFormModal from './ProductoFormModal'
import UbicacionFormModal from './UbicacionFormModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function RecepcionModal({ isOpen, onClose, ordenId = null }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const [crearOrden, setCrearOrden] = useState(!ordenId)
  const [showLoteModal, setShowLoteModal] = useState(false)
  const [showProductoModal, setShowProductoModal] = useState(false)
  const [showUbicacionModal, setShowUbicacionModal] = useState(false)
  const [usarLoteExistente, setUsarLoteExistente] = useState(false)
  const [formData, setFormData] = useState({
    orden_compra_id: ordenId || '',
    numero_orden: '',
    proveedor: '',
    documento_proveedor: '',
    producto_id: '',
    lote_id: '',
    codigo_lote: '',
    fecha_caducidad: '',
    fecha_fabricacion: '',
    cantidad: '',
    subbodega_id: '',
    ubicacion_id: '',
    observaciones: ''
  })

  // Cargar productos
  const { data: productos = [] } = useQuery({
    queryKey: ['productos-para-recepcion'],
    queryFn: () => api.getProductos(),
    enabled: isOpen,
  })

  // Cargar subbodegas
  const { data: subbodegasResponse, isLoading: loadingSubbodegas } = useQuery({
    queryKey: ['subbodegas-para-recepcion'],
    queryFn: async () => {
      const result = await api.getSubbodegas()
      // Asegurarse de que siempre devolvemos un array
      return Array.isArray(result) ? result : (result?.data || [])
    },
    enabled: isOpen,
  })
  
  // Extraer el array de subbodegas del response
  const subbodegas = Array.isArray(subbodegasResponse) ? subbodegasResponse : (subbodegasResponse?.data || [])

  // Cargar ubicaciones (filtradas por subbodega si está seleccionada)
  const { data: ubicacionesResponse, refetch: refetchUbicaciones } = useQuery({
    queryKey: ['ubicaciones-para-recepcion', formData.subbodega_id],
    queryFn: () => api.getUbicaciones({ subbodega_id: formData.subbodega_id || undefined }),
    enabled: isOpen,
  })
  
  // Extraer el array de ubicaciones del response
  const ubicaciones = Array.isArray(ubicacionesResponse) 
    ? ubicacionesResponse 
    : (ubicacionesResponse?.data || ubicacionesResponse || [])

  // Filtrar ubicaciones por subbodega seleccionada
  const ubicacionesFiltradas = formData.subbodega_id 
    ? ubicaciones.filter(u => u.subbodega_id == formData.subbodega_id)
    : ubicaciones

  // Cargar lotes del producto seleccionado
  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes-producto', formData.producto_id],
    queryFn: () => api.getLotes({ producto_id: formData.producto_id }),
    enabled: isOpen && !!formData.producto_id && usarLoteExistente,
  })

  // Obtener subbodega sugerida cuando se selecciona un producto
  const { data: subbodegaSugeridaData } = useQuery({
    queryKey: ['subbodega-sugerida', formData.producto_id],
    queryFn: () => api.getSubbodegaSugerida(formData.producto_id),
    enabled: isOpen && !!formData.producto_id,
  })

  useEffect(() => {
    if (ordenId) {
      setFormData(prev => ({ ...prev, orden_compra_id: ordenId }))
      setCrearOrden(false)
    }
  }, [ordenId])

  // Preseleccionar subbodega cuando se obtiene la sugerida
  useEffect(() => {
    if (subbodegaSugeridaData?.data?.subbodega_optima && !formData.subbodega_id) {
      setFormData(prev => ({
        ...prev,
        subbodega_id: subbodegaSugeridaData.data.subbodega_optima.id.toString()
      }))
    }
  }, [subbodegaSugeridaData])

  const mutation = useMutation({
    mutationFn: (data) => api.receiveProduct(data),
    onSuccess: () => {
      success('Mercancía recibida exitosamente')
      queryClient.invalidateQueries({ queryKey: ['tareas-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
      queryClient.invalidateQueries({ queryKey: ['lotes'] })
      handleClose()
    },
    onError: (error) => {
      showError('Error al recibir mercancía: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleClose = () => {
    setFormData({
      orden_compra_id: ordenId || '',
      numero_orden: '',
      proveedor: '',
      documento_proveedor: '',
      producto_id: '',
      lote_id: '',
      codigo_lote: '',
      fecha_caducidad: '',
      fecha_fabricacion: '',
      cantidad: '',
      subbodega_id: '',
      ubicacion_id: '',
      observaciones: ''
    })
    setCrearOrden(!ordenId)
    setUsarLoteExistente(false)
    onClose()
  }

  // Callback cuando se crea un nuevo producto
  const handleProductoCreated = (nuevoProducto) => {
    if (nuevoProducto && nuevoProducto.id) {
      setFormData(prev => ({ ...prev, producto_id: nuevoProducto.id.toString() }))
      queryClient.invalidateQueries({ queryKey: ['productos-para-recepcion'] })
      success(`Producto "${nuevoProducto.nombre || 'Nuevo'}" creado exitosamente`)
    } else {
      // Si no viene el producto, solo refrescamos la lista
      queryClient.invalidateQueries({ queryKey: ['productos-para-recepcion'] })
      success('Producto creado exitosamente')
    }
  }

  // Callback cuando se crea una nueva ubicación
  const handleUbicacionCreated = (nuevaUbicacion) => {
    if (nuevaUbicacion && nuevaUbicacion.id) {
      setFormData(prev => ({ ...prev, ubicacion_id: nuevaUbicacion.id.toString() }))
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-para-recepcion'] })
      refetchUbicaciones()
      success(`Ubicación "${nuevaUbicacion.codigo || 'Nueva'}" creada exitosamente`)
    } else {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-para-recepcion'] })
      refetchUbicaciones()
      success('Ubicación creada exitosamente')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validar que hay subbodega
    if (!formData.subbodega_id) {
      showError('Debes seleccionar una subbodega de destino')
      return
    }

    // Validar que hay ubicación o al menos una disponible
    if (!formData.ubicacion_id && ubicacionesFiltradas.length === 0) {
      showError('No hay ubicaciones en esta subbodega. Crea una nueva ubicación primero.')
      return
    }
    
    const data = {
      producto_id: parseInt(formData.producto_id),
      cantidad: parseFloat(formData.cantidad),
      subbodega_id: parseInt(formData.subbodega_id)
    }

    // Ubicación sugerida
    if (formData.ubicacion_id) {
      data.ubicacion_sugerida_id = parseInt(formData.ubicacion_id)
    }

    // Lote: usar existente o crear nuevo
    if (usarLoteExistente && formData.lote_id) {
      data.lote_id = parseInt(formData.lote_id)
    } else {
      data.codigo_lote = formData.codigo_lote
      data.fecha_caducidad = formData.fecha_caducidad
      data.fecha_fabricacion = formData.fecha_fabricacion || null
    }

    // Orden
    if (!crearOrden && formData.orden_compra_id) {
      data.orden_compra_id = parseInt(formData.orden_compra_id)
    } else if (crearOrden && formData.numero_orden) {
      data.numero_orden = formData.numero_orden
    }

    // Proveedor y documento
    if (formData.proveedor) {
      data.proveedor = formData.proveedor
    }
    if (formData.documento_proveedor) {
      data.documento_proveedor = formData.documento_proveedor
    }
    if (formData.observaciones) {
      data.observaciones = formData.observaciones
    }

    mutation.mutate(data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Si cambia el producto, limpiar lote
    if (name === 'producto_id') {
      setFormData(prev => ({ ...prev, lote_id: '', codigo_lote: '', fecha_caducidad: '', fecha_fabricacion: '' }))
    }
  }

  const handleLoteCreated = (nuevoLote) => {
    setFormData(prev => ({
      ...prev,
      lote_id: nuevoLote.id,
      codigo_lote: nuevoLote.codigo_lote
    }))
    setUsarLoteExistente(true)
    queryClient.invalidateQueries({ queryKey: ['lotes'] })
    queryClient.invalidateQueries({ queryKey: ['lotes-producto', formData.producto_id] })
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Recepción de Mercancía"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Opción: Crear orden o usar existente */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={crearOrden}
                  onChange={(e) => setCrearOrden(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Crear nueva orden de compra</span>
              </label>
            </div>

            {/* Información del Proveedor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Proveedor
                </label>
                <input
                  type="text"
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  placeholder="Nombre del proveedor"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Documento
                </label>
                <input
                  type="text"
                  name="documento_proveedor"
                  value={formData.documento_proveedor}
                  onChange={handleChange}
                  placeholder="# Factura o guía"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {crearOrden ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Número de Orden
                </label>
                <input
                  type="text"
                  name="numero_orden"
                  value={formData.numero_orden}
                  onChange={handleChange}
                  placeholder="ORD-2024-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Si no se especifica, se generará automáticamente</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  ID Orden de Compra
                </label>
                <input
                  type="number"
                  name="orden_compra_id"
                  value={formData.orden_compra_id}
                  onChange={handleChange}
                  disabled={!!ordenId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            )}

            {/* Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Producto *
              </label>
              <div className="flex gap-2">
                <select
                  name="producto_id"
                  value={formData.producto_id}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowProductoModal(true)}
                  className="px-3 py-2 bg-escasan-green-500 text-white rounded-lg hover:bg-escasan-green-600 transition-colors flex items-center gap-1"
                  title="Crear nuevo producto"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Si el producto no existe, créalo con el botón "Nuevo"</p>
            </div>

            {/* Opción: Usar lote existente o crear nuevo */}
            {formData.producto_id && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarLoteExistente}
                    onChange={(e) => {
                      setUsarLoteExistente(e.target.checked)
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, lote_id: '' }))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Usar lote existente</span>
                </label>
              </div>
            )}

            {/* Lote Existente o Nuevo */}
            {formData.producto_id && (
              <>
                {usarLoteExistente ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Lote *
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="lote_id"
                        value={formData.lote_id}
                        onChange={handleChange}
                        required
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Selecciona un lote</option>
                        {lotes.map((lote) => (
                          <option key={lote.id} value={lote.id}>
                            {lote.codigo_lote} - Vence: {new Date(lote.fecha_caducidad).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowLoteModal(true)}
                        className="px-3 py-2 bg-escasan-green-500 text-white rounded-lg hover:bg-escasan-green-600 transition-colors flex items-center gap-1"
                        title="Crear nuevo lote"
                      >
                        <Plus className="w-4 h-4" />
                        Nuevo
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Código de Lote Nuevo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Tag className="w-4 h-4 inline mr-1" />
                        Código de Lote *
                      </label>
                      <input
                        type="text"
                        name="codigo_lote"
                        value={formData.codigo_lote}
                        onChange={handleChange}
                        required
                        placeholder="LOTE-2024-001"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Fecha de Fabricación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Fecha de Fabricación
                      </label>
                      <input
                        type="date"
                        name="fecha_fabricacion"
                        value={formData.fecha_fabricacion}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Fecha de Caducidad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Fecha de Caducidad *
                      </label>
                      <input
                        type="date"
                        name="fecha_caducidad"
                        value={formData.fecha_caducidad}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                required
                min="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Sección Bodega y Ubicación */}
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-escasan-green-500" />
                Destino del Producto
              </h4>

              {/* Subbodega */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subbodega / Zona *
                  {subbodegaSugeridaData?.data?.subbodega_optima && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      (Sugerida automáticamente)
                    </span>
                  )}
                </label>
                <select
                  name="subbodega_id"
                  value={formData.subbodega_id}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      subbodega_id: e.target.value,
                      ubicacion_id: '' // Limpiar ubicación al cambiar subbodega
                    }))
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Selecciona una subbodega</option>
                  {(Array.isArray(subbodegas) ? subbodegas : []).map((sub) => {
                    const esSugerida = subbodegaSugeridaData?.data?.subbodega_optima?.id === sub.id
                    return (
                      <option key={sub.id} value={sub.id}>
                        {sub.nombre} ({sub.tipo})
                        {sub.temperatura_min !== null ? ` [${sub.temperatura_min}°C - ${sub.temperatura_max}°C]` : ''}
                        {esSugerida ? ' ⭐ Sugerida' : ''}
                      </option>
                    )
                  })}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {subbodegaSugeridaData?.data?.subbodega_optima 
                    ? `Sugerida automáticamente por categoría de riesgo e índice de rotación del producto`
                    : 'Selecciona la subbodega donde se almacenará el producto'}
                </p>
              </div>

              {/* Ubicación - solo si hay subbodega seleccionada */}
              {formData.subbodega_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Ubicación Específica
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="ubicacion_id"
                      value={formData.ubicacion_id}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Sistema asignará automáticamente</option>
                      {ubicacionesFiltradas.map((ub) => (
                        <option key={ub.id} value={ub.id}>
                          {ub.codigo} - {ub.tipo_ubicacion?.nombre || ub.tipo || 'Rack'}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowUbicacionModal(true)}
                      className="px-3 py-2 bg-escasan-green-500 text-white rounded-lg hover:bg-escasan-green-600 transition-colors flex items-center gap-1"
                      title="Crear nueva ubicación"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva
                    </button>
                  </div>
                  {ubicacionesFiltradas.length === 0 && (
                    <p className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                      ⚠️ No hay ubicaciones en esta subbodega. Crea una nueva ubicación para continuar.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={2}
              placeholder="Notas adicionales sobre la recepción..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="text-xs text-gray-600 bg-green-50 border border-green-200 p-3 rounded-lg">
            <strong>✓ Al recibir mercancía:</strong>
            <ul className="mt-1 ml-4 list-disc">
              <li>Se crea el lote automáticamente</li>
              <li>Se actualiza el inventario con la cantidad recibida</li>
              <li>Se crea una tarea PUTAWAY para ubicar el producto</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-cancel-500 text-white rounded-lg hover:bg-cancel-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isLoading ? 'Procesando...' : 'Recibir Mercancía'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para crear nuevo lote */}
      <LoteFormModal
        isOpen={showLoteModal}
        onClose={() => setShowLoteModal(false)}
        productoIdPredefinido={parseInt(formData.producto_id)}
        onSuccess={handleLoteCreated}
      />

      {/* Modal para crear nuevo producto */}
      <ProductoFormModal
        isOpen={showProductoModal}
        onClose={() => setShowProductoModal(false)}
        onSuccess={handleProductoCreated}
      />

      {/* Modal para crear nueva ubicación */}
      <UbicacionFormModal
        isOpen={showUbicacionModal}
        onClose={() => setShowUbicacionModal(false)}
        subbodegaIdPredefinida={formData.subbodega_id ? parseInt(formData.subbodega_id) : null}
        onSuccess={handleUbicacionCreated}
      />
    </>
  )
}
