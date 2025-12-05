import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  Inbox, 
  Package, 
  MapPin, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Hash,
  Thermometer,
  Warehouse
} from 'lucide-react'
import Modal from './Modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function RecepcionDetailModal({ isOpen, onClose, recepcionId }) {
  const { data: recepcionData, isLoading } = useQuery({
    queryKey: ['recepcion', recepcionId],
    queryFn: () => api.getRecepcion(recepcionId),
    enabled: isOpen && !!recepcionId
  })

  const recepcion = recepcionData?.data || recepcionData

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
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'EN_PROCESO':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'RECHAZADA':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Recepción: ${recepcion?.numero_recepcion || `REC-${recepcionId}`}`}
      size="lg"
    >
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Cargando detalles...</p>
        </div>
      ) : recepcion ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Número de Recepción</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {recepcion.numero_recepcion || `REC-${recepcion.id}`}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {getEstadoIcon(recepcion.estado)}
                <span className="text-sm text-gray-600">Estado</span>
              </div>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(recepcion.estado)}`}>
                {recepcion.estado}
              </span>
            </div>
          </div>

          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                Tipo de Recepción
              </label>
              <p className="text-gray-900">{recepcion.tipo_recepcion || 'ESTANDAR'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Warehouse className="w-4 h-4" />
                Subbodega Destino
              </label>
              <p className="text-gray-900">
                {recepcion.subbodega_destino?.nombre || 'N/A'}
                {recepcion.subbodega_destino?.tipo && (
                  <span className="ml-2 text-xs text-gray-500">({recepcion.subbodega_destino.tipo})</span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <User className="w-4 h-4" />
                Proveedor
              </label>
              <p className="text-gray-900">{recepcion.proveedor || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de Recepción
              </label>
              <p className="text-gray-900">
                {recepcion.fecha_recepcion
                  ? format(new Date(recepcion.fecha_recepcion), 'dd/MM/yyyy HH:mm', { locale: es })
                  : 'N/A'}
              </p>
            </div>
            {recepcion.usuario && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Usuario
                </label>
                <p className="text-gray-900">
                  {recepcion.usuario.nombre || recepcion.usuario.usuario || 'N/A'}
                </p>
              </div>
            )}
            {recepcion.documento_proveedor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documento Proveedor
                </label>
                <p className="text-gray-900">{recepcion.documento_proveedor}</p>
              </div>
            )}
          </div>

          {/* Detalles de Productos */}
          {recepcion.detalles && recepcion.detalles.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Productos Recibidos ({recepcion.detalles.length})
              </h4>
              <div className="space-y-3">
                {recepcion.detalles.map((detalle, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {detalle.producto?.nombre || detalle.producto?.sku || 'Producto'}
                        </p>
                        {detalle.producto?.sku && (
                          <p className="text-sm text-gray-500">SKU: {detalle.producto.sku}</p>
                        )}
                        {detalle.lote && (
                          <p className="text-sm text-gray-500 mt-1">
                            Lote: {detalle.lote.codigo_lote || detalle.lote.lote_codigo}
                            {detalle.lote.fecha_caducidad && (
                              <span className="ml-2">
                                - Vence: {format(new Date(detalle.lote.fecha_caducidad), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {detalle.cantidad_recibida || detalle.cantidad || 0} unidades
                        </p>
                        {detalle.ubicacion_destino && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                            <MapPin className="w-3 h-3" />
                            {detalle.ubicacion_destino.codigo}
                          </p>
                        )}
                      </div>
                    </div>
                    {detalle.observaciones && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        {detalle.observaciones}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {recepcion.observaciones && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {recepcion.observaciones}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">No se encontró la recepción</p>
        </div>
      )}
    </Modal>
  )
}

