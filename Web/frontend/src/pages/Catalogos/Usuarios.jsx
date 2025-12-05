import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Search, Plus, Edit, Trash2, User, AlertCircle } from 'lucide-react'
import UsuarioFormModal from '../../components/Modal/UsuarioFormModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Usuarios() {
  const { error: showError } = useNotification()
  const [busqueda, setBusqueda] = useState('')
  const [selectedUsuario, setSelectedUsuario] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: usuariosData, isLoading } = useQuery({
    queryKey: ['usuarios', { search: busqueda }],
    queryFn: async () => {
      const usuarios = await api.getUsuarios({ search: busqueda })
      // Cargar relaciones de supervisor
      return usuarios.map(u => ({
        ...u,
        supervisor: u.supervisor_id ? usuarios.find(s => s.id === u.supervisor_id) : null
      }))
    }
  })

  const usuarios = usuariosData || []

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      // No mostrar notificación de éxito al eliminar
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleDelete = (usuario) => {
    if (window.confirm(`¿Estás seguro de eliminar al usuario "${usuario.nombre || usuario.usuario}"?`)) {
      deleteMutation.mutate(usuario.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gestiona los usuarios del sistema</p>
        </div>
        <button
          onClick={() => {
            setSelectedUsuario(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, nombre o email..."
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
            <p className="text-gray-500">Cargando usuarios...</p>
          </div>
        ) : usuarios.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{usuario.usuario}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{usuario.nombre || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{usuario.email || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {usuario.rol?.nombre || '-'}
                        </span>
                        {usuario.supervisor && (
                          <span className="text-xs text-gray-500">
                            Supervisor: {usuario.supervisor.nombre}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUsuario(usuario)
                            setIsModalOpen(true)
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario)}
                          disabled={deleteMutation.isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar usuario"
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
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay usuarios registrados</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <UsuarioFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUsuario(null)
        }}
        usuario={selectedUsuario}
      />
    </div>
  )
}

