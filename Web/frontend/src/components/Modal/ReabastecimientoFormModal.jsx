import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { useNotification } from '../../contexts/NotificationContext'

export default function ReabastecimientoFormModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()

  const [formData, setFormData] = useState({
    subbodega_origen_id: '',
    subbodega_destino_id: '',
    prioridad: 'MEDIA',
    observaciones: ''
  })

  const [productos, setProductos] = useState([
    { producto_id: '', cantidad: '', lote_id: '' }
  ])

  // Obtener subbodegas
  const { data: subbodegasData } = useQuery({
    queryKey: ['subbodegas'],
    queryFn: async () => {
      const response = await api.getSubbodegas()
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        return response
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data
      }
      if (response?.success && Array.isArray(response.data)) {
        return response.data
      }
      return []
    },
    enabled: isOpen
  })

  // Extraer array de subbodegas
  const subbodegas = Array.isArray(subbodegasData) ? subbodegasData : (subbodegasData?.data || [])

  // Obtener productos
  const { data: productosData } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await api.getProductos()
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        return response
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data
      }
      return []
    },
    enabled: isOpen
  })

  // Extraer array de productos
  const productosLista = Array.isArray(productosData) ? productosData : (productosData?.data || [])

  // Obtener lotes
  const { data: lotesData } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      const response = await api.getLotes()
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        return response
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data
      }
      if (response?.success && Array.isArray(response.data)) {
        return response.data
      }
      return []
    },
    enabled: isOpen
  })

  // Extraer array de lotes
  const lotes = Array.isArray(lotesData) ? lotesData : (lotesData?.data || [])

  const mutation = useMutation({
    mutationFn: (data) => api.crearReabastecimiento(data),
    onSuccess: () => {
      success('Reabastecimiento creado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['reabastecimientos'] })
      handleClose()
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleClose = () => {
    setFormData({
      subbodega_origen_id: '',
      subbodega_destino_id: '',
      prioridad: 'MEDIA',
      observaciones: ''
    })
    setProductos([{ producto_id: '', cantidad: '', lote_id: '' }])
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validar productos
    const productosValidos = productos.filter(p => p.producto_id && p.cantidad)
    if (productosValidos.length === 0) {
      showError('Debe agregar al menos un producto')
      return
    }

    if (!formData.subbodega_origen_id || !formData.subbodega_destino_id) {
      showError('Debe seleccionar subbodega origen y destino')
      return
    }

    if (formData.subbodega_origen_id === formData.subbodega_destino_id) {
      showError('La subbodega origen y destino deben ser diferentes')
      return
    }

    const data = {
      ...formData,
      subbodega_origen_id: parseInt(formData.subbodega_origen_id),
      subbodega_destino_id: parseInt(formData.subbodega_destino_id),
      productos: productosValidos.map(p => ({
        producto_id: parseInt(p.producto_id),
        cantidad: parseFloat(p.cantidad),
        lote_id: p.lote_id ? parseInt(p.lote_id) : null
      }))
    }

    mutation.mutate(data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProductoChange = (index, field, value) => {
    const newProductos = [...productos]
    newProductos[index][field] = value
    setProductos(newProductos)
  }

  const addProducto = () => {
    setProductos([...productos, { producto_id: '', cantidad: '', lote_id: '' }])
  }

  const removeProducto = (index) => {
    if (productos.length > 1) {
      setProductos(productos.filter((_, i) => i !== index))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Reabastecimiento"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subbodegas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subbodega Origen *
            </label>
            <select
              name="subbodega_origen_id"
              value={formData.subbodega_origen_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500"
            >
              <option value="">Seleccionar origen</option>
              {subbodegas.map(sb => (
                <option key={sb.id} value={sb.id}>{sb.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subbodega Destino *
            </label>
            <select
              name="subbodega_destino_id"
              value={formData.subbodega_destino_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500"
            >
              <option value="">Seleccionar destino</option>
              {subbodegas.map(sb => (
                <option key={sb.id} value={sb.id}>{sb.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prioridad
          </label>
          <select
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500"
          >
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        {/* Productos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Productos *
            </label>
            <button
              type="button"
              onClick={addProducto}
              className="flex items-center gap-1 text-sm text-escasan-green-600 hover:text-escasan-green-700"
            >
              <Plus className="w-4 h-4" />
              Agregar producto
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {productos.map((prod, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={prod.producto_id}
                  onChange={(e) => handleProductoChange(index, 'producto_id', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 text-sm"
                >
                  <option value="">Producto</option>
                  {productosLista.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.nombre}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={prod.cantidad}
                  onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                  placeholder="Cantidad"
                  min="0.01"
                  step="0.01"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 text-sm"
                />
                <select
                  value={prod.lote_id}
                  onChange={(e) => handleProductoChange(index, 'lote_id', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 text-sm"
                >
                  <option value="">Lote (opc)</option>
                  {lotes
                    .filter(l => !prod.producto_id || l.producto_id === parseInt(prod.producto_id))
                    .map(l => (
                      <option key={l.id} value={l.id}>{l.lote_codigo}</option>
                    ))
                  }
                </select>
                {productos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProducto(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={2}
            placeholder="Observaciones opcionales..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500"
          />
        </div>

        {/* Botones */}
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
            className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 transition-colors"
          >
            {mutation.isLoading ? 'Creando...' : 'Crear Reabastecimiento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

