import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Snowflake, Plus, Eye, Thermometer, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import RecepcionCadenaFriaModal from '../../components/Modal/RecepcionCadenaFriaModal'
import RecepcionCadenaFriaDetailModal from '../../components/Modal/RecepcionCadenaFriaDetailModal'

export default function RecepcionCadenaFria() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecepcion, setSelectedRecepcion] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const { success, error } = useNotification()
  const queryClient = useQueryClient()

  // Obtener recepciones de cadena fría
  const { data: recepciones, isLoading } = useQuery({
    queryKey: ['recepciones-frias'],
    queryFn: async () => {
      const response = await api.getRecepciones({ tipo: 'CADENA_FRIA' })
      return response.data || []
    }
  })

  const handleViewDetail = (recepcion) => {
    setSelectedRecepcion(recepcion)
    setIsDetailModalOpen(true)
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      'PENDIENTE': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      'EN_PROCESO': { color: 'bg-blue-100 text-blue-800', icon: Thermometer },
      'COMPLETADA': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'RECHAZADA': { color: 'bg-red-100 text-red-800', icon: XCircle },
    }
    const config = estados[estado] || estados['PENDIENTE']
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {estado}
      </span>
    )
  }

  const getTemperaturaBadge = (temperatura, valida) => {
    if (temperatura === null || temperatura === undefined) {
      return <span className="text-gray-400">N/A</span>
    }
    const colorClass = valida ? 'text-green-600' : 'text-red-600'
    return (
      <span className={`inline-flex items-center gap-1 ${colorClass} font-medium`}>
        <Thermometer className="w-4 h-4" />
        {temperatura}°C
        {!valida && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepción Cadena Fría</h1>
          <p className="text-gray-600">Control de temperatura para productos refrigerados</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Recepción Fría
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow p-6 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Snowflake className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Control de Cadena Fría</h3>
            <p className="text-gray-600">
              Registra la temperatura al recibir productos. Los productos fuera del rango térmico
              serán marcados como rechazados y redirigidos a cuarentena o destrucción.
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Recepciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recepciones de Cadena Fría</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando recepciones...</p>
          </div>
        ) : recepciones && recepciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Recepción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperatura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recepciones.map((recepcion) => (
                  <tr key={recepcion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {recepcion.numero_recepcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recepcion.proveedor || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getTemperaturaBadge(recepcion.temperatura_recibida, recepcion.temperatura_valida)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(recepcion.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recepcion.fecha_recepcion ? new Date(recepcion.fecha_recepcion).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetail(recepcion)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-confirm-500 text-white rounded hover:bg-confirm-600 transition-colors"
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
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Snowflake className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>No hay recepciones de cadena fría registradas</p>
            <p className="text-sm mt-2">Haz clic en "Nueva Recepción Fría" para comenzar</p>
          </div>
        )}
      </div>

      {/* Modal de Nueva Recepción */}
      <RecepcionCadenaFriaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal de Detalle */}
      {selectedRecepcion && (
        <RecepcionCadenaFriaDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedRecepcion(null)
          }}
          recepcion={selectedRecepcion}
        />
      )}
    </div>
  )
}

