import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  RefreshCw, 
  Package, 
  ArrowRight,
  Clock,
  User,
  Calendar
} from 'lucide-react'
import Modal from './Modal'

export default function ReabastecimientoDetailModal({ isOpen, onClose, reabastecimiento }) {
  // Obtener detalles completos
  const { data: detalles, isLoading } = useQuery({
    queryKey: ['reabastecimiento', reabastecimiento?.id],
    queryFn: () => api.getReabastecimiento(reabastecimiento.id),
    enabled: isOpen && !!reabastecimiento?.id
  })

  if (!reabastecimiento) return null

  const data = detalles?.data || reabastecimiento

  const getEstadoColor = (estado) => {
    const colores = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'APROBADO': 'bg-blue-100 text-blue-800',
      'EN_PROCESO': 'bg-purple-100 text-purple-800',
      'COMPLETADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    }
    return colores[estado] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-escasan-green-500" />
          Reabastecimiento {data.numero_reabastecimiento}
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Info básica */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full ${getEstadoColor(data.estado)}`}>
              {data.estado}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tipo</p>
            <p className="font-medium">{data.tipo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Prioridad</p>
            <p className="font-medium">{data.prioridad}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha Solicitud</p>
            <p className="font-medium">{new Date(data.fecha_solicitud).toLocaleString()}</p>
          </div>
        </div>

        {/* Flujo */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Origen</p>
            <p className="font-medium text-gray-900">{data.subbodega_origen?.nombre || 'N/A'}</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-400" />
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Destino</p>
            <p className="font-medium text-gray-900">{data.subbodega_destino?.nombre || 'N/A'}</p>
          </div>
        </div>

        {/* Usuarios involucrados */}
        <div className="grid grid-cols-3 gap-4">
          {data.solicitante && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Solicitado por</p>
                <p className="text-sm font-medium">{data.solicitante.nombre}</p>
              </div>
            </div>
          )}
          {data.aprobador && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Aprobado por</p>
                <p className="text-sm font-medium">{data.aprobador.nombre}</p>
              </div>
            </div>
          )}
          {data.ejecutor && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Ejecutado por</p>
                <p className="text-sm font-medium">{data.ejecutor.nombre}</p>
              </div>
            </div>
          )}
        </div>

        {/* Productos */}
        {data.detalles && data.detalles.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Productos</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Solicitada</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Aprobada</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Enviada</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.detalles.map((detalle) => (
                    <tr key={detalle.id}>
                      <td className="px-4 py-2 text-sm">
                        {detalle.producto?.nombre || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {detalle.lote?.lote_codigo || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {detalle.cantidad_solicitada}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {detalle.cantidad_aprobada || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        {detalle.cantidad_enviada}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          detalle.estado === 'COMPLETADO' 
                            ? 'bg-green-100 text-green-800'
                            : detalle.estado === 'PENDIENTE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {detalle.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Observaciones */}
        {data.observaciones && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Observaciones</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{data.observaciones}</p>
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

