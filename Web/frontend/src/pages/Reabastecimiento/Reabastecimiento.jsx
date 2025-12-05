import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  RefreshCw, 
  Plus, 
  Search, 
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Eye,
  ClipboardList,
  User
} from 'lucide-react'
import ReabastecimientoFormModal from '../../components/Modal/ReabastecimientoFormModal'
import ReabastecimientoDetailModal from '../../components/Modal/ReabastecimientoDetailModal'
import TareaDetailModal from '../../components/Modal/TareaDetailModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Reabastecimiento() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedReabastecimiento, setSelectedReabastecimiento] = useState(null)
  const [isTareaDetailModalOpen, setIsTareaDetailModalOpen] = useState(false)
  const [selectedTareaId, setSelectedTareaId] = useState(null)

  // Obtener reabastecimientos
  const { data: reabastecimientosData, isLoading } = useQuery({
    queryKey: ['reabastecimientos', filtroEstado, filtroTipo],
    queryFn: () => api.getReabastecimientos({ 
      estado: filtroEstado || undefined,
      tipo: filtroTipo || undefined
    })
  })

  // Manejar diferentes formatos de respuesta
  const reabastecimientos = Array.isArray(reabastecimientosData) 
    ? reabastecimientosData 
    : Array.isArray(reabastecimientosData?.data) 
      ? reabastecimientosData.data 
      : []

  // Obtener tareas de reabastecimiento (MOVE o REABASTECER)
  const { data: tareasReabastecimientoData } = useQuery({
    queryKey: ['tareas-reabastecimiento'],
    queryFn: async () => {
      // Obtener tareas de tipo MOVE y REABASTECER
      const moveTasks = await api.getTasks({ tipo_tarea: 'MOVE' })
      const reabastecerTasks = await api.getTasks({ tipo_tarea: 'REABASTECER' })
      return [...(Array.isArray(moveTasks) ? moveTasks : []), ...(Array.isArray(reabastecerTasks) ? reabastecerTasks : [])]
    }
  })

  const tareasReabastecimiento = Array.isArray(tareasReabastecimientoData) ? tareasReabastecimientoData : []

  // Mutación para verificar stock mínimo
  const verificarStockMutation = useMutation({
    mutationFn: () => api.verificarStockMinimo(),
    onSuccess: (data) => {
      success(`Se generaron ${data.data?.length || 0} reabastecimientos automáticos`)
      queryClient.invalidateQueries({ queryKey: ['reabastecimientos'] })
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  // Mutación para aprobar
  const aprobarMutation = useMutation({
    mutationFn: (id) => api.aprobarReabastecimiento(id),
    onSuccess: () => {
      success('Reabastecimiento aprobado')
      queryClient.invalidateQueries({ queryKey: ['reabastecimientos'] })
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  // Mutación para ejecutar
  const ejecutarMutation = useMutation({
    mutationFn: (id) => api.ejecutarReabastecimiento(id),
    onSuccess: (data) => {
      const tareasCreadas = data?.data?.tareas?.length || 0
      success(`Reabastecimiento en ejecución - ${tareasCreadas} tarea(s) creada(s)`)
      queryClient.invalidateQueries({ queryKey: ['reabastecimientos'] })
      queryClient.invalidateQueries({ queryKey: ['tareas-reabastecimiento'] })
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  const getEstadoColor = (estado) => {
    const colores = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'APROBADO': 'bg-blue-100 text-blue-800',
      'EN_PROCESO': 'bg-purple-100 text-purple-800',
      'COMPLETADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    }
    return colores[estado] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return <Clock className="w-4 h-4" />
      case 'APROBADO': return <CheckCircle className="w-4 h-4" />
      case 'EN_PROCESO': return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'COMPLETADO': return <CheckCircle className="w-4 h-4" />
      case 'CANCELADO': return <XCircle className="w-4 h-4" />
      default: return null
    }
  }

  const getTipoColor = (tipo) => {
    const colores = {
      'MANUAL': 'bg-gray-100 text-gray-800',
      'AUTOMATICO': 'bg-blue-100 text-blue-800',
      'PROGRAMADO': 'bg-purple-100 text-purple-800'
    }
    return colores[tipo] || 'bg-gray-100 text-gray-800'
  }

  const getPrioridadColor = (prioridad) => {
    const colores = {
      'BAJA': 'text-gray-500',
      'MEDIA': 'text-blue-500',
      'ALTA': 'text-orange-500',
      'URGENTE': 'text-red-500'
    }
    return colores[prioridad] || 'text-gray-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-escasan-green-500" />
            Reabastecimientos
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona los movimientos entre subbodegas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => verificarStockMutation.mutate()}
            disabled={verificarStockMutation.isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-escasan-orange-500 text-white rounded-lg hover:bg-escasan-orange-600 transition-colors disabled:opacity-50"
          >
            <AlertTriangle className="w-5 h-5" />
            {verificarStockMutation.isLoading ? 'Verificando...' : 'Verificar Stock'}
          </button>
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-escasan-green-500 text-white rounded-lg hover:bg-escasan-green-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Reabastecimiento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADO">Aprobado</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500"
          >
            <option value="">Todos los tipos</option>
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATICO">Automático</option>
            <option value="PROGRAMADO">Programado</option>
          </select>
        </div>
      </div>

      {/* Recuadro de Tareas de Reabastecimiento */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-escasan-green-500" />
            Tareas de Reabastecimiento
          </h2>
          <span className="text-sm text-gray-500">
            {tareasReabastecimiento.length} {tareasReabastecimiento.length === 1 ? 'tarea' : 'tareas'}
          </span>
        </div>
        
        {tareasReabastecimiento.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No hay tareas de reabastecimiento creadas</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tareasReabastecimiento.slice(0, 10).map((tarea) => (
              <div
                key={tarea.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedTareaId(tarea.id)
                  setIsTareaDetailModalOpen(true)
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {tarea.numero_tarea || `Tarea #${tarea.id}`}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      tarea.estado === 'CREADA' ? 'bg-blue-100 text-blue-800' :
                      tarea.estado === 'ASIGNADA' ? 'bg-purple-100 text-purple-800' :
                      tarea.estado === 'EN_PROCESO' || tarea.estado === 'EN_CURSO' ? 'bg-yellow-100 text-yellow-800' :
                      tarea.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tarea.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {tarea.detalles?.length || 0} items
                    </span>
                    {tarea.usuario_asignado && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {tarea.usuario_asignado.nombre || tarea.usuario_asignado.usuario}
                      </span>
                    )}
                  </div>
                </div>
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
            ))}
            {tareasReabastecimiento.length > 10 && (
              <p className="text-xs text-center text-gray-500 pt-2">
                Mostrando 10 de {tareasReabastecimiento.length} tareas
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lista de Reabastecimientos */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-escasan-green-500" />
        </div>
      ) : reabastecimientos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">No hay reabastecimientos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origen → Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reabastecimientos.map((reab) => (
                <tr key={reab.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{reab.numero_reabastecimiento}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTipoColor(reab.tipo)}`}>
                      {reab.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{reab.subbodega_origen?.nombre || 'N/A'}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span>{reab.subbodega_destino?.nombre || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(reab.estado)}`}>
                      {getEstadoIcon(reab.estado)}
                      {reab.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getPrioridadColor(reab.prioridad)}`}>
                      {reab.prioridad}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reab.fecha_solicitud).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedReabastecimiento(reab)
                          setIsDetailModalOpen(true)
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {reab.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => aprobarMutation.mutate(reab.id)}
                          disabled={aprobarMutation.isLoading}
                          className="px-3 py-1 text-sm bg-confirm-500 text-white rounded hover:bg-confirm-600 transition-colors"
                        >
                          Aprobar
                        </button>
                      )}
                      {reab.estado === 'APROBADO' && (
                        <button
                          onClick={() => ejecutarMutation.mutate(reab.id)}
                          disabled={ejecutarMutation.isLoading}
                          className="px-3 py-1 text-sm bg-escasan-green-500 text-white rounded hover:bg-escasan-green-600 transition-colors flex items-center gap-1"
                        >
                          <Play className="w-4 h-4" />
                          Ejecutar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <ReabastecimientoFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
      />

      <ReabastecimientoDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedReabastecimiento(null)
        }}
        reabastecimiento={selectedReabastecimiento}
      />

      {/* Modal de Detalle de Tarea */}
      <TareaDetailModal
        isOpen={isTareaDetailModalOpen}
        onClose={() => {
          setIsTareaDetailModalOpen(false)
          setSelectedTareaId(null)
        }}
        tareaId={selectedTareaId}
      />
    </div>
  )
}

