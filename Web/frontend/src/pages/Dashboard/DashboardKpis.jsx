import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users,
  Activity
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function DashboardKpis() {
  const { user } = useAuth()
  // El rol puede venir como string o como objeto con propiedad nombre
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const isAdmin = userRol?.toLowerCase() === 'administrador'
  const isSupervisor = userRol?.toLowerCase() === 'supervisor'

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['tareas-kpis'],
    queryFn: () => api.getTareasKpis()
  })

  const { data: supervisoresStats } = useQuery({
    queryKey: ['supervisores-stats'],
    queryFn: () => api.getSupervisoresStats(),
    enabled: isAdmin
  })

  const kpiData = kpis?.data || {}
  const resumen = kpiData.resumen || {}

  const stats = [
    {
      name: 'Total Tareas',
      value: resumen.total || 0,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Completadas',
      value: resumen.completadas || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'En Proceso',
      value: resumen.en_proceso || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Pendientes',
      value: resumen.pendientes || 0,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'Tiempo Promedio',
      value: resumen.tiempo_promedio_formateado || 'N/A',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: resumen.tiempo_promedio_minutos ? `${resumen.tiempo_promedio_minutos} min` : null,
    },
  ]

  // Agregar estadísticas de supervisores si es admin
  if (isAdmin && supervisoresStats?.data) {
    stats.push({
      name: 'Supervisores',
      value: supervisoresStats.data.total_supervisores || 0,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      subtitle: `${supervisoresStats.data.total_operarios || 0} operarios`,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

