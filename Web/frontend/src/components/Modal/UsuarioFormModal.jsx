import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import Modal from '../Modal/Modal'
import { useNotification } from '../../contexts/NotificationContext'
import { User, Mail, Lock, Shield, Users } from 'lucide-react'

export default function UsuarioFormModal({ isOpen, onClose, usuario = null }) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const isEdit = !!usuario

  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    email: '',
    password: '',
    rol_id: '',
    supervisor_id: ''
  })

  // Cargar roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.getRoles(),
    enabled: isOpen
  })

  // Cargar supervisores (solo si el rol es operario)
  const { data: supervisores = [] } = useQuery({
    queryKey: ['supervisores'],
    queryFn: async () => {
      const roles = await api.getRoles()
      const rolSupervisor = roles.find(r => r.nombre.toLowerCase() === 'supervisor')
      if (!rolSupervisor) return []
      const usuarios = await api.getUsuarios({ rol_id: rolSupervisor.id })
      return usuarios
    },
    enabled: isOpen && (formData.rol_id !== '' || isEdit)
  })

  // Cargar todos los usuarios para el selector de supervisor
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.getUsuarios(),
    enabled: isOpen
  })

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        usuario: usuario.usuario || '',
        email: usuario.email || '',
        password: '', // No mostrar password al editar
        rol_id: usuario.rol_id || usuario.rol?.id || '',
        supervisor_id: usuario.supervisor_id || ''
      })
    } else {
      setFormData({
        nombre: '',
        usuario: '',
        email: '',
        password: '',
        rol_id: '',
        supervisor_id: ''
      })
    }
  }, [usuario, isOpen])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return api.updateUsuario(usuario.id, data)
      } else {
        return api.createUsuario(data)
      }
    },
    onSuccess: () => {
      success(isEdit ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      handleClose()
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(', ')
          : error.message)
      showError('Error: ' + errorMessage)
    }
  })

  const handleClose = () => {
    setFormData({
      nombre: '',
      usuario: '',
      email: '',
      password: '',
      rol_id: '',
      supervisor_id: ''
    })
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const data = {
      nombre: formData.nombre,
      usuario: formData.usuario,
      email: formData.email,
      rol_id: parseInt(formData.rol_id),
      supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id) : null
    }

    // Solo incluir password si se está creando o si se está editando y se proporcionó uno nuevo
    if (!isEdit || formData.password) {
      if (!formData.password) {
        showError('La contraseña es requerida')
        return
      }
      data.password = formData.password
    }

    mutation.mutate(data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Si el rol cambia y no es operario, limpiar supervisor_id
    if (name === 'rol_id') {
      const selectedRol = roles.find(r => r.id === parseInt(value))
      if (selectedRol && selectedRol.nombre.toLowerCase() !== 'operario') {
        setFormData(prev => ({
          ...prev,
          supervisor_id: ''
        }))
      }
    }
  }

  const isOperario = () => {
    const selectedRol = roles.find(r => r.id === parseInt(formData.rol_id))
    return selectedRol && selectedRol.nombre.toLowerCase() === 'operario'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Nombre Completo *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Juan Pérez"
          />
        </div>

        {/* Usuario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Nombre de Usuario *
          </label>
          <input
            type="text"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="jperez"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="juan.perez@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Lock className="w-4 h-4 inline mr-1" />
            Contraseña {isEdit ? '(dejar vacío para mantener la actual)' : '*'}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!isEdit}
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
          />
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Shield className="w-4 h-4 inline mr-1" />
            Rol *
          </label>
          <select
            name="rol_id"
            value={formData.rol_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Seleccionar rol</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Supervisor (solo si es operario) */}
        {isOperario() && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Supervisor (Opcional)
            </label>
            <select
              name="supervisor_id"
              value={formData.supervisor_id || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Sin supervisor --</option>
              {supervisores.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.nombre} ({supervisor.usuario})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Solo se muestran usuarios con rol Supervisor
            </p>
          </div>
        )}

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
            {mutation.isLoading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
