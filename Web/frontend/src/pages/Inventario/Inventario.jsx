import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Search, Plus, Edit, Trash2, Package, MapPin, Box, AlertCircle } from 'lucide-react'
import InventarioFormModal from '../../components/Modal/InventarioFormModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Inventario() {
  const queryClient = useQueryClient()
  const { error: showError } = useNotification()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('all')
  const [selectedInventario, setSelectedInventario] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: inventario, isLoading, refetch, error } = useQuery({
    queryKey: ['inventario', filtroEstado],
    queryFn: async () => {
      try {
        const params = {}
        if (filtroEstado !== 'all') {
          params.estado = filtroEstado
        }
        if (busqueda) {
          params.search = busqueda
        }
        const data = await api.getInventario(params)
        return Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Error al cargar inventario:', err)
        return []
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteInventario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
    }
  })

  const inventarioFiltrado = Array.isArray(inventario) ? inventario.filter(item =>
    item.lote?.producto?.sku?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.lote?.producto?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.lote?.lote_codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.ubicacion?.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  ) : []

  const handleCreate = () => {
    setSelectedInventario(null)
    setIsModalOpen(true)
  }

  const handleEdit = (item) => {
    setSelectedInventario(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este registro de inventario?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        showError('Error al eliminar: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800'
      case 'Cuarentena':
        return 'bg-yellow-100 text-yellow-800'
      case 'Dañado':
        return 'bg-red-100 text-red-800'
      case 'Transito':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestiona el stock disponible en almacén</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Asignar Producto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por SKU, producto, lote o ubicación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Estado Filter */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Cuarentena">Cuarentena</option>
            <option value="Dañado">Dañado</option>
            <option value="Transito">Tránsito</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Cargando inventario...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-500">Error al cargar inventario. Por favor, intenta de nuevo.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Reintentar
            </button>
          </div>
        ) : inventarioFiltrado.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventarioFiltrado.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.lote?.producto?.sku || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.lote?.producto?.nombre || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Box className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{item.lote?.lote_codigo || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{item.ubicacion?.codigo || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{item.cantidad || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(item.estado)}`}>
                        {item.estado || 'Disponible'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
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
            <p className="text-gray-500">No hay registros de inventario</p>
            <p className="text-sm text-gray-400 mt-2">
              Asigna productos a ubicaciones para comenzar a gestionar el inventario
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <InventarioFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedInventario(null)
          refetch()
        }}
        inventario={selectedInventario}
        onSuccess={refetch}
      />
    </div>
  )
}
