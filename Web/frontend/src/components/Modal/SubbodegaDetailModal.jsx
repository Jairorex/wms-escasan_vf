import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  Warehouse, 
  Thermometer, 
  Package, 
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'
import Modal from './Modal'
import { useNotification } from '../../contexts/NotificationContext'

export default function SubbodegaDetailModal({ isOpen, onClose, subbodega }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const [temperatura, setTemperatura] = useState('')

  // Obtener detalles completos
  const { data: detalles, isLoading } = useQuery({
    queryKey: ['subbodega', subbodega?.id],
    queryFn: () => api.getSubbodega(subbodega.id),
    enabled: isOpen && !!subbodega?.id
  })

  // Mutación para registrar temperatura
  const registrarTempMutation = useMutation({
    mutationFn: (temp) => api.registrarTemperaturaSubbodega(subbodega.id, { temperatura: temp }),
    onSuccess: (data) => {
      success('Temperatura registrada')
      setTemperatura('')
      queryClient.invalidateQueries({ queryKey: ['subbodega', subbodega.id] })
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleRegistrarTemperatura = () => {
    if (!temperatura) {
      showError('Ingrese una temperatura')
      return
    }
    registrarTempMutation.mutate(parseFloat(temperatura))
  }

  if (!subbodega) return null

  const data = detalles?.data || subbodega

  const getTipoColor = (tipo) => {
    const colores = {
      'PICKING': 'bg-blue-100 text-blue-800',
      'RESGUARDO': 'bg-gray-100 text-gray-800',
      'CADENA_FRIA': 'bg-cyan-100 text-cyan-800',
      'QUIMICOS': 'bg-orange-100 text-orange-800',
      'ALTO_VALOR': 'bg-yellow-100 text-yellow-800',
      'CUARENTENA': 'bg-red-100 text-red-800',
      'DESTRUCCION': 'bg-red-200 text-red-900',
      'IMPORTACION': 'bg-purple-100 text-purple-800'
    }
    return colores[tipo] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-escasan-green-500" />
          {data.nombre}
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Info básica */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Código</p>
            <p className="font-medium">{data.codigo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tipo</p>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getTipoColor(data.tipo)}`}>
              {data.tipo}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Descripción</p>
            <p className="font-medium">{data.descripcion || 'Sin descripción'}</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.ubicaciones_count || 0}</p>
            <p className="text-sm text-gray-500">Ubicaciones</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.stock_total || 0}</p>
            <p className="text-sm text-gray-500">Stock Total</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            {data.necesita_reabastecimiento ? (
              <>
                <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-amber-700">Reabastecimiento</p>
                <p className="text-sm text-amber-600">Necesario</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Stock</p>
                <p className="text-sm text-green-600">OK</p>
              </>
            )}
          </div>
        </div>

        {/* Control de temperatura */}
        {data.requiere_temperatura && (
          <div className="bg-cyan-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-cyan-900 flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Control de Temperatura
              </h4>
              <span className="text-sm text-cyan-700">
                Rango: {data.temperatura_min}°C - {data.temperatura_max}°C
              </span>
            </div>

            {/* Historial de temperatura */}
            {data.historial_temperatura && (
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-cyan-900">
                    {data.historial_temperatura.temperatura_promedio != null 
                      ? Number(data.historial_temperatura.temperatura_promedio).toFixed(1) 
                      : '-'}°C
                  </p>
                  <p className="text-xs text-cyan-700">Promedio</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-cyan-900">
                    {data.historial_temperatura.temperatura_minima != null 
                      ? Number(data.historial_temperatura.temperatura_minima).toFixed(1) 
                      : '-'}°C
                  </p>
                  <p className="text-xs text-cyan-700">Mínima</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-cyan-900">
                    {data.historial_temperatura.temperatura_maxima != null 
                      ? Number(data.historial_temperatura.temperatura_maxima).toFixed(1) 
                      : '-'}°C
                  </p>
                  <p className="text-xs text-cyan-700">Máxima</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-cyan-900">
                    {data.historial_temperatura.total_lecturas || 0}
                  </p>
                  <p className="text-xs text-cyan-700">Lecturas</p>
                </div>
              </div>
            )}

            {/* Registrar temperatura */}
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
                placeholder="Temperatura actual..."
                className="flex-1 px-3 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <button
                onClick={handleRegistrarTemperatura}
                disabled={registrarTempMutation.isLoading}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
              >
                {registrarTempMutation.isLoading ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        )}

        {/* Ubicaciones */}
        {data.ubicaciones && data.ubicaciones.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Ubicaciones Asignadas</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {data.ubicaciones.map(ubicacion => (
                <div key={ubicacion.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{ubicacion.codigo}</span>
                    <span className="text-sm text-gray-500">
                      {ubicacion.pasillo}-{ubicacion.estante}-{ubicacion.nivel}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    ubicacion.estado === 'DISPONIBLE' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {ubicacion.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

