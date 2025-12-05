import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Warehouse, Thermometer, Package } from 'lucide-react'
import Modal from './Modal'
import { useNotification } from '../../contexts/NotificationContext'

export default function SubbodegaFormModal({ isOpen, onClose, subbodega = null }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const isEditing = !!subbodega

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'RESGUARDO',
    temperatura_min: '',
    temperatura_max: '',
    stock_minimo: '0',
    requiere_temperatura: false
  })

  // Obtener tipos de subbodega
  const { data: tipos = [] } = useQuery({
    queryKey: ['tipos-subbodega'],
    queryFn: () => api.getTiposSubbodega(),
    enabled: isOpen
  })

  useEffect(() => {
    if (subbodega) {
      setFormData({
        codigo: subbodega.codigo || '',
        nombre: subbodega.nombre || '',
        descripcion: subbodega.descripcion || '',
        tipo: subbodega.tipo || 'RESGUARDO',
        temperatura_min: subbodega.temperatura_min?.toString() || '',
        temperatura_max: subbodega.temperatura_max?.toString() || '',
        stock_minimo: subbodega.stock_minimo?.toString() || '0',
        requiere_temperatura: subbodega.requiere_temperatura || false
      })
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo: 'RESGUARDO',
        temperatura_min: '',
        temperatura_max: '',
        stock_minimo: '0',
        requiere_temperatura: false
      })
    }
  }, [subbodega, isOpen])

  // Actualizar requiere_temperatura según el tipo
  useEffect(() => {
    if (formData.tipo === 'CADENA_FRIA') {
      setFormData(prev => ({ ...prev, requiere_temperatura: true }))
    }
  }, [formData.tipo])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return api.updateSubbodega(subbodega.id, data)
      }
      return api.createSubbodega(data)
    },
    onSuccess: () => {
      success(isEditing ? 'Subbodega actualizada exitosamente' : 'Subbodega creada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['subbodegas'] })
      onClose()
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    const data = {
      ...formData,
      temperatura_min: formData.requiere_temperatura && formData.temperatura_min 
        ? parseFloat(formData.temperatura_min) 
        : null,
      temperatura_max: formData.requiere_temperatura && formData.temperatura_max 
        ? parseFloat(formData.temperatura_max) 
        : null,
      stock_minimo: parseInt(formData.stock_minimo) || 0
    }

    mutation.mutate(data)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Subbodega' : 'Nueva Subbodega'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
              placeholder="SB-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
            >
              {tipos.map(tipo => (
                <option key={tipo.codigo} value={tipo.codigo}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Nombre de la subbodega"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={2}
            placeholder="Descripción de la subbodega..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
          />
        </div>

        {/* Stock mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Package className="w-4 h-4 inline mr-1" />
            Stock Mínimo para Reabastecimiento
          </label>
          <input
            type="number"
            name="stock_minimo"
            value={formData.stock_minimo}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
          />
        </div>

        {/* Control de temperatura */}
        <div className="bg-cyan-50 p-4 rounded-lg space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="requiere_temperatura"
              checked={formData.requiere_temperatura}
              onChange={handleChange}
              disabled={formData.tipo === 'CADENA_FRIA'}
              className="rounded text-escasan-green-500 focus:ring-escasan-green-500"
            />
            <Thermometer className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-medium text-gray-700">
              Requiere control de temperatura
            </span>
          </label>

          {formData.requiere_temperatura && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperatura Mínima (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperatura_min"
                  value={formData.temperatura_min}
                  onChange={handleChange}
                  placeholder="-5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperatura Máxima (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperatura_max"
                  value={formData.temperatura_max}
                  onChange={handleChange}
                  placeholder="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-cancel-500 text-white rounded-lg hover:bg-cancel-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 transition-colors"
          >
            {mutation.isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

