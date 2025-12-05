import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'

export default function LoteFormModal({ isOpen, onClose, lote = null, onSuccess, productoIdPredefinido = null }) {
  const queryClient = useQueryClient()
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    lote_codigo: '',
    producto_id: productoIdPredefinido || '',
    cantidad_original: '',
    fecha_fabricacion: '',
    fecha_caducidad: ''
  })

  const [error, setError] = useState(null)

  // Cargar lista de productos para el Select
  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: () => api.getProductos(),
    enabled: isOpen 
  })

  // Rellenar formulario si estamos editando
  useEffect(() => {
    if (lote) {
      setFormData({
        lote_codigo: lote.lote_codigo || '',
        producto_id: lote.producto_id || '',
        cantidad_original: lote.cantidad_original || '',
        fecha_fabricacion: lote.fecha_fabricacion ? String(lote.fecha_fabricacion).split('T')[0] : '',
        fecha_caducidad: lote.fecha_caducidad ? String(lote.fecha_caducidad).split('T')[0] : ''
      })
    } else {
      setFormData({
        lote_codigo: '',
        producto_id: productoIdPredefinido || '',
        cantidad_original: '',
        fecha_fabricacion: '',
        fecha_caducidad: ''
      })
    }
    setError(null)
  }, [lote, isOpen, productoIdPredefinido])

  // Mutación para Crear Lote
  const createMutation = useMutation({
    mutationFn: (data) => api.createLote(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['lotes'] })
      if (onSuccess) {
        onSuccess(response.data)
      }
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Error al crear lote')
    }
  })

  // Mutación para Actualizar Lote
  const updateMutation = useMutation({
    mutationFn: (data) => api.updateLote(lote.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes'] })
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Error al actualizar lote')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Preparar datos para enviar
    const dataToSend = {
      lote_codigo: formData.lote_codigo,
      producto_id: parseInt(formData.producto_id),
      cantidad_original: parseFloat(formData.cantidad_original) || 0,
      fecha_fabricacion: formData.fecha_fabricacion || null,
      fecha_caducidad: formData.fecha_caducidad || null
    }
    
    if (lote) {
      updateMutation.mutate(dataToSend)
    } else {
      createMutation.mutate(dataToSend)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {lote ? 'Editar Lote' : 'Nuevo Lote'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código de Lote</label>
                    <input
                      type="text"
                      name="lote_codigo"
                      required
                      value={formData.lote_codigo}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                      placeholder="Ej: LOTE-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Producto</label>
                    <select
                      name="producto_id"
                      required
                      value={formData.producto_id}
                      onChange={handleChange}
                      disabled={!!productoIdPredefinido}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccione un producto</option>
                      {productos?.map(prod => (
                        <option key={prod.id} value={prod.id}>
                          {prod.sku} - {prod.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad Original</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cantidad_original"
                      required
                      value={formData.cantidad_original}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha Fabricación</label>
                      <input
                        type="date"
                        name="fecha_fabricacion"
                        value={formData.fecha_fabricacion}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha Caducidad</label>
                      <input
                        type="date"
                        name="fecha_caducidad"
                        value={formData.fecha_caducidad}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-white bg-cancel-500 rounded-md hover:bg-cancel-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-confirm-500 rounded-md hover:bg-confirm-600 disabled:opacity-50"
                    >
                      {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
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