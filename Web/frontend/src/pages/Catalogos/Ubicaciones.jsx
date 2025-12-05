import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Search, Plus, Edit, Trash2, MapPin } from 'lucide-react'
import UbicacionFormModal from '../../components/Modal/UbicacionFormModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Ubicaciones() {
  const { error: showError } = useNotification()
  const [busqueda, setBusqueda] = useState('')
  const [selectedUbicacion, setSelectedUbicacion] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: ubicaciones, isLoading, refetch } = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: () => api.getUbicaciones()
  })

  const ubicacionesFiltradas = ubicaciones?.filter(ubicacion =>
    ubicacion.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    `${ubicacion.pasillo}-${ubicacion.estante}-${ubicacion.nivel}`.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  const handleEdit = (ubicacion) => {
    setSelectedUbicacion(ubicacion)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedUbicacion(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta ubicación?')) {
      try {
        await api.deleteUbicacion(id)
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
          <h1 className="text-2xl font-bold text-gray-900">Ubicaciones</h1>
          <p className="text-gray-600">Gestiona las ubicaciones del almacén</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Ubicación
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o ubicación..."
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
            <p className="text-gray-500">Cargando ubicaciones...</p>
          </div>
        ) : ubicacionesFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pasillo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ubicacionesFiltradas.map((ubicacion) => (
                  <tr key={ubicacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{ubicacion.codigo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ubicacion.pasillo || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ubicacion.estante || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ubicacion.nivel || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ubicacion.tipo_ubicacion?.nombre || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {ubicacion.max_peso && `${ubicacion.max_peso}kg`}
                        {ubicacion.max_peso && ubicacion.max_cantidad && ' / '}
                        {ubicacion.max_cantidad && `${ubicacion.max_cantidad} uds`}
                        {!ubicacion.max_peso && !ubicacion.max_cantidad && '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(ubicacion)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ubicacion.id)}
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
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay ubicaciones registradas</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <UbicacionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUbicacion(null)
        }}
        ubicacion={selectedUbicacion}
      />
    </div>
  )
}

