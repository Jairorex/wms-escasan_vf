import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Package, MapPin, Box, Hash } from 'lucide-react'
import Modal from './Modal'
import { useNotification } from '../../contexts/NotificationContext'

export default function InventarioFormModal({ isOpen, onClose, inventario = null, onSuccess }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const isEdit = !!inventario

  const [formData, setFormData] = useState({
    lote_id: '',
    ubicacion_id: '',
    cantidad: '',
    estado: 'Disponible'
  })

  // Cargar lotes y ubicaciones
  const { data: lotes } = useQuery({
    queryKey: ['lotes'],
    queryFn: () => api.getLotes(),
    enabled: isOpen
  })

  const { data: ubicaciones } = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: () => api.getUbicaciones(),
    enabled: isOpen
  })

  useEffect(() => {
    if (inventario) {
      setFormData({
        lote_id: inventario.lote_id || '',
        ubicacion_id: inventario.ubicacion_id || '',
        cantidad: inventario.cantidad || '',
        estado: inventario.estado || 'Disponible'
      })
    } else {
      setFormData({
        lote_id: '',
        ubicacion_id: '',
        cantidad: '',
        estado: 'Disponible'
      })
    }
  }, [inventario, isOpen])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return api.updateInventario(inventario.id, data)
      } else {
        return api.createInventario(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
      if (onSuccess) {
        onSuccess()
      }
      handleClose()
    },
    onError: (error) => {
      showError('Error: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleClose = () => {
    setFormData({
      lote_id: '',
      ubicacion_id: '',
      cantidad: '',
      estado: 'Disponible'
    })
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      lote_id: parseInt(formData.lote_id),
      ubicacion_id: parseInt(formData.ubicacion_id),
      cantidad: parseFloat(formData.cantidad) || 0
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
      title={isEdit ? 'Editar Inventario' : 'Asignar Producto a Ubicación'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lote */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Box className="w-4 h-4 inline mr-1" />
            Lote *
          </label>
          <select
            name="lote_id"
            value={formData.lote_id}
            onChange={handleChange}
            required
            disabled={isEdit}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Seleccione un lote</option>
            {lotes?.map(lote => (
              <option key={lote.id} value={lote.id}>
                {lote.lote_codigo} - {lote.producto?.nombre || 'Sin producto'} ({lote.producto?.sku || 'N/A'})
              </option>
            ))}
          </select>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Ubicación *
          </label>
          <select
            name="ubicacion_id"
            value={formData.ubicacion_id}
            onChange={handleChange}
            required
            disabled={isEdit}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Seleccione una ubicación</option>
            {ubicaciones?.map(ubicacion => (
              <option key={ubicacion.id} value={ubicacion.id}>
                {ubicacion.codigo} - {ubicacion.pasillo}-{ubicacion.estante}-{ubicacion.nivel}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="w-4 h-4 inline mr-1" />
            Cantidad *
          </label>
          <input
            type="number"
            step="0.01"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            Estado
          </label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="Disponible">Disponible</option>
            <option value="Cuarentena">Cuarentena</option>
            <option value="Dañado">Dañado</option>
            <option value="Transito">Tránsito</option>
          </select>
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
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Asignar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

