import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { 
  Package, 
  Calendar, 
  Hash,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Modal from './Modal'

export default function LoteDetailModal({ isOpen, onClose, loteId }) {
  const { data: lote, isLoading } = useQuery({
    queryKey: ['lote', loteId],
    queryFn: () => api.getLote(loteId),
    enabled: !!loteId && isOpen
  })

  const isExpired = lote?.fecha_caducidad && new Date(lote.fecha_caducidad) < new Date()
  const daysUntilExpiration = lote?.fecha_caducidad ? Math.floor((new Date(lote.fecha_caducidad) - new Date()) / (1000 * 60 * 60 * 24)) : null
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration > 0 && {
    days: daysUntilExpiration
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Lote"
      size="lg"
    >
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Cargando detalles...</p>
        </div>
      ) : lote ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Código de Lote</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {lote.lote_codigo}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Cantidad Original</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {lote.cantidad_original || 0}
              </p>
            </div>
          </div>

          {/* Producto */}
          {lote.producto && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Producto Asociado</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <p className="text-gray-900">{lote.producto.sku}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <p className="text-gray-900">{lote.producto.nombre}</p>
                </div>
                {lote.producto.descripcion && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <p className="text-gray-600">{lote.producto.descripcion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            {lote.fecha_fabricacion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Fabricación
                </label>
                <p className="text-gray-900">
                  {format(new Date(lote.fecha_fabricacion), 'PP', { locale: es })}
                </p>
              </div>
            )}
            {lote.fecha_caducidad && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Caducidad
                </label>
                <div className="flex items-center gap-2">
                  <p className={`text-gray-900 ${isExpired ? 'text-red-600 font-semibold' : ''}`}>
                    {format(new Date(lote.fecha_caducidad), 'PP', { locale: es })}
                  </p>
                  {isExpired && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Ya se venció
                    </span>
                  )}
                  {!isExpired && isExpiringSoon && isExpiringSoon.days <= 30 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Vence en {isExpiringSoon.days} {isExpiringSoon.days === 1 ? 'día' : 'días'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Información Adicional */}
          {lote.orden_compra_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Compra ID</label>
              <p className="text-gray-900">#{lote.orden_compra_id}</p>
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
          <p className="text-gray-500">No se pudo cargar la información del lote</p>
        </div>
      )}
    </Modal>
  )
}

