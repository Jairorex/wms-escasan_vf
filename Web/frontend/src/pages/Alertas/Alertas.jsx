import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  CheckCircle,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  Package
} from 'lucide-react'
import AlertaDetailModal from '../../components/Modal/AlertaDetailModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Alertas() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const [filtroTipo, setFiltroTipo] = useState('all')
  const [filtroNivel, setFiltroNivel] = useState('all')
  const [busqueda, setBusqueda] = useState('')
  const [selectedAlerta, setSelectedAlerta] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const resolverMutation = useMutation({
    mutationFn: (id) => api.resolverAlerta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
    }
  })

  const generarAlertasMutation = useMutation({
    mutationFn: () => api.generarTodasLasAlertas(30),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
      success('Alertas generadas exitosamente')
    }
  })

  const handleResolver = async (id) => {
    if (confirm('¿Marcar esta alerta como resuelta?')) {
      resolverMutation.mutate(id)
    }
  }

  const handleGenerarAlertas = () => {
    if (confirm('¿Generar todas las alertas automáticas? Esto puede tomar unos momentos.')) {
      generarAlertasMutation.mutate()
    }
  }

  const { data: alertas, isLoading, refetch } = useQuery({
    queryKey: ['alertas', filtroTipo, filtroNivel],
    queryFn: async () => {
      try {
        const data = await api.getAlertas({ 
          estado: 'PENDIENTE',
          tipo: filtroTipo !== 'all' ? filtroTipo : undefined,
          nivel_riesgo: filtroNivel !== 'all' ? filtroNivel : undefined
        })
        return Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Error al cargar alertas:', err)
        return []
      }
    }
  })

  const alertasFiltradas = alertas?.filter(alerta =>
    alerta.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    alerta.tipo?.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  const getNivelIcon = (nivel) => {
    switch (nivel) {
      case 'ALTO':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'MEDIO':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'BAJO':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'ALTO':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'BAJO':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-600">Monitorea alertas del sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerarAlertas}
            disabled={generarAlertasMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${generarAlertasMutation.isPending ? 'animate-spin' : ''}`} />
            Generar Alertas
          </button>
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
                placeholder="Buscar alertas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tipo Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="VENCIMIENTO">Vencimiento</option>
              <option value="SIN_UBICACION">Sin Ubicación</option>
              <option value="STOCK_MIN">Stock Mínimo</option>
              <option value="STOCK_MAX">Stock Máximo</option>
              <option value="CAPACIDAD_EXCEDIDA">Capacidad Excedida</option>
            </select>
          </div>

          {/* Nivel Filter */}
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Todos los niveles</option>
            <option value="ALTO">Alto</option>
            <option value="MEDIO">Medio</option>
            <option value="BAJO">Bajo</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Cargando alertas...</p>
          </div>
        ) : alertasFiltradas.length > 0 ? (
          alertasFiltradas.map((alerta) => (
            <div
              key={alerta.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${getNivelColor(alerta.nivel_riesgo)}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getNivelIcon(alerta.nivel_riesgo)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {alerta.tipo}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getNivelColor(alerta.nivel_riesgo)}`}>
                      {alerta.nivel_riesgo}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    {alerta.descripcion}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {alerta.fecha_alerta && format(new Date(alerta.fecha_alerta), 'PPp', { locale: es })}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleResolver(alerta.id)}
                        disabled={resolverMutation.isPending}
                        className="px-3 py-1 text-sm bg-confirm-500 text-white rounded hover:bg-confirm-600 disabled:opacity-50"
                      >
                        Resolver
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAlerta(alerta)
                          setIsDetailModalOpen(true)
                        }}
                        className="px-3 py-1 text-sm bg-confirm-500 text-white rounded hover:bg-confirm-600"
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">No hay alertas pendientes</p>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      <AlertaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedAlerta(null)
        }}
        alerta={selectedAlerta}
      />
    </div>
  )
}

