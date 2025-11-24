import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Loader } from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'

/**
 * Componente Select que permite crear nuevos elementos directamente
 * @param {Object} props
 * @param {Array} props.options - Opciones disponibles
 * @param {string} props.value - Valor seleccionado
 * @param {Function} props.onChange - Callback cuando cambia el valor
 * @param {string} props.placeholder - Placeholder del select
 * @param {string} props.createLabel - Label para el botón de crear
 * @param {Function} props.onCreate - Función para crear nuevo elemento (debe retornar el nuevo elemento con id)
 * @param {string} props.queryKey - Query key para invalidar cache
 * @param {boolean} props.required - Si el campo es requerido
 * @param {string} props.name - Nombre del campo
 */
export default function SelectWithCreate({
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar...',
  createLabel = 'Crear nuevo',
  onCreate,
  queryKey,
  required = false,
  name,
  className = '',
  disabled = false
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const queryClient = useQueryClient()
  const { success, error: showError, warning } = useNotification()

  const createMutation = useMutation({
    mutationFn: async (nombre) => {
      if (!onCreate) return null
      return await onCreate(nombre)
    },
    onSuccess: (newItem) => {
      if (newItem && newItem.id) {
        success('Elemento creado exitosamente')
        // Invalidar cache para refrescar la lista
        if (queryKey) {
          queryClient.invalidateQueries({ queryKey: [queryKey] })
        }
        // Seleccionar el nuevo elemento
        onChange({ target: { name, value: newItem.id.toString() } })
        // Resetear estado
        setNewItemName('')
        setShowCreateInput(false)
      }
    },
    onError: (error) => {
      showError('Error al crear: ' + (error.response?.data?.message || error.message))
    },
    onSettled: () => {
      setIsCreating(false)
    }
  })

  const handleCreate = async () => {
    if (!newItemName.trim()) {
      warning('Por favor ingresa un nombre')
      return
    }

    setIsCreating(true)
    createMutation.mutate(newItemName.trim())
  }

  const handleCancel = () => {
    setShowCreateInput(false)
    setNewItemName('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          name={name}
          value={value || ''}
          onChange={onChange}
          required={required}
          disabled={disabled || isCreating}
          className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.nombre}
            </option>
          ))}
        </select>
        {onCreate && !showCreateInput && (
          <button
            type="button"
            onClick={() => setShowCreateInput(true)}
            disabled={disabled || isCreating}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={createLabel}
          >
            <Plus className="w-5 h-5 text-primary-600" />
          </button>
        )}
      </div>

      {showCreateInput && (
        <div className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Nombre del nuevo elemento"
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              } else if (e.key === 'Escape') {
                handleCancel()
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !newItemName.trim()}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Crear</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCreating}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

