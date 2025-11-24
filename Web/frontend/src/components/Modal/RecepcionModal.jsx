import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Inbox, Package, Calendar, Hash, Plus } from 'lucide-react'
import Modal from './Modal'
import { useNotification } from '../../contexts/NotificationContext'

export default function RecepcionModal({ isOpen, onClose, ordenId = null }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const [crearOrden, setCrearOrden] = useState(!ordenId)
  const [crearLote, setCrearLote] = useState(true)
  const [formData, setFormData] = useState({
    orden_compra_id: ordenId || '',
    numero_orden: '',
    producto_id: '',
    codigo_lote: '',
    fecha_caducidad: '',
    fecha_fabricacion: '',
    cantidad: ''
  })

  // Cargar productos
  const { data: productos = [] } = useQuery({
    queryKey: ['productos-para-recepcion'],
    queryFn: () => api.getProductos(),
    enabled: isOpen,
  })

  useEffect(() => {
    if (ordenId) {
      setFormData(prev => ({ ...prev, orden_compra_id: ordenId }))
      setCrearOrden(false)
    }
  }, [ordenId])

  const mutation = useMutation({
    mutationFn: (data) => api.receiveProduct(data),
    onSuccess: () => {
      success('Mercancía recibida exitosamente')
      queryClient.invalidateQueries({ queryKey: ['tareas-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
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
      producto_id: '',
      codigo_lote: '',
      fecha_caducidad: '',
      fecha_fabricacion: '',
      cantidad: ''
    })
    setCrearOrden(!ordenId)
    setCrearLote(true)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const data = {
      producto_id: parseInt(formData.producto_id),
      codigo_lote: formData.codigo_lote,
      fecha_caducidad: formData.fecha_caducidad,
      fecha_fabricacion: formData.fecha_fabricacion || null,
      cantidad: parseFloat(formData.cantidad)
    }

    // Si no se crea orden, enviar orden_compra_id
    if (!crearOrden && formData.orden_compra_id) {
      data.orden_compra_id = parseInt(formData.orden_compra_id)
    } else if (crearOrden && formData.numero_orden) {
      // Si se crea orden, enviar numero_orden
      data.numero_orden = formData.numero_orden
    }

    mutation.mutate(data)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
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
              Producto
            </label>
            <select
              name="producto_id"
              value={formData.producto_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Código de Lote */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Lote *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="codigo_lote"
                value={formData.codigo_lote}
                onChange={handleChange}
                required
                placeholder="LOTE-2024-001"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">El lote se creará automáticamente si no existe</p>
          </div>

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
        </div>

        <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          <strong>Nota:</strong> Al recibir mercancía, el inventario se actualizará automáticamente y se creará una tarea PUTAWAY para ubicar el producto.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isLoading ? 'Procesando...' : 'Recibir Mercancía'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
