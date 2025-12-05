import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Snowflake, Thermometer, Package, Calendar, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function RecepcionCadenaFriaDetailModal({ isOpen, onClose, recepcion }) {
  if (!recepcion) return null

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
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {estado}
      </span>
    )
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Snowflake className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Recepción #{recepcion.numero_recepcion}
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">Cadena Fría</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Estado y Temperatura */}
                  <div className="flex items-center justify-between">
                    {getEstadoBadge(recepcion.estado)}
                    <div className={`flex items-center gap-2 text-lg font-semibold ${
                      recepcion.temperatura_valida ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <Thermometer className="w-6 h-6" />
                      {recepcion.temperatura_recibida !== null ? `${recepcion.temperatura_recibida}°C` : 'N/A'}
                      {!recepcion.temperatura_valida && (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Alerta si fue rechazada */}
                  {recepcion.estado === 'RECHAZADA' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                        <XCircle className="w-5 h-5" />
                        Producto Rechazado
                      </div>
                      <p className="text-red-700 text-sm">
                        {recepcion.motivo_rechazo || 'Temperatura fuera del rango permitido'}
                      </p>
                      {recepcion.observaciones_temperatura && (
                        <p className="text-red-600 text-sm mt-2">
                          <strong>Observaciones:</strong> {recepcion.observaciones_temperatura}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Proveedor */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Información del Proveedor</h4>
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Proveedor:</span>
                          <span className="font-medium">{recepcion.proveedor || 'N/A'}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-600">Documento:</span>{' '}
                          <span className="font-medium">{recepcion.documento_proveedor || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Fechas</h4>
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Recepción:</span>
                          <span className="font-medium">
                            {recepcion.fecha_recepcion ? new Date(recepcion.fecha_recepcion).toLocaleString() : 'N/A'}
                          </span>
                        </p>
                        {recepcion.fecha_completada && (
                          <p className="text-sm">
                            <span className="text-gray-600">Completada:</span>{' '}
                            <span className="font-medium">
                              {new Date(recepcion.fecha_completada).toLocaleString()}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalles de productos */}
                  {recepcion.detalles && recepcion.detalles.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Productos Recibidos</h4>
                      <div className="space-y-3">
                        {recepcion.detalles.map((detalle, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Package className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {detalle.producto?.nombre || 'Producto'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Lote: {detalle.lote?.codigo_lote || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {detalle.cantidad_recibida || 0} unidades
                              </p>
                              {detalle.temperatura_producto !== null && (
                                <p className={`text-sm ${detalle.temperatura_aceptable ? 'text-green-600' : 'text-red-600'}`}>
                                  <Thermometer className="inline w-3 h-3 mr-1" />
                                  {detalle.temperatura_producto}°C
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subbodega destino */}
                  {recepcion.subbodega_destino && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Subbodega destino:</strong> {recepcion.subbodega_destino.nombre}
                        {recepcion.subbodega_destino.temperatura_min !== null && (
                          <span className="ml-2">
                            ({recepcion.subbodega_destino.temperatura_min}°C - {recepcion.subbodega_destino.temperatura_max}°C)
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Observaciones */}
                  {recepcion.observaciones && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <strong>Observaciones:</strong> {recepcion.observaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

