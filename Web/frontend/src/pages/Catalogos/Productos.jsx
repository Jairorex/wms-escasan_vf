import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react'
import ProductoFormModal from '../../components/Modal/ProductoFormModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Productos() {
  const { error: showError } = useNotification()
  const [busqueda, setBusqueda] = useState('')
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: productos, isLoading, refetch, error } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      try {
        const data = await api.getProductos()
        return Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Error al cargar productos:', err)
        return []
      }
    }
  })

  const productosFiltrados = Array.isArray(productos) ? productos.filter(producto =>
    producto.sku?.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  ) : []

  const handleEdit = (producto) => {
    setSelectedProducto(producto)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedProducto(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await api.deleteProducto(id)
        refetch()
        // No mostrar notificación de éxito al eliminar
      } catch (error) {
        showError('Error al eliminar: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona el catálogo de productos</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por SKU o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Error al cargar productos. Por favor, intenta de nuevo.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Reintentar
            </button>
          </div>
        ) : productosFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volumen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{producto.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{producto.nombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 truncate max-w-xs block">
                        {producto.descripcion || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{producto.peso || '-'} kg</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{producto.volumen || '-'} m³</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(producto)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay productos registrados</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <ProductoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProducto(null)
          refetch()
        }}
        producto={selectedProducto}
        onSuccess={refetch}
      />
    </div>
  )
}

