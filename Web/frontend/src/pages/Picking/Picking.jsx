import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { Package, Plus, Search, Play, Eye, UserPlus, User } from 'lucide-react'
import PickingModal from '../../components/Modal/PickingModal'
import TareaDetailModal from '../../components/Modal/TareaDetailModal'
import AsignarTareaModal from '../../components/Modal/AsignarTareaModal'
import { useNotification } from '../../contexts/NotificationContext'
import { useAuth } from '../../contexts/AuthContext'

export default function Picking() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { success } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [selectedTarea, setSelectedTarea] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAsignarModalOpen, setIsAsignarModalOpen] = useState(false)
  
  // Determinar rol
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const rolNormalizado = userRol?.toLowerCase()?.normalize("NFD").replace(/[\u0300-\u036f]/g, "")?.trim()
  const isAdmin = rolNormalizado === 'administrador' || rolNormalizado?.includes('admin')
  const isSupervisor = (rolNormalizado?.includes('supervisor') && !rolNormalizado?.includes('inventario')) || isAdmin
  const isOperario = rolNormalizado === 'operario' || rolNormalizado?.includes('operario')
  const isOperarioPicking = rolNormalizado?.includes('picking')
  
  // Solo Admin puede crear picking
  const puedeCrearPicking = isAdmin

  // Cargar solo tareas de tipo PICK
  const { data: tareas, isLoading } = useQuery({
    queryKey: ['tareas-picking'],
    queryFn: () => api.getTasks({ tipo_tarea: 'PICK' })
  })

  const tareasFiltradas = tareas?.filter(tarea => 
    tarea.numero_tarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.tipo_tarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.usuario_asignado?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.usuario_asignado?.usuario?.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  // Navegar a la pantalla de ejecución/checking
  const handleEjecutar = (tarea) => {
    navigate(`/picking/ejecucion/${tarea.id}`)
  }

  const handleViewDetails = (tarea) => {
    setSelectedTarea(tarea)
    setIsDetailModalOpen(true)
  }

  const handleAsignar = (tarea) => {
    setSelectedTarea(tarea)
    setIsAsignarModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Picking / Salida de Mercancía</h1>
          <p className="text-gray-600">
            {isOperario || isOperarioPicking 
              ? 'Gestiona tus tareas de picking asignadas' 
              : 'Gestiona las tareas de picking del sistema'}
          </p>
        </div>
        {puedeCrearPicking && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-escasan-green-500 text-white rounded-lg hover:bg-escasan-green-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Picking
          </button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas de picking por número, tipo o operario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de tareas de picking */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Cargando tareas...</p>
          </div>
        ) : tareasFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarea
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tareasFiltradas.map((tarea) => (
                  <tr key={tarea.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {tarea.numero_tarea || `Tarea #${tarea.id}`}
                      </span>
                      {tarea.descripcion && (
                        <p className="text-sm text-gray-500 mt-1">{tarea.descripcion}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tarea.estado === 'CREADA' ? 'bg-blue-100 text-blue-800' :
                        tarea.estado === 'ASIGNADA' ? 'bg-purple-100 text-purple-800' :
                        tarea.estado === 'EN_PROCESO' || tarea.estado === 'EN_CURSO' ? 'bg-yellow-100 text-yellow-800' :
                        tarea.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tarea.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tarea.usuario_asignado ? (
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <User className="w-4 h-4" />
                          {tarea.usuario_asignado.nombre || tarea.usuario_asignado.usuario}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {tarea.prioridad || 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* Supervisor puede asignar tareas */}
                        {isSupervisor && tarea.estado === 'CREADA' && !tarea.asignada_a_usuario_id && (
                          <button
                            onClick={() => handleAsignar(tarea)}
                            className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                            title="Asignar tarea"
                          >
                            <UserPlus className="w-4 h-4" />
                            Asignar
                          </button>
                        )}
                        
                        {/* Botón para ejecutar/iniciar el picking con checking */}
                        {/* Operarios solo pueden ejecutar sus tareas asignadas */}
                        {((isOperario || isOperarioPicking) 
                          ? (tarea.asignada_a_usuario_id === user?.id && (tarea.estado === 'ASIGNADA' || tarea.estado === 'EN_PROCESO' || tarea.estado === 'EN_CURSO'))
                          : (tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA' || tarea.estado === 'EN_PROCESO' || tarea.estado === 'EN_CURSO')
                        ) && (
                          <button
                            onClick={() => handleEjecutar(tarea)}
                            className="text-escasan-green-500 hover:text-escasan-green-700 flex items-center gap-1"
                            title="Ejecutar picking"
                          >
                            <Play className="w-4 h-4" />
                            {tarea.estado === 'EN_PROCESO' || tarea.estado === 'EN_CURSO' ? 'Continuar' : 'Ejecutar'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleViewDetails(tarea)}
                          className="text-confirm-500 hover:text-confirm-700 flex items-center gap-1"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                          Detalles
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
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {isOperario || isOperarioPicking 
                ? 'No tienes tareas de picking asignadas' 
                : 'No hay tareas de picking disponibles'}
            </p>
            {puedeCrearPicking && (
              <p className="text-sm text-gray-400 mt-1">
                Haz clic en "Crear Picking" para preparar la salida de productos
              </p>
            )}
            {!puedeCrearPicking && (isOperario || isOperarioPicking) && (
              <p className="text-sm text-gray-400 mt-1">
                Espera a que un supervisor te asigne una tarea
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal de Picking */}
      <PickingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal de Detalle de Tarea */}
      <TareaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedTarea(null)
        }}
        tareaId={selectedTarea?.id}
      />

      {/* Modal de Asignar */}
      <AsignarTareaModal
        isOpen={isAsignarModalOpen}
        onClose={() => {
          setIsAsignarModalOpen(false)
          setSelectedTarea(null)
        }}
        tareaId={selectedTarea?.id}
        tarea={selectedTarea}
      />
    </div>
  )
}
