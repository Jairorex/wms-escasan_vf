import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Snowflake, Thermometer, AlertTriangle, Plus, Package } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import ProductoFormModal from './ProductoFormModal'

export default function RecepcionCadenaFriaModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const { success, error } = useNotification()
  const [showProductoModal, setShowProductoModal] = useState(false)

  const [formData, setFormData] = useState({
    proveedor: '',
    documento_proveedor: '',
    producto_id: '',
    cantidad: '',
    temperatura_recibida: '',
    codigo_lote: '',
    fecha_fabricacion: '',
    fecha_caducidad: '',
    subbodega_destino_id: '',
    observaciones: ''
  })

  const [tempWarning, setTempWarning] = useState(null)

  // Obtener productos que requieren temperatura
  const { data: productos = [], refetch: refetchProductos } = useQuery({
    queryKey: ['productos-temperatura'],
    queryFn: async () => {
      const response = await api.getProductos({ requiere_temperatura: true })
      return response.data || response || []
    },
    enabled: isOpen
  })

  // Callback cuando se crea un nuevo producto
  const handleProductoCreated = (nuevoProducto) => {
    if (nuevoProducto && nuevoProducto.id) {
      setFormData(prev => ({ ...prev, producto_id: nuevoProducto.id.toString() }))
      refetchProductos()
      success(`Producto "${nuevoProducto.nombre || 'Nuevo'}" creado exitosamente`)
    } else {
      refetchProductos()
      success('Producto creado exitosamente')
    }
  }

  // Obtener subbodegas de cadena fría
  const { data: subbodegas } = useQuery({
    queryKey: ['subbodegas-frias-modal'],
    queryFn: async () => {
      const response = await api.getSubbodegas({ tipo: 'CADENA_FRIA' })
      return response.data || []
    },
    enabled: isOpen
  })

  // Validar temperatura cuando cambia
  useEffect(() => {
    if (formData.producto_id && formData.temperatura_recibida) {
      const producto = productos?.find(p => p.id === parseInt(formData.producto_id))
      if (producto && producto.rango_min_temperatura !== null) {
        const temp = parseFloat(formData.temperatura_recibida)
        const min = producto.rango_min_temperatura
        const max = producto.rango_max_temperatura

        if (temp < min || temp > max) {
          setTempWarning({
            message: `Temperatura fuera del rango permitido (${min}°C - ${max}°C)`,
            severity: 'error'
          })
        } else if (temp === min || temp === max) {
          setTempWarning({
            message: `Temperatura en el límite del rango permitido`,
            severity: 'warning'
          })
        } else {
          setTempWarning(null)
        }
      }
    } else {
      setTempWarning(null)
    }
  }, [formData.producto_id, formData.temperatura_recibida, productos])

  const mutation = useMutation({
    mutationFn: async (data) => {
      return await api.createRecepcionCadenaFria(data)
    },
    onSuccess: () => {
      success('Recepción de cadena fría registrada exitosamente')
      queryClient.invalidateQueries(['recepciones-frias'])
      queryClient.invalidateQueries(['inventario'])
      handleClose()
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al registrar la recepción')
    }
  })

  const handleClose = () => {
    setFormData({
      proveedor: '',
      documento_proveedor: '',
      producto_id: '',
      cantidad: '',
      temperatura_recibida: '',
      codigo_lote: '',
      fecha_fabricacion: '',
      fecha_caducidad: '',
      subbodega_destino_id: '',
      observaciones: ''
    })
    setTempWarning(null)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.producto_id || !formData.cantidad || !formData.temperatura_recibida) {
      error('Completa todos los campos obligatorios')
      return
    }

    const producto = productos?.find(p => p.id === parseInt(formData.producto_id))
    const temp = parseFloat(formData.temperatura_recibida)
    
    // Validar si la temperatura está fuera de rango
    if (producto && producto.rango_min_temperatura !== null) {
      if (temp < producto.rango_min_temperatura || temp > producto.rango_max_temperatura) {
        if (!window.confirm('⚠️ La temperatura está fuera del rango permitido. El producto será marcado como RECHAZADO. ¿Desea continuar?')) {
          return
        }
      }
    }

    // Formatear datos según lo que espera el backend
    mutation.mutate({
      proveedor: formData.proveedor || null,
      documento_proveedor: formData.documento_proveedor || null,
      temperatura_recibida: parseFloat(formData.temperatura_recibida),
      subbodega_destino_id: formData.subbodega_destino_id ? parseInt(formData.subbodega_destino_id) : null,
      observaciones: formData.observaciones || null,
      productos: [
        {
          producto_id: parseInt(formData.producto_id),
          cantidad_esperada: parseFloat(formData.cantidad),
          lote_codigo: formData.codigo_lote || `LOT-${Date.now()}`,
          fecha_caducidad: formData.fecha_caducidad || null,
          fecha_fabricacion: formData.fecha_fabricacion || null,
          temperatura_producto: parseFloat(formData.temperatura_recibida)
        }
      ]
    })
  }

  return (
    <>
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Snowflake className="w-6 h-6 text-blue-600" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Nueva Recepción - Cadena Fría
                    </Dialog.Title>
                  </div>
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Alerta de temperatura */}
                  {tempWarning && (
                    <div className={`flex items-center gap-3 p-4 rounded-lg ${
                      tempWarning.severity === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        tempWarning.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                      <span className={tempWarning.severity === 'error' ? 'text-red-700' : 'text-yellow-700'}>
                        {tempWarning.message}
                      </span>
                    </div>
                  )}

                  {/* Proveedor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proveedor
                      </label>
                      <input
                        type="text"
                        value={formData.proveedor}
                        onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre del proveedor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Documento Proveedor
                      </label>
                      <input
                        type="text"
                        value={formData.documento_proveedor}
                        onChange={(e) => setFormData({ ...formData, documento_proveedor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="# Factura o guía"
                      />
                    </div>
                  </div>

                  {/* Producto y Temperatura */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Package className="inline w-4 h-4 mr-1" />
                        Producto <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={formData.producto_id}
                          onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Seleccionar producto...</option>
                          {productos.map((producto) => (
                            <option key={producto.id} value={producto.id}>
                              {producto.nombre} ({producto.sku})
                              {producto.temperatura_min !== null && 
                                ` [${producto.temperatura_min}°C - ${producto.temperatura_max}°C]`
                              }
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
                      <p className="mt-1 text-xs text-gray-500">
                        Si el producto no existe, créalo con el botón "Nuevo"
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Thermometer className="inline w-4 h-4 mr-1" />
                        Temperatura Recibida (°C) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.temperatura_recibida}
                        onChange={(e) => setFormData({ ...formData, temperatura_recibida: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                          tempWarning?.severity === 'error' 
                            ? 'border-red-300 focus:ring-red-500' 
                            : tempWarning?.severity === 'warning'
                            ? 'border-yellow-300 focus:ring-yellow-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Ej: -18.5"
                        required
                      />
                    </div>
                  </div>

                  {/* Cantidad y Subbodega */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Cantidad recibida"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subbodega Destino
                      </label>
                      <select
                        value={formData.subbodega_destino_id}
                        onChange={(e) => setFormData({ ...formData, subbodega_destino_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Asignar automáticamente</option>
                        {subbodegas?.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.nombre} ({sub.temperatura_min}°C - {sub.temperatura_max}°C)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Lote */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-gray-900">Información del Lote</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Código de Lote
                        </label>
                        <input
                          type="text"
                          value={formData.codigo_lote}
                          onChange={(e) => setFormData({ ...formData, codigo_lote: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="LOT-2024-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha Fabricación
                        </label>
                        <input
                          type="date"
                          value={formData.fecha_fabricacion}
                          onChange={(e) => setFormData({ ...formData, fecha_fabricacion: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha Caducidad
                        </label>
                        <input
                          type="date"
                          value={formData.fecha_caducidad}
                          onChange={(e) => setFormData({ ...formData, fecha_caducidad: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Notas adicionales sobre la recepción..."
                    />
                  </div>

                  {/* Buttons */}
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
                      disabled={mutation.isPending}
                      className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {mutation.isPending ? 'Registrando...' : 'Registrar Recepción'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>

    {/* Modal para crear nuevo producto */}
    <ProductoFormModal
      isOpen={showProductoModal}
      onClose={() => setShowProductoModal(false)}
      onSuccess={handleProductoCreated}
    />
  </>
  )
}

