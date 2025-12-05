import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { User, X } from 'lucide-react'
import Modal from './Modal'
import { useNotification } from '../../contexts/NotificationContext'

export default function AsignarTareaModal({ isOpen, onClose, tareaId, tarea = null }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const [operarioId, setOperarioId] = useState('')

  // Cargar operarios disponibles
  const { data: operarios = [], isLoading: isLoadingOperarios } = useQuery({
    queryKey: ['operarios-disponibles'],
    queryFn: async () => {
      const usuarios = await api.getUsuarios()
      // Filtrar solo operarios (usuarios con rol de operario)
      return usuarios.filter(u => {
        const rol = typeof u.rol === 'string' ? u.rol : u.rol?.nombre
        return rol?.toLowerCase()?.includes('operario') || rol?.toLowerCase() === 'operario'
      })
    },
    enabled: isOpen
  })

  // Cargar información de la tarea si no viene como prop
  const { data: tareaData } = useQuery({
    queryKey: ['tarea', tareaId],
    queryFn: () => api.getTask(tareaId),
    enabled: isOpen && !!tareaId && !tarea
  })

  const tareaInfo = tarea || tareaData

  const asignarMutation = useMutation({
    mutationFn: (data) => api.asignarTarea(data.tareaId, data.operarioId),
    onSuccess: () => {
      success('Tarea asignada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['tareas'] })
      queryClient.invalidateQueries({ queryKey: ['tareas-picking'] })
      queryClient.invalidateQueries({ queryKey: ['tarea', tareaId] })
      handleClose()
    },
    onError: (error) => {
      showError('Error al asignar tarea: ' + (error.response?.data?.message || error.message))
    }
  })

  const handleClose = () => {
    setOperarioId('')
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!operarioId) {
      showError('Debes seleccionar un operario')
      return
    }
    asignarMutation.mutate({
      tareaId: tareaId || tareaInfo?.id,
      operarioId: parseInt(operarioId)
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Asignar Tarea a Operario"
      size="md"
    >
      {tareaInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Tarea:</p>
          <p className="font-semibold text-gray-900">
            {tareaInfo.numero_tarea || `Tarea #${tareaInfo.id}`} - {tareaInfo.tipo_tarea}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Seleccionar Operario *
          </label>
          {isLoadingOperarios ? (
            <p className="text-sm text-gray-500">Cargando operarios...</p>
          ) : operarios.length === 0 ? (
            <p className="text-sm text-red-500">No hay operarios disponibles</p>
          ) : (
            <select
              value={operarioId}
              onChange={(e) => setOperarioId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecciona un operario</option>
              {operarios.map((operario) => (
                <option key={operario.id} value={operario.id}>
                  {operario.nombre || operario.usuario}
                  {operario.rol && (
                    <span className="text-gray-500">
                      {' '}- {typeof operario.rol === 'string' ? operario.rol : operario.rol.nombre}
                    </span>
                  )}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Nota:</strong> Al asignar la tarea, el estado cambiará a "ASIGNADA" y el operario podrá iniciarla.
          </p>
        </div>

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
            disabled={asignarMutation.isPending || !operarioId || isLoadingOperarios}
            className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {asignarMutation.isPending ? 'Asignando...' : 'Asignar Tarea'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

