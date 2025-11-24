import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  ClipboardList, 
  AlertTriangle
} from 'lucide-react'
import DashboardKpis from './DashboardKpis'
import { useAuth } from '../../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  // El rol puede venir como string o como objeto con propiedad nombre
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const isOperario = userRol?.toLowerCase() === 'operario'

  const { data: tareas, isLoading: loadingTareas } = useQuery({
    queryKey: ['tareas-pendientes'],
    queryFn: () => api.getTasks({ estado: isOperario ? undefined : 'CREADA' })
  })

  const { data: alertas, isLoading: loadingAlertas } = useQuery({
    queryKey: ['alertas-pendientes'],
    queryFn: () => api.getAlertas({ estado: 'PENDIENTE' })
  })

  return (
    <div className="space-y-6">
      {/* KPIs Dashboard */}
      <DashboardKpis />

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Tareas Recientes</h3>
        </div>
        <div className="p-6">
          {loadingTareas ? (
            <p className="text-gray-500">Cargando tareas...</p>
          ) : tareas && tareas.length > 0 ? (
            <div className="space-y-4">
              {tareas.slice(0, 5).map((tarea) => (
                <div key={tarea.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{tarea.numero_tarea || `Tarea #${tarea.id}`}</p>
                    <p className="text-sm text-gray-500">{tarea.tipo_tarea} - {tarea.estado}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    tarea.estado === 'CREADA' ? 'bg-blue-100 text-blue-800' :
                    tarea.estado === 'EN_CURSO' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {tarea.estado}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay tareas pendientes</p>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Alertas Recientes</h3>
        </div>
        <div className="p-6">
          {loadingAlertas ? (
            <p className="text-gray-500">Cargando alertas...</p>
          ) : alertas && alertas.length > 0 ? (
            <div className="space-y-4">
              {alertas.slice(0, 5).map((alerta) => (
                <div key={alerta.id} className="flex items-start p-4 border rounded-lg">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${
                    alerta.nivel_riesgo === 'ALTO' ? 'text-red-600' :
                    alerta.nivel_riesgo === 'MEDIO' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alerta.tipo}</p>
                    <p className="text-sm text-gray-600">{alerta.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay alertas pendientes</p>
          )}
        </div>
      </div>
    </div>
  )
}

