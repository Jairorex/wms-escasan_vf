import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Package, Weight, Box, Tag } from 'lucide-react'
import Modal from './Modal'
import SelectWithCreate from '../SelectWithCreate'
import { useNotification } from '../../contexts/NotificationContext'

export default function ProductoFormModal({ isOpen, onClose, producto = null, onSuccess }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const isEdit = !!producto

  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    descripcion: '',
    peso: '',
    volumen: '',
    clasificacion_id: '',
    tipo_producto_id: ''
  })

  // Cargar clasificaciones y tipos de producto
  const { data: clasificaciones } = useQuery({
    queryKey: ['clasificaciones'],
    queryFn: () => api.getClasificaciones(),
    enabled: isOpen
  })

  const { data: tiposProducto } = useQuery({
    queryKey: ['tipos-producto'],
    queryFn: () => api.getTiposProducto(),
    enabled: isOpen
  })

  useEffect(() => {
    if (producto) {
      setFormData({
        sku: producto.sku || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        peso: producto.peso || '',
        volumen: producto.volumen || '',
        clasificacion_id: producto.clasificacion_id || '',
        tipo_producto_id: producto.tipo_producto_id || ''
      })
    } else {
      setFormData({
        sku: '',
        nombre: '',
        descripcion: '',
        peso: '',
        volumen: '',
        clasificacion_id: '',
        tipo_producto_id: ''
      })
    }
  }, [producto, isOpen])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return api.updateProducto(producto.id, data)
      } else {
        return api.createProducto(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      if (onSuccess) {
        onSuccess()
      }
      // Cerrar modal sin mostrar notificación de éxito
      handleClose()
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleClose = () => {
    setFormData({
      sku: '',
      nombre: '',
      descripcion: '',
      peso: '',
      volumen: '',
      clasificacion_id: '',
      tipo_producto_id: ''
    })
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      peso: parseFloat(formData.peso) || 0,
      volumen: parseFloat(formData.volumen) || 0,
      clasificacion_id: formData.clasificacion_id ? parseInt(formData.clasificacion_id) : null,
      tipo_producto_id: formData.tipo_producto_id ? parseInt(formData.tipo_producto_id) : null
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
      title={isEdit ? 'Editar Producto' : 'Nuevo Producto'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            SKU *
          </label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="SKU-001"
          />
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="w-4 h-4 inline mr-1" />
            Nombre *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Peso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Weight className="w-4 h-4 inline mr-1" />
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.01"
              name="peso"
              value={formData.peso}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Volumen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Box className="w-4 h-4 inline mr-1" />
              Volumen (m³)
            </label>
            <input
              type="number"
              step="0.01"
              name="volumen"
              value={formData.volumen}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clasificación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clasificación
          </label>
          <SelectWithCreate
            name="clasificacion_id"
            options={clasificaciones || []}
            value={formData.clasificacion_id}
            onChange={handleChange}
            placeholder="Seleccionar clasificación"
            createLabel="Crear nueva clasificación"
            onCreate={async (nombre) => {
              const response = await api.createClasificacion(nombre)
              return response
            }}
            queryKey="clasificaciones"
          />
        </div>

        {/* Tipo de Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Producto
          </label>
          <SelectWithCreate
            name="tipo_producto_id"
            options={tiposProducto || []}
            value={formData.tipo_producto_id}
            onChange={handleChange}
            placeholder="Seleccionar tipo"
            createLabel="Crear nuevo tipo de producto"
            onCreate={async (nombre) => {
              const response = await api.createTipoProducto(nombre)
              return response
            }}
            queryKey="tipos-producto"
          />
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
            {mutation.isLoading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

