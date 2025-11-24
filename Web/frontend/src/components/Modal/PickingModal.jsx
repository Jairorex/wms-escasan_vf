import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Package, Hash, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { useNotification } from '../../contexts/NotificationContext'



export default function PickingModal({ isOpen, onClose, ordenId = null }) {
  const queryClient = useQueryClient()
  const { success, error: showError, warning } = useNotification()
  const [crearOrden, setCrearOrden] = useState(!ordenId)
  const [ordenVentaId, setOrdenVentaId] = useState(ordenId || '')
  const [numeroOrden, setNumeroOrden] = useState('')
  const [carrito, setCarrito] = useState([])
  const [productoActual, setProductoActual] = useState({
    producto_id: '',
    cantidad: ''
  })

  // 🔹 Cargar productos para el combo
  const { data: productos = [] } = useQuery({
    queryKey: ['productos-para-picking'],
    queryFn: () => api.getProductos(),
    enabled: isOpen, // solo cuando el modal está abierto
  })

  useEffect(() => {
    if (ordenId) {
      setOrdenVentaId(ordenId)
      setCrearOrden(false)
    }
  }, [ordenId])

  const mutation = useMutation({
    mutationFn: (data) => api.preparePicking(data),
    onSuccess: () => {
      success('Picking preparado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['tareas-pendientes'] })
      handleClose()
    },
    onError: (error) => {
      const data = error.response?.data
      const errors = data?.errors
  
      if (errors) {
        // Tomar el primer error de validación
        const firstField = Object.keys(errors)[0]
        const firstMessage = errors[firstField][0]
        showError(`Error de validación en ${firstField}: ${firstMessage}`)
      } else {
        showError('Error al preparar picking: ' + (data?.message || error.message))
      }
    }
  })
  

  const handleClose = () => {
    setOrdenVentaId(ordenId || '')
    setNumeroOrden('')
    setCarrito([])
    setProductoActual({ producto_id: '', cantidad: '' })
    setCrearOrden(!ordenId)
    onClose()
  }

  const handleAgregarAlCarrito = (e) => {
    e.preventDefault()
    
    if (!productoActual.producto_id || !productoActual.cantidad || parseFloat(productoActual.cantidad) <= 0) {
      warning('Por favor complete todos los campos correctamente')
      return
    }

    const productoIdNumber = parseInt(productoActual.producto_id)

    // Verificar si el producto ya está en el carrito
    const productoExistente = carrito.find(item => item.producto_id === productoIdNumber)
    
    if (productoExistente) {
      // Si existe, actualizar la cantidad
      setCarrito(carrito.map(item => 
        item.producto_id === productoIdNumber
          ? { ...item, cantidad: parseFloat(item.cantidad) + parseFloat(productoActual.cantidad) }
          : item
      ))
    } else {
      // Si no existe, agregarlo al carrito
      setCarrito([...carrito, {
        producto_id: productoIdNumber,
        cantidad: parseFloat(productoActual.cantidad)
      }])
    }

    // Limpiar formulario
    setProductoActual({ producto_id: '', cantidad: '' })
    success('Producto agregado al carrito')
  }

  const handleEliminarDelCarrito = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (carrito.length === 0) {
      warning('El carrito está vacío. Agregue al menos un producto.')
      return
    }

    const data = {
      productos: carrito
    }

    // Si no se crea orden, enviar orden_venta_id
    if (!crearOrden && ordenVentaId) {
      data.orden_venta_id = parseInt(ordenVentaId)
    } else if (crearOrden && numeroOrden) {
      // Si se crea orden, enviar numero_orden
      data.numero_orden = numeroOrden
    }

    mutation.mutate(data)
  }

  const handleChange = (e) => {
    setProductoActual({
      ...productoActual,
      [e.target.name]: e.target.value
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Preparación de Picking"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Opción: Crear orden o usar existente */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={crearOrden}
              onChange={(e) => setCrearOrden(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Crear nueva orden de venta</span>
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
              value={numeroOrden}
              onChange={(e) => setNumeroOrden(e.target.value)}
              placeholder="ORD-VENTA-2024-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Si no se especifica, se generará automáticamente</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              ID Orden de Venta
            </label>
            <input
              type="number"
              name="orden_venta_id"
              value={ordenVentaId}
              onChange={(e) => setOrdenVentaId(e.target.value)}
              disabled={!!ordenId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        )}

        {/* Formulario para agregar productos */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Agregar Producto al Carrito
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Package className="w-3 h-3 inline mr-1" />
                Producto
              </label>
              <select
                name="producto_id"
                value={productoActual.producto_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={productoActual.cantidad}
                onChange={handleChange}
                min="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Cantidad"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAgregarAlCarrito}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar al Carrito
          </button>
        </div>

        {/* Carrito */}
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">
              Carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})
            </h3>
          </div>
          
          {carrito.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">El carrito está vacío</p>
              <p className="text-xs mt-1">Agregue productos usando el formulario de arriba</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {carrito.map((item, index) => (
                <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        Producto ID: {item.producto_id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Cantidad: {item.cantidad}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarDelCarrito(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar del carrito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          El sistema seleccionará automáticamente el lote con fecha de caducidad más próxima (FEFO) para cada producto.
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
            disabled={mutation.isLoading || carrito.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isLoading ? 'Procesando...' : `Preparar Picking (${carrito.length})`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
