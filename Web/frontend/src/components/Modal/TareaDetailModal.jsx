import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { 
  ClipboardList, 
  Package, 
  MapPin, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Hash,
  Inbox,
  CheckSquare,
  User
} from 'lucide-react'
import Modal from './Modal'

export default function TareaDetailModal({ isOpen, onClose, tareaId }) {
  const { data: tarea, isLoading } = useQuery({
    queryKey: ['tarea', tareaId],
    queryFn: () => api.getTask(tareaId),
    enabled: !!tareaId && isOpen
  })

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'CREADA':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'EN_CURSO':
        return <ClipboardList className="w-5 h-5 text-yellow-600" />
      case 'COMPLETADA':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'CANCELADA':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'CREADA':
        return 'bg-blue-100 text-blue-800'
      case 'EN_CURSO':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETADA':
        return 'bg-green-100 text-green-800'
      case 'CANCELADA':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Tarea"
      size="lg"
    >
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Cargando detalles...</p>
        </div>
      ) : tarea ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Número de Tarea</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {tarea.numero_tarea || `Tarea #${tarea.id}`}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {getEstadoIcon(tarea.estado)}
                <span className="text-sm text-gray-600">Estado</span>
              </div>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(tarea.estado)}`}>
                {tarea.estado}
              </span>
            </div>
          </div>

          {/* Tipo, Prioridad y Operario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tarea</label>
              <p className="text-gray-900">{tarea.tipo_tarea}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <p className="text-gray-900">{tarea.prioridad || 'Normal'}</p>
            </div>
            {tarea.usuario_asignado && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Operario Asignado
                </label>
                <p className="text-gray-900">
                  {tarea.usuario_asignado.nombre || tarea.usuario_asignado.usuario}
                  {tarea.usuario_asignado.rol && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({typeof tarea.usuario_asignado.rol === 'string' ? tarea.usuario_asignado.rol : tarea.usuario_asignado.rol.nombre})
                    </span>
                  )}
                </p>
              </div>
            )}
            {!tarea.usuario_asignado && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Operario Asignado
                </label>
                <p className="text-gray-400 italic">Sin asignar</p>
              </div>
            )}
            {tarea.fecha_creacion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                <p className="text-gray-900">
                  {format(new Date(tarea.fecha_creacion), 'PPp', { locale: es })}
                </p>
              </div>
            )}
            {tarea.fecha_inicio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                <p className="text-gray-900">
                  {format(new Date(tarea.fecha_inicio), 'PPp', { locale: es })}
                </p>
              </div>
            )}
            {tarea.fecha_completado && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Completado</label>
                <p className="text-gray-900">
                  {format(new Date(tarea.fecha_completado), 'PPp', { locale: es })}
                </p>
              </div>
            )}
          </div>

          {/* Sección de Checkin para Recepciones (PUTAWAY) */}
          {tarea.tipo_tarea === 'PUTAWAY' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h4 className="text-md font-semibold text-gray-900">Check-in de Recepción</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700">
                    <strong>Origen:</strong> Recepción (Entrada Externa)
                  </span>
                </div>
                <p className="text-gray-600 ml-6">
                  Esta tarea corresponde a una recepción de mercancía. Verifica los productos recibidos antes de ubicarlos.
                </p>
              </div>
            </div>
          )}

          {/* Detalles de Tarea */}
          {(tarea.detalles || tarea.detalle_tareas) && (tarea.detalles?.length > 0 || tarea.detalle_tareas?.length > 0) && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Detalles de la Tarea</h4>
              <div className="space-y-3">
                {(tarea.detalles || tarea.detalle_tareas || []).map((detalle, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Producto:</span>
                        <span className="font-medium text-gray-900">
                          {detalle.producto?.nombre || detalle.lote?.producto?.nombre || 'N/A'}
                        </span>
                        {detalle.producto?.sku && (
                          <span className="text-xs text-gray-500">({detalle.producto.sku})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Lote:</span>
                        <span className="font-medium text-gray-900">
                          {detalle.lote?.lote_codigo || 'N/A'}
                        </span>
                      </div>
                      {(detalle.ubicacion_origen || tarea.tipo_tarea === 'PUTAWAY') && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Ubicación Origen:</span>
                          <span className="font-medium text-gray-900">
                            {detalle.ubicacion_origen?.codigo || (tarea.tipo_tarea === 'PUTAWAY' ? 'RECEPCIÓN' : 'N/A')}
                          </span>
                        </div>
                      )}
                      {detalle.ubicacion_destino && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Ubicación Destino:</span>
                          <span className="font-medium text-gray-900">
                            {detalle.ubicacion_destino?.codigo || 'N/A'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Cantidad:</span>
                        <span className="font-medium text-gray-900">
                          {detalle.cantidad_completada || 0} / {detalle.cantidad_solicitada || 0}
                        </span>
                      </div>
                    </div>
                    {(detalle.lote?.producto || detalle.producto) && (
                      <div className="mt-2 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Producto:</span> {detalle.lote?.producto?.nombre || detalle.producto?.nombre} ({detalle.lote?.producto?.sku || detalle.producto?.sku})
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">No se pudo cargar la información de la tarea</p>
        </div>
      )}
    </Modal>
  )
}

