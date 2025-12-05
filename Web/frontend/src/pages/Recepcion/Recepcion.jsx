import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Inbox, Plus, Search, Eye, Calendar, Package, CheckCircle, Clock, XCircle, ClipboardList, User } from 'lucide-react'
import RecepcionModal from '../../components/Modal/RecepcionModal'
import RecepcionDetailModal from '../../components/Modal/RecepcionDetailModal'
import TareaDetailModal from '../../components/Modal/TareaDetailModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../../contexts/AuthContext'

export default function Recepcion() {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedRecepcion, setSelectedRecepcion] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [isTareaDetailModalOpen, setIsTareaDetailModalOpen] = useState(false)
  const [selectedTareaId, setSelectedTareaId] = useState(null)

  // Determinar rol - Solo Recepcionista y Admin pueden crear recepciones
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const rolNormalizado = userRol?.toLowerCase()?.normalize("NFD").replace(/[\u0300-\u036f]/g, "")?.trim()
  const isAdmin = rolNormalizado === 'administrador' || rolNormalizado?.includes('admin')
  const isRecepcionista = rolNormalizado === 'recepcionista' || rolNormalizado?.includes('recepcion')
  const puedeCrearRecepcion = isAdmin || isRecepcionista

  // Cargar recepciones
  const { data: recepcionesData, isLoading } = useQuery({
    queryKey: ['recepciones', filtroEstado],
    queryFn: () => api.getRecepciones({
      tipo_recepcion: 'ESTANDAR',
      estado: filtroEstado || undefined
    })
  })

  const recepciones = recepcionesData?.data?.data || recepcionesData?.data || []

  const recepcionesFiltradas = recepciones.filter(recepcion =>
    recepcion.numero_recepcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recepcion.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recepcion.subbodega_destino?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obtener tareas de recepción (PUTAWAY)
  const { data: tareasRecepcion = [] } = useQuery({
    queryKey: ['tareas-recepcion'],
    queryFn: () => api.getTasks({ tipo_tarea: 'PUTAWAY' })
  })

  const handleViewDetails = (recepcion) => {
    setSelectedRecepcion(recepcion)
    setIsDetailModalOpen(true)
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return 'bg-green-100 text-green-800'
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800'
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'RECHAZADA':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return <CheckCircle className="w-4 h-4" />
      case 'EN_PROCESO':
        return <Clock className="w-4 h-4" />
      case 'RECHAZADA':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepción de Mercancía</h1>
          <p className="text-gray-600">Registra y gestiona la entrada de productos al almacén</p>
        </div>
        {puedeCrearRecepcion && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Recepción
          </button>
        )}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, proveedor o subbodega..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="COMPLETADA">Completada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
        </div>
      </div>

      {/* Recuadro de Tareas de Recepción */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-confirm-500" />
            Tareas de Recepción (Putaway)
          </h2>
          <span className="text-sm text-gray-500">
            {tareasRecepcion.length} {tareasRecepcion.length === 1 ? 'tarea' : 'tareas'}
          </span>
        </div>
        
        {tareasRecepcion.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No hay tareas de recepción creadas</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tareasRecepcion.slice(0, 10).map((tarea) => (
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
            {tareasRecepcion.length > 10 && (
              <p className="text-xs text-center text-gray-500 pt-2">
                Mostrando 10 de {tareasRecepcion.length} tareas
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lista de Recepciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Cargando recepciones...</p>
          </div>
        ) : recepcionesFiltradas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No hay recepciones que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subbodega Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recepcionesFiltradas.map((recepcion) => (
                  <tr key={recepcion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {recepcion.numero_recepcion || `REC-${recepcion.id}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {recepcion.proveedor || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {recepcion.subbodega_destino?.nombre || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(recepcion.estado)}`}>
                        {getEstadoIcon(recepcion.estado)}
                        {recepcion.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recepcion.fecha_recepcion
                        ? format(new Date(recepcion.fecha_recepcion), 'dd/MM/yyyy HH:mm', { locale: es })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recepcion.usuario?.nombre || recepcion.usuario?.usuario || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(recepcion)}
                        className="text-confirm-500 hover:text-confirm-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Nueva Recepción */}
      <RecepcionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal de Detalle */}
      {selectedRecepcion && (
        <RecepcionDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedRecepcion(null)
          }}
          recepcionId={selectedRecepcion.id}
        />
      )}

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
