import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Scan, Package, MapPin, CheckCircle, XCircle } from 'lucide-react'
import Modal from './Modal'

export default function ValidateScanModal({ isOpen, onClose, tareaId, onSuccess }) {
  const [scanData, setScanData] = useState({
    codigo_ubicacion: '',
    codigo_lote: '',
    cantidad: ''
  })
  const [result, setResult] = useState(null)

  const mutation = useMutation({
    mutationFn: (data) => api.validateScan({
      tarea_id: tareaId,
      ...data
    }),
    onSuccess: (response) => {
      setResult({
        success: true,
        message: response.message || 'Escaneo validado correctamente',
        data: response.data
      })
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 2000)
      }
    },
    onError: (error) => {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Error al validar el escaneo'
      })
    }
  })

  const handleClose = () => {
    setScanData({
      codigo_ubicacion: '',
      codigo_lote: '',
      cantidad: ''
    })
    setResult(null)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setResult(null)
    mutation.mutate({
      codigo_ubicacion: scanData.codigo_ubicacion,
      codigo_lote: scanData.codigo_lote,
      cantidad: parseFloat(scanData.cantidad)
    })
  }

  const handleChange = (e) => {
    setScanData({
      ...scanData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Validar Escaneo"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!result ? (
          <>
            {/* Código de Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Código de Ubicación *
              </label>
              <input
                type="text"
                name="codigo_ubicacion"
                value={scanData.codigo_ubicacion}
                onChange={handleChange}
                required
                autoFocus
                placeholder="Escanea o ingresa el código de ubicación"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Código de Lote */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Código de Lote *
              </label>
              <input
                type="text"
                name="codigo_lote"
                value={scanData.codigo_lote}
                onChange={handleChange}
                required
                placeholder="Escanea o ingresa el código de lote"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={scanData.cantidad}
                onChange={handleChange}
                required
                min="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-cancel-500 text-white rounded-lg hover:bg-cancel-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Scan className="w-4 h-4" />
                {mutation.isLoading ? 'Validando...' : 'Validar Escaneo'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            {result.success ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Validación Exitosa!</h3>
                <p className="text-gray-600 mb-4">{result.message}</p>
                {result.data && (
                  <div className="bg-green-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Ubicación:</span> {result.data.ubicacion?.codigo || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Lote:</span> {result.data.lote?.lote_codigo || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Cantidad:</span> {result.data.cantidad || 'N/A'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error en la Validación</h3>
                <p className="text-red-600 mb-4">{result.message}</p>
              </>
            )}
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}

