import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { 
  Search, 
  Filter, 
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  User,
  Eye,
  UserPlus
} from 'lucide-react'
import TareaDetailModal from '../../components/Modal/TareaDetailModal'
import AsignarTareaModal from '../../components/Modal/AsignarTareaModal'
import ValidateScanModal from '../../components/Modal/ValidateScanModal'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'

export default function Tareas() {
  const { user } = useAuth()
  const { success } = useNotification()
  const navigate = useNavigate()
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const isAdmin = userRol?.toLowerCase() === 'administrador'
  const isSupervisor = userRol?.toLowerCase()?.includes('supervisor') || isAdmin
  const isOperario = userRol?.toLowerCase()?.includes('operario')
  const queryClient = useQueryClient()

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [selectedTareaId, setSelectedTareaId] = useState(null)
  const [selectedTarea, setSelectedTarea] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAsignarModalOpen, setIsAsignarModalOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)

  const { data: tareas, isLoading, refetch } = useQuery({
    queryKey: ['tareas', filtroEstado, filtroTipo],
    queryFn: () => api.getTasks({
      estado: filtroEstado || undefined,
      tipo_tarea: filtroTipo || undefined
    })
  })

  // Función para obtener la ruta de ejecución según el tipo de tarea
  const getRutaEjecucion = (tipoTarea, tareaId) => {
    switch (tipoTarea?.toUpperCase()) {
      case 'PICK':
      case 'PICKING':
        return `/picking/ejecucion/${tareaId}`
      case 'PACK':
      case 'PACKING':
        return `/packing/ejecucion/${tareaId}`
      case 'PUTAWAY':
        return `/putaway/ejecucion/${tareaId}`
      case 'MOVE':
      case 'REABASTECER':
        // Para reabastecimiento, usar la misma vista que putaway (check-in de ubicación)
        return `/putaway/ejecucion/${tareaId}`
      default:
        return null
    }
  }

  const startMutation = useMutation({
    mutationFn: ({ id, tipoTarea }) => {
      // Primero iniciar la tarea
      return api.startTask(id).then(() => ({ id, tipoTarea }))
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
      success('Tarea iniciada exitosamente')
      
      // Navegar a la pantalla de ejecución correspondiente
      const ruta = getRutaEjecucion(data.tipoTarea, data.id)
      if (ruta) {
        navigate(ruta)
      }
    }
  })

  const completeMutation = useMutation({
    mutationFn: (id) => api.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
      queryClient.invalidateQueries({ queryKey: ['tareas-kpis'] })
      success('Tarea completada exitosamente')
    }
  })

  const tareasFiltradas = tareas?.filter(tarea => 
    tarea.numero_tarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.tipo_tarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.usuario_asignado?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.usuario_asignado?.usuario?.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'CREADA':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'ASIGNADA':
        return <User className="w-4 h-4 text-purple-600" />
      case 'EN_PROCESO':
      case 'EN_CURSO':
        return <ClipboardList className="w-4 h-4 text-yellow-600" />
      case 'COMPLETADA':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'CANCELADA':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'CREADA':
        return 'bg-blue-100 text-blue-800'
      case 'ASIGNADA':
        return 'bg-purple-100 text-purple-800'
      case 'EN_PROCESO':
      case 'EN_CURSO':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETADA':
        return 'bg-green-100 text-green-800'
      case 'CANCELADA':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Tareas del Sistema</h1>
          <p className="text-gray-600">Listado de todas las tareas generadas automáticamente por el sistema</p>
        </div>
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
                placeholder="Buscar por número, tipo o operario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Estado Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="CREADA">Creadas</option>
              <option value="ASIGNADA">Asignadas</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="EN_CURSO">En Curso</option>
              <option value="COMPLETADA">Completadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>

          {/* Tipo Filter */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            <option value="PICK">Picking</option>
            <option value="PUTAWAY">Putaway</option>
            <option value="MOVE">Movimiento</option>
            <option value="REABASTECER">Reabastecimiento</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow">
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
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
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
                      <div className="flex items-center gap-2">
                        {getEstadoIcon(tarea.estado)}
                        <span className="font-medium text-gray-900">
                          {tarea.numero_tarea || `Tarea #${tarea.id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {tarea.tipo_tarea}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(tarea.estado)}`}>
                        {tarea.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tarea.usuario_asignado ? (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {tarea.usuario_asignado.nombre || tarea.usuario_asignado.usuario}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tarea.fecha_creacion
                        ? format(new Date(tarea.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* Botón Asignar - Solo para supervisores y tareas CREADAS sin asignar */}
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
                        
                        {/* Botón Iniciar - Para operarios o tareas asignadas */}
                        {(tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA') && (isOperario || isSupervisor) && (
                          <button 
                            onClick={() => startMutation.mutate({ id: tarea.id, tipoTarea: tarea.tipo_tarea })}
                            disabled={startMutation.isLoading}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title="Iniciar tarea"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar
                          </button>
                        )}

                        {/* Botón Completar - Para tareas en proceso */}
                        {(tarea.estado === 'EN_PROCESO' || tarea.estado === 'EN_CURSO') && (isOperario || isSupervisor) && (
                          <button 
                            onClick={() => completeMutation.mutate(tarea.id)}
                            disabled={completeMutation.isLoading}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title="Completar tarea"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Completar
                          </button>
                        )}

                        {/* Botón Ver Detalles */}
                        <button 
                          onClick={() => {
                            setSelectedTareaId(tarea.id)
                            setIsDetailModalOpen(true)
                          }}
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
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay tareas con el filtro seleccionado</p>
            <p className="text-sm text-gray-400 mt-1">
              Las tareas se crean automáticamente al realizar recepciones, picking, reabastecimientos, etc.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      <TareaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedTareaId(null)
        }}
        tareaId={selectedTareaId}
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

      {/* Modal de Validar Escaneo */}
      <ValidateScanModal
        isOpen={isScanModalOpen}
        onClose={() => {
          setIsScanModalOpen(false)
          setSelectedTareaId(null)
        }}
        tareaId={selectedTareaId}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}
