import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Thermometer, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'

export default function RegistrarTemperaturaModal({ isOpen, onClose, subbodega }) {
  const queryClient = useQueryClient()
  const { success, error } = useNotification()

  const [formData, setFormData] = useState({
    temperatura: '',
    humedad: '',
    observaciones: ''
  })

  const [tempWarning, setTempWarning] = useState(null)

  // Validar temperatura cuando cambia
  const handleTemperaturaChange = (value) => {
    setFormData({ ...formData, temperatura: value })
    
    if (subbodega && value) {
      const temp = parseFloat(value)
      const min = subbodega.temperatura_min ?? -20
      const max = subbodega.temperatura_max ?? 8

      if (temp < min || temp > max) {
        setTempWarning({
          message: `Temperatura fuera del rango permitido (${min}°C - ${max}°C). Se generará una alerta.`,
          severity: 'error'
        })
      } else {
        setTempWarning(null)
      }
    }
  }

  const mutation = useMutation({
    mutationFn: async (data) => {
      return await api.registrarTemperatura({
        ...data,
        subbodega_id: subbodega?.id
      })
    },
    onSuccess: (response) => {
      if (response.data?.dentro_rango === false) {
        success('Temperatura registrada. ⚠️ Se ha generado una alerta por temperatura fuera de rango.')
      } else {
        success('Temperatura registrada exitosamente')
      }
      queryClient.invalidateQueries(['lecturas-temperatura'])
      queryClient.invalidateQueries(['alertas-temperatura'])
      handleClose()
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al registrar la temperatura')
    }
  })

  const handleClose = () => {
    setFormData({
      temperatura: '',
      humedad: '',
      observaciones: ''
    })
    setTempWarning(null)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.temperatura) {
      error('Ingresa la temperatura')
      return
    }

    mutation.mutate({
      temperatura: parseFloat(formData.temperatura),
      humedad: formData.humedad ? parseFloat(formData.humedad) : null,
      observaciones: formData.observaciones || null
    })
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Thermometer className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Registrar Temperatura
                      </Dialog.Title>
                      {subbodega && (
                        <p className="text-sm text-gray-500">{subbodega.nombre}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Rango permitido */}
                  {subbodega && (
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-800">
                        Rango permitido: <strong>{subbodega.temperatura_min ?? '-20'}°C</strong> a <strong>{subbodega.temperatura_max ?? '8'}°C</strong>
                      </p>
                    </div>
                  )}

                  {/* Alerta de temperatura */}
                  {tempWarning && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 text-sm">{tempWarning.message}</span>
                    </div>
                  )}

                  {/* Temperatura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperatura (°C) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={formData.temperatura}
                        onChange={(e) => handleTemperaturaChange(e.target.value)}
                        className={`w-full px-3 py-3 text-2xl font-bold text-center border rounded-lg focus:ring-2 ${
                          tempWarning 
                            ? 'border-red-300 focus:ring-red-500 text-red-600' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="0.0"
                        required
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                        °C
                      </span>
                    </div>
                  </div>

                  {/* Humedad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Humedad (%) <span className="text-gray-400">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.humedad}
                      onChange={(e) => setFormData({ ...formData, humedad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 65.5"
                    />
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  {/* Buttons */}
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
                      disabled={mutation.isPending}
                      className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors disabled:opacity-50"
                    >
                      {mutation.isPending ? 'Registrando...' : 'Registrar'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

