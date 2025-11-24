import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Package, MapPin, Hash, Box } from 'lucide-react'
import Modal from './Modal'

export default function InventarioDetailModal({ isOpen, onClose, inventarioId }) {
  const { data: inventario, isLoading } = useQuery({
    queryKey: ['inventario', inventarioId],
    queryFn: () => api.getInventarioItem(inventarioId),
    enabled: !!inventarioId && isOpen
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Inventario"
      size="md"
    >
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Cargando detalles...</p>
        </div>
      ) : inventario ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Cantidad</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {inventario.cantidad || 0}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Estado</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {inventario.estado || 'N/A'}
              </p>
            </div>
          </div>

          {/* Lote */}
          {inventario.lote && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Lote</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de Lote</label>
                  <p className="text-gray-900">{inventario.lote.lote_codigo}</p>
                </div>
                {inventario.lote.producto && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                    <p className="text-gray-900">
                      {inventario.lote.producto.nombre} ({inventario.lote.producto.sku})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ubicación */}
          {inventario.ubicacion && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Ubicación</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <p className="text-gray-900">{inventario.ubicacion.codigo}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Pasillo</label>
                    <p className="text-sm text-gray-900">{inventario.ubicacion.pasillo || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Estante</label>
                    <p className="text-sm text-gray-900">{inventario.ubicacion.estante || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nivel</label>
                    <p className="text-sm text-gray-900">{inventario.ubicacion.nivel || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">No se pudo cargar la información del inventario</p>
        </div>
      )}
    </Modal>
  )
}

