import { format } from 'date-fns'
import es from 'date-fns/locale/es';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Calendar,
  Tag
} from 'lucide-react'
import Modal from './Modal'

export default function AlertaDetailModal({ isOpen, onClose, alerta }) {
  if (!alerta) return null

  const getNivelIcon = (nivel) => {
    switch (nivel) {
      case 'ALTO':
        return <AlertCircle className="w-6 h-6 text-red-600" />
      case 'MEDIO':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'BAJO':
        return <Info className="w-6 h-6 text-blue-600" />
      default:
        return <Info className="w-6 h-6 text-gray-600" />
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Alerta"
      size="md"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className={`border-l-4 rounded-lg p-4 ${getNivelColor(alerta.nivel_riesgo)}`}>
          <div className="flex items-start gap-3">
            {getNivelIcon(alerta.nivel_riesgo)}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{alerta.tipo}</h3>
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getNivelColor(alerta.nivel_riesgo)}`}>
                {alerta.nivel_riesgo}
              </span>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
            {alerta.descripcion}
          </p>
        </div>

        {/* Información Adicional */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <p className="text-gray-900">{alerta.estado}</p>
          </div>
          {alerta.fecha_alerta && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha de Alerta
              </label>
              <p className="text-gray-900">
                {format(new Date(alerta.fecha_alerta), 'PPp', { locale: es })}
              </p>
            </div>
          )}
          {alerta.tabla_referencia && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="w-4 h-4 inline mr-1" />
                Referencia
              </label>
              <p className="text-gray-900">
                {alerta.tabla_referencia} #{alerta.referencia_id}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
          {alerta.estado === 'PENDIENTE' && (
            <button className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors">
              Marcar como Resuelta
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

