import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { MapPin, Box, Weight, Hash, Warehouse } from 'lucide-react'
import Modal from './Modal'
import SelectWithCreate from '../SelectWithCreate'
import { useNotification } from '../../contexts/NotificationContext'

export default function UbicacionFormModal({ 
  isOpen, 
  onClose, 
  ubicacion = null, 
  subbodegaIdPredefinida = null,
  onSuccess 
}) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const isEdit = !!ubicacion

  const [formData, setFormData] = useState({
    codigo: '',
    pasillo: '',
    estante: '',
    nivel: '',
    tipo_ubicacion_id: '',
    subbodega_id: '',
    max_peso: '',
    max_cantidad: ''
  })

  // Cargar tipos de ubicación
  const { data: tiposUbicacion } = useQuery({
    queryKey: ['tipos-ubicacion'],
    queryFn: () => api.getTiposUbicacion(),
    enabled: isOpen
  })

  // Cargar subbodegas
  const { data: subbodegas } = useQuery({
    queryKey: ['subbodegas-ubicacion'],
    queryFn: () => api.getSubbodegas(),
    enabled: isOpen
  })

  useEffect(() => {
    if (ubicacion) {
      setFormData({
        codigo: ubicacion.codigo || '',
        pasillo: ubicacion.pasillo || '',
        estante: ubicacion.estante || '',
        nivel: ubicacion.nivel || '',
        tipo_ubicacion_id: ubicacion.tipo_ubicacion_id || '',
        subbodega_id: ubicacion.subbodega_id || '',
        max_peso: ubicacion.max_peso || '',
        max_cantidad: ubicacion.max_cantidad || ''
      })
    } else {
      setFormData({
        codigo: '',
        pasillo: '',
        estante: '',
        nivel: '',
        tipo_ubicacion_id: '',
        subbodega_id: subbodegaIdPredefinida || '',
        max_peso: '',
        max_cantidad: ''
      })
    }
  }, [ubicacion, isOpen, subbodegaIdPredefinida])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return api.updateUbicacion(ubicacion.id, data)
      } else {
        return api.createUbicacion(data)
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-para-recepcion'] })
      
      // Extraer la ubicación creada de la respuesta
      const ubicacionCreada = response?.data || response
      if (onSuccess && ubicacionCreada) {
        onSuccess(ubicacionCreada)
      }
      
      handleClose()
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleClose = () => {
    setFormData({
      codigo: '',
      pasillo: '',
      estante: '',
      nivel: '',
      tipo_ubicacion_id: '',
      subbodega_id: '',
      max_peso: '',
      max_cantidad: ''
    })
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      tipo_ubicacion_id: formData.tipo_ubicacion_id ? parseInt(formData.tipo_ubicacion_id) : null,
      subbodega_id: formData.subbodega_id ? parseInt(formData.subbodega_id) : null,
      max_peso: formData.max_peso ? parseFloat(formData.max_peso) : null,
      max_cantidad: formData.max_cantidad ? parseInt(formData.max_cantidad) : null
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Generar código automático basado en pasillo, estante y nivel
  const generarCodigo = () => {
    const { pasillo, estante, nivel } = formData
    if (pasillo || estante || nivel) {
      const codigo = [pasillo || 'A', estante || '01', nivel || '01'].join('-')
      setFormData(prev => ({ ...prev, codigo }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Editar Ubicación' : 'Nueva Ubicación'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subbodega */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Warehouse className="w-4 h-4 inline mr-1" />
            Subbodega *
          </label>
          <select
            name="subbodega_id"
            value={formData.subbodega_id}
            onChange={handleChange}
            required
            disabled={!!subbodegaIdPredefinida}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Selecciona una subbodega</option>
            {(Array.isArray(subbodegas) ? subbodegas : []).map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nombre} ({sub.tipo})
              </option>
            ))}
          </select>
          {subbodegaIdPredefinida && (
            <p className="mt-1 text-xs text-gray-500">
              La subbodega está predefinida desde la recepción
            </p>
          )}
        </div>

        {/* Código */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            Código *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="A-01-01-01"
            />
            <button
              type="button"
              onClick={generarCodigo}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Generar
            </button>
          </div>
        </div>

        {/* Tipo de Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Tipo de Ubicación *
          </label>
          <SelectWithCreate
            name="tipo_ubicacion_id"
            options={tiposUbicacion || []}
            value={formData.tipo_ubicacion_id}
            onChange={handleChange}
            placeholder="Seleccionar tipo"
            createLabel="Crear nuevo tipo de ubicación"
            required
            onCreate={async (nombre) => {
              const response = await api.createTipoUbicacion(nombre)
              return response
            }}
            queryKey="tipos-ubicacion"
          />
        </div>

        {/* Pasillo, Estante, Nivel */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pasillo
            </label>
            <input
              type="text"
              name="pasillo"
              value={formData.pasillo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estante
            </label>
            <input
              type="text"
              name="estante"
              value={formData.estante}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel
            </label>
            <input
              type="text"
              name="nivel"
              value={formData.nivel}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="01"
            />
          </div>
        </div>

        {/* Capacidad */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Weight className="w-4 h-4 inline mr-1" />
              Peso Máximo (kg)
            </label>
            <input
              type="number"
              step="0.01"
              name="max_peso"
              value={formData.max_peso}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Box className="w-4 h-4 inline mr-1" />
              Cantidad Máxima
            </label>
            <input
              type="number"
              name="max_cantidad"
              value={formData.max_cantidad}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="500"
            />
          </div>
        </div>

        {/* Actions */}
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
            className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Ubicación'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
