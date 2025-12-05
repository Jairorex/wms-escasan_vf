import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Thermometer, Plus, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import RegistrarTemperaturaModal from '../../components/Modal/RegistrarTemperaturaModal'

export default function ControlTemperatura() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubbodega, setSelectedSubbodega] = useState(null)
  const { success, error } = useNotification()
  const queryClient = useQueryClient()

  // Obtener subbodegas de cadena fría
  const { data: subbodegas, isLoading: loadingSubbodegas } = useQuery({
    queryKey: ['subbodegas-frias'],
    queryFn: async () => {
      try {
        const response = await api.getSubbodegas({ tipo: 'CADENA_FRIA' })
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(response)) {
          return response
        }
        if (response?.data && Array.isArray(response.data)) {
          return response.data
        }
        if (response?.success && Array.isArray(response.data)) {
          return response.data
        }
        return []
      } catch (error) {
        console.error('Error al cargar subbodegas:', error)
        return []
      }
    }
  })

  // Obtener últimas lecturas de temperatura
  const { data: lecturas, isLoading: loadingLecturas } = useQuery({
    queryKey: ['lecturas-temperatura'],
    queryFn: async () => {
      try {
        const response = await api.getLecturasTemperatura()
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(response)) {
          return response
        }
        if (response?.data && Array.isArray(response.data)) {
          return response.data
        }
        if (response?.success && Array.isArray(response.data)) {
          return response.data
        }
        return []
      } catch (error) {
        console.error('Error al cargar lecturas:', error)
        return []
      }
    },
    refetchInterval: 30000 // Refrescar cada 30 segundos
  })

  // Obtener alertas de temperatura activas
  const { data: alertasTemp, isLoading: loadingAlertas } = useQuery({
    queryKey: ['alertas-temperatura'],
    queryFn: async () => {
      const response = await api.getAlertas({ tipo: 'ALERTA_GENERAL', estado: 'PENDIENTE' })
      // Filtrar solo alertas relacionadas con temperatura
      const alertas = response.data || []
      return alertas.filter(a => a.descripcion?.toLowerCase().includes('temperatura'))
    }
  })

  const handleRegistrarTemp = (subbodega) => {
    setSelectedSubbodega(subbodega)
    setIsModalOpen(true)
  }

  const getTemperaturaStatus = (lectura, subbodega) => {
    if (!lectura) return { status: 'sin-datos', color: 'gray' }
    
    const temp = lectura.temperatura
    const min = subbodega?.temperatura_min ?? -20
    const max = subbodega?.temperatura_max ?? 8

    if (temp >= min && temp <= max) {
      return { status: 'normal', color: 'green', icon: CheckCircle }
    } else if (temp < min) {
      return { status: 'bajo', color: 'blue', icon: TrendingDown }
    } else {
      return { status: 'alto', color: 'red', icon: TrendingUp }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Temperatura</h1>
          <p className="text-gray-600">Monitoreo de temperaturas en subbodegas de cadena fría</p>
        </div>
      </div>

      {/* Alertas activas */}
      {alertasTemp && alertasTemp.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Alertas de Temperatura Activas</h3>
          </div>
          <ul className="space-y-2">
            {alertasTemp.map((alerta) => (
              <li key={alerta.id} className="flex items-center gap-2 text-sm text-red-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {alerta.descripcion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid de Subbodegas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingSubbodegas ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando subbodegas...</p>
          </div>
        ) : subbodegas && subbodegas.length > 0 ? (
          subbodegas.map((subbodega) => {
            const ultimaLectura = lecturas?.find(l => l.subbodega_id === subbodega.id)
            const tempStatus = getTemperaturaStatus(ultimaLectura, subbodega)
            const StatusIcon = tempStatus.icon || Thermometer

            return (
              <div
                key={subbodega.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
                  tempStatus.status === 'normal' ? 'border-green-200' :
                  tempStatus.status === 'sin-datos' ? 'border-gray-200' :
                  'border-red-300'
                }`}
              >
                <div className={`px-4 py-3 ${
                  tempStatus.status === 'normal' ? 'bg-green-50' :
                  tempStatus.status === 'sin-datos' ? 'bg-gray-50' :
                  'bg-red-50'
                }`}>
                  <h3 className="font-semibold text-gray-900">{subbodega.nombre}</h3>
                  <p className="text-sm text-gray-500">Tipo: {subbodega.tipo}</p>
                </div>

                <div className="p-4">
                  {/* Temperatura actual */}
                  <div className="flex items-center justify-center py-4">
                    <div className={`text-center ${
                      tempStatus.color === 'green' ? 'text-green-600' :
                      tempStatus.color === 'blue' ? 'text-blue-600' :
                      tempStatus.color === 'red' ? 'text-red-600' :
                      'text-gray-400'
                    }`}>
                      <StatusIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-4xl font-bold">
                        {ultimaLectura ? `${ultimaLectura.temperatura}°C` : 'N/A'}
                      </p>
                      <p className="text-sm mt-1">
                        {tempStatus.status === 'normal' ? 'Temperatura normal' :
                         tempStatus.status === 'alto' ? 'Temperatura alta' :
                         tempStatus.status === 'bajo' ? 'Temperatura baja' :
                         'Sin lecturas'}
                      </p>
                    </div>
                  </div>

                  {/* Rango permitido */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 text-center">
                      Rango permitido: <span className="font-medium">{subbodega.temperatura_min ?? '-20'}°C</span> a <span className="font-medium">{subbodega.temperatura_max ?? '8'}°C</span>
                    </p>
                  </div>

                  {/* Última lectura */}
                  {ultimaLectura && (
                    <div className="text-xs text-gray-500 text-center mb-4">
                      Última lectura: {new Date(ultimaLectura.fecha_lectura || ultimaLectura.created_at).toLocaleString()}
                    </div>
                  )}

                  {/* Botón registrar */}
                  <button
                    onClick={() => handleRegistrarTemp(subbodega)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Temperatura
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <Thermometer className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay subbodegas de cadena fría</h3>
            <p className="text-gray-500">Configure subbodegas de tipo "CADENA_FRIA" para monitorear temperaturas</p>
          </div>
        )}
      </div>

      {/* Historial de lecturas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historial de Lecturas</h3>
        </div>
        {loadingLecturas ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : lecturas && lecturas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subbodega</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temperatura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrado por</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lecturas.slice(0, 20).map((lectura) => (
                  <tr key={lectura.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lectura.subbodega?.nombre || `Subbodega #${lectura.subbodega_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={lectura.dentro_rango ? 'text-green-600' : 'text-red-600'}>
                        {lectura.temperatura}°C
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lectura.dentro_rango ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" /> Normal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          <AlertTriangle className="w-3 h-3" /> Fuera de rango
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lectura.fecha_lectura || lectura.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lectura.usuario?.nombre || 'Sistema'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No hay lecturas de temperatura registradas</p>
          </div>
        )}
      </div>

      {/* Modal Registrar Temperatura */}
      <RegistrarTemperaturaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedSubbodega(null)
        }}
        subbodega={selectedSubbodega}
      />
    </div>
  )
}

