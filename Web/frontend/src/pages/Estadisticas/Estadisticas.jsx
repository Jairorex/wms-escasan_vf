import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Users, BarChart3, TrendingUp, Clock } from 'lucide-react'

export default function Estadisticas() {
  const { user } = useAuth()
  // El rol puede venir como string o como objeto con propiedad nombre
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const isAdmin = userRol?.toLowerCase() === 'administrador'
  const isSupervisor = userRol?.toLowerCase() === 'supervisor'

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ['tareas-kpis'],
    queryFn: () => api.getTareasKpis()
  })

  const { data: supervisoresStats, isLoading: loadingStats } = useQuery({
    queryKey: ['supervisores-stats'],
    queryFn: () => api.getSupervisoresStats(),
    enabled: isAdmin
  })

  const kpiData = kpis?.data || {}
  const resumen = kpiData.resumen || {}
  const porTipo = kpiData.por_tipo || {}
  const porOperario = kpiData.por_operario || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas y KPIs</h1>
        <p className="text-gray-600">Métricas de rendimiento y productividad</p>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tareas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingKpis ? '...' : resumen.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingKpis ? '...' : resumen.completadas || 0}
              </p>
              {resumen.total > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((resumen.completadas / resumen.total) * 100)}% de completitud
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-50">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingKpis ? '...' : resumen.tiempo_promedio_formateado || 'N/A'}
              </p>
              {resumen.tiempo_promedio_minutos && (
                <p className="text-xs text-gray-500 mt-1">
                  {resumen.tiempo_promedio_minutos} minutos
                </p>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-50">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Supervisores</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loadingStats ? '...' : supervisoresStats?.data?.total_supervisores || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {supervisoresStats?.data?.total_operarios || 0} operarios totales
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tareas por Tipo */}
      {Object.keys(porTipo).length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Tareas por Tipo</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(porTipo).map(([tipo, datos]) => (
                <div key={tipo} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{tipo}</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">Total: <span className="font-medium">{datos.total}</span></p>
                    <p className="text-green-600">Completadas: <span className="font-medium">{datos.completadas}</span></p>
                    <p className="text-yellow-600">En Proceso: <span className="font-medium">{datos.en_proceso}</span></p>
                    <p className="text-blue-600">Pendientes: <span className="font-medium">{datos.pendientes}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tareas por Operario (Solo Supervisor y Admin) */}
      {(isAdmin || isSupervisor) && porOperario.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Operario</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tareas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completadas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiempo Promedio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {porOperario.map((item) => (
                    <tr key={item.usuario_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{item.usuario_nombre}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{item.total}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-green-600 font-medium">{item.completadas}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {item.tiempo_promedio 
                            ? `${Math.floor(item.tiempo_promedio / 60)}h ${item.tiempo_promedio % 60}m`
                            : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de Supervisores (Solo Admin) */}
      {isAdmin && supervisoresStats?.data?.supervisores && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Supervisores y sus Equipos</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {supervisoresStats.data.supervisores.map((supervisor) => (
                <div key={supervisor.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{supervisor.nombre}</h4>
                      <p className="text-sm text-gray-600">{supervisor.usuario} - {supervisor.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">{supervisor.operarios_count}</p>
                      <p className="text-xs text-gray-500">Operarios</p>
                    </div>
                  </div>
                  {supervisor.operarios && supervisor.operarios.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Operarios asignados:</p>
                      <div className="flex flex-wrap gap-2">
                        {supervisor.operarios.map((operario) => (
                          <span key={operario.id} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {operario.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

