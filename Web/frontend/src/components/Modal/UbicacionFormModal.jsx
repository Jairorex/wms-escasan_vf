import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { MapPin, Box, Weight, Hash } from 'lucide-react'
import Modal from './Modal'
import SelectWithCreate from '../SelectWithCreate'
import { useNotification } from '../../contexts/NotificationContext'

export default function UbicacionFormModal({ isOpen, onClose, ubicacion = null }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const isEdit = !!ubicacion

  const [formData, setFormData] = useState({
    codigo: '',
    pasillo: '',
    estante: '',
    nivel: '',
    tipo_ubicacion_id: '',
    max_peso: '',
    max_cantidad: ''
  })

  // Cargar tipos de ubicación
  const { data: tiposUbicacion } = useQuery({
    queryKey: ['tipos-ubicacion'],
    queryFn: () => api.getTiposUbicacion(),
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
        max_peso: '',
        max_cantidad: ''
      })
    }
  }, [ubicacion, isOpen])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return api.updateUbicacion(ubicacion.id, data)
      } else {
        return api.createUbicacion(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
      // Cerrar modal sin mostrar notificación de éxito
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
      max_peso: '',
      max_cantidad: ''
    })
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      tipo_ubicacion_id: parseInt(formData.tipo_ubicacion_id),
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Editar Ubicación' : 'Nueva Ubicación'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Código */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            Código *
          </label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="A-01-01-01"
          />
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
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isLoading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Ubicación'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

