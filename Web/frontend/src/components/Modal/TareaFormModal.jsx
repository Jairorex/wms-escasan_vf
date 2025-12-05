import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { ClipboardList, X } from 'lucide-react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNotification } from '../../contexts/NotificationContext'

export default function TareaFormModal({ isOpen, onClose, tarea = null }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const isEdit = !!tarea

  const [formData, setFormData] = useState({
    tipo_tarea: 'PUTAWAY',
    prioridad: 'NORMAL',
    orden_id: '',
    usuario_asignado_id: '',
    observaciones: ''
  })

  // Rellenar formulario si estamos editando
  useEffect(() => {
    if (tarea) {
      setFormData({
        tipo_tarea: tarea.tipo_tarea || 'PUTAWAY',
        prioridad: tarea.prioridad || 'NORMAL',
        orden_id: tarea.orden_id || '',
        usuario_asignado_id: tarea.usuario_asignado_id || '',
        observaciones: tarea.observaciones || ''
      })
    } else {
      // Resetear al abrir para crear nuevo
      setFormData({
        tipo_tarea: 'PUTAWAY',
        prioridad: 'NORMAL',
        orden_id: '',
        usuario_asignado_id: '',
        observaciones: ''
      })
    }
  }, [tarea, isOpen])
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-operarios'],
    queryFn: async () => {
      const roles = await api.getRoles();
      const rolOperario = roles.find(r => r.nombre.toLowerCase() === 'operario');
      if (!rolOperario) return [];
      const usuarios = await api.getUsuarios({ rol_id: rolOperario.id });
      return usuarios;
    },
    enabled: isOpen,
  });
  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return api.updateTask(tarea.id, data)
      } else {
        return api.createTask(data)
      }
    },
    onSuccess: () => {
      success(isEdit ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
      handleClose()
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message;
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors) {
        const primerError = Object.values(validationErrors)[0][0];
        showError(`Error de validación: ${primerError}`);
      } else {
        showError('Error: ' + msg);
      }
    }
    
  })

  const handleClose = () => {
    setFormData({
      tipo_tarea: 'PUTAWAY',
      prioridad: 'NORMAL',
      orden_id: '',
      usuario_asignado_id: '',
      observaciones: ''
    })
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // --- LIMPIEZA DE DATOS PARA EVITAR ERROR 422 ---
    const datosLimpios = {
        ...formData,
        // 1. Si orden_id está vacío, enviamos null. Si tiene valor, lo convertimos a entero.
        orden_id: (!formData.orden_id || formData.orden_id.toString().trim() === '') 
                  ? null 
                  : parseInt(formData.orden_id),
        
        // 2. Lo mismo para usuario_asignado_id
        usuario_asignado_id: (!formData.usuario_asignado_id || formData.usuario_asignado_id.toString().trim() === '') 
                             ? null 
                             : parseInt(formData.usuario_asignado_id),
        
        // 3. Observaciones: si es vacío, null
        observaciones: (!formData.observaciones || formData.observaciones.trim() === '') 
                       ? null 
                       : formData.observaciones
    }

    mutation.mutate(datosLimpios)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary-600" />
                    {isEdit ? 'Editar Tarea' : 'Nueva Tarea'}
                  </Dialog.Title>
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Tipo de Tarea */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Tarea *
                    </label>
                    <select
                      name="tipo_tarea"
                      value={formData.tipo_tarea}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                        <option value="PUTAWAY">PUTAWAY - Almacenamiento</option>
                        <option value="PICK">PICK - Picking</option>
                        <option value="CONTEO">CONTEO - Conteo</option>
                        <option value="REABASTECER">REABASTECER - Reabastecimiento</option>
                    </select>
                  </div>

                  {/* Prioridad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad *
                    </label>
                    <select
                      name="prioridad"
                      value={formData.prioridad}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="BAJA">Baja</option>
                      <option value="NORMAL">Normal</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>

                  {/* Orden ID */}
                  {(formData.tipo_tarea === 'PUTAWAY' || formData.tipo_tarea === 'PICKING') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Orden (Opcional)
                      </label>
                      <input
                        type="number"
                        name="orden_id"
                        value={formData.orden_id}
                        onChange={handleChange}
                        placeholder="Ej: 105"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Deja vacío si no aplica</p>
                    </div>
                  )}

               

                  {/* Usuario Asignado */}
                  {/* Usuario Asignado (solo operarios) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario Asignado (Opcional)
                    </label>
                    <select
                      name="usuario_asignado_id"
                      value={formData.usuario_asignado_id || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">-- Sin asignar --</option>
                      {usuarios.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.nombre} ({user.usuario})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Solo se muestran usuarios con rol Operario</p>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 bg-cancel-500 text-white rounded-md text-sm font-medium hover:bg-cancel-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="px-4 py-2 bg-confirm-500 text-white rounded-md text-sm font-medium hover:bg-confirm-600 disabled:opacity-50"
                    >
                      {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Tarea'}
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