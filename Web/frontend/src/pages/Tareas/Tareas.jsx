import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Plus,
  Play,
  User
} from 'lucide-react'
import TareaDetailModal from '../../components/Modal/TareaDetailModal'
import TareaFormModal from '../../components/Modal/TareaFormModal'
import ValidateScanModal from '../../components/Modal/ValidateScanModal'
import { useAuth } from '../../contexts/AuthContext'

export default function Tareas() {
  const { user } = useAuth()
  // El rol puede venir como string o como objeto con propiedad nombre
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const isAdmin = userRol?.toLowerCase() === 'administrador'
  const isSupervisor = userRol?.toLowerCase() === 'supervisor'
  const isOperario = userRol?.toLowerCase() === 'operario'
  const queryClient = useQueryClient()

  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [selectedTareaId, setSelectedTareaId] = useState(null)
  const [selectedTarea, setSelectedTarea] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)

  const { data: tareas, isLoading, refetch } = useQuery({
    queryKey: ['tareas', filtroEstado],
    queryFn: () => api.getTasks(filtroEstado ? { estado: filtroEstado } : {})
  })

  const startMutation = useMutation({
    mutationFn: (id) => api.startTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
    }
  })

  const completeMutation = useMutation({
    mutationFn: (id) => api.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
      queryClient.invalidateQueries({ queryKey: ['tareas-kpis'] })
    }
  })

  const tareasFiltradas = tareas?.filter(tarea => 
    tarea.numero_tarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.tipo_tarea?.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'CREADA':
        return <Clock className="w-4 h-4 text-blue-600" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          <p className="text-gray-600">Gestiona las tareas de almacén</p>
        </div>
        {(isAdmin || isSupervisor) && (
          <button
            onClick={() => {
              setSelectedTarea(null)
              setIsFormModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Tarea
          </button>
        )}
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
                placeholder="Buscar por número o tipo..."
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
              <option value="">Todas</option>
              <option value="CREADA">Creadas</option>
              <option value="ASIGNADA">Asignadas</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADA">Completadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Cargando tareas...</p>
          </div>
        ) : tareasFiltradas.length > 0 ? (
          <div className="divide-y">
            {tareasFiltradas.map((tarea) => (
              <div key={tarea.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getEstadoIcon(tarea.estado)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tarea.numero_tarea || `Tarea #${tarea.id}`}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(tarea.estado)}`}>
                        {tarea.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Tipo: <span className="font-medium">{tarea.tipo_tarea}</span>
                      {tarea.prioridad && (
                        <> | Prioridad: <span className="font-medium">{tarea.prioridad}</span></>
                      )}
                    </p>
                    {tarea.fecha_inicio && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>Iniciada: {new Date(tarea.fecha_inicio).toLocaleString()}</span>
                        {tarea.fecha_fin && (
                          <span>Finalizada: {new Date(tarea.fecha_fin).toLocaleString()}</span>
                        )}
                        {tarea.tiempo_transcurrido_formateado && (
                          <span className="font-semibold text-primary-600">
                            ⏱️ Tiempo: {tarea.tiempo_transcurrido_formateado}
                          </span>
                        )}
                      </div>
                    )}
                    {tarea.usuario_asignado && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>Asignada a: {tarea.usuario_asignado.nombre || tarea.usuario_asignado.usuario}</span>
                      </div>
                    )}
                    {tarea.detalle_tareas && tarea.detalle_tareas.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Detalles:</p>
                        <div className="space-y-1">
                          {tarea.detalle_tareas.map((detalle, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              • Lote: {detalle.lote?.lote_codigo} - 
                              Cantidad: {detalle.cantidad_completada}/{detalle.cantidad_solicitada}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tarea.fecha_creacion && (
                      <p className="text-xs text-gray-500 mt-2">
                        Creada: {format(new Date(tarea.fecha_creacion), 'PPp', { locale: es })}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex gap-2">
                    {tarea.estado === 'CREADA' && (isOperario || isSupervisor) && (
                      <button 
                        onClick={() => startMutation.mutate(tarea.id)}
                        disabled={startMutation.isLoading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
                      </button>
                    )}
                    {tarea.estado === 'EN_PROCESO' && (
                      <>
                        {isOperario && (
                          <button 
                            onClick={() => {
                              setSelectedTareaId(tarea.id)
                              setIsScanModalOpen(true)
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Validar Escaneo
                          </button>
                        )}
                        {(isOperario || isSupervisor) && (
                          <button 
                            onClick={() => completeMutation.mutate(tarea.id)}
                            disabled={completeMutation.isLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Completar
                          </button>
                        )}
                      </>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedTareaId(tarea.id)
                        setIsDetailModalOpen(true)
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay tareas con el filtro seleccionado</p>
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

      {/* Modal de Formulario */}
      <TareaFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedTarea(null)
        }}
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

