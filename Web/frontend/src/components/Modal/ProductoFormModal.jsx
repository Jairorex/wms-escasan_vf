import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Package, Weight, Box, Tag, Thermometer, AlertTriangle } from 'lucide-react'
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
    tipo_producto_id: '',
    // Nuevos campos para categoría de riesgo y temperatura
    categoria_riesgo_id: '',
    requiere_temperatura: false,
    temperatura_min: '',
    temperatura_max: '',
    rotacion: 'MEDIA',
    stock_minimo: '',
    stock_maximo: ''
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

  // Cargar categorías de riesgo
  const { data: categoriasRiesgo } = useQuery({
    queryKey: ['categorias-riesgo'],
    queryFn: () => api.getCategoriasRiesgo(),
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
        tipo_producto_id: producto.tipo_producto_id || '',
        categoria_riesgo_id: producto.categoria_riesgo_id || '',
        requiere_temperatura: producto.requiere_temperatura || false,
        temperatura_min: producto.temperatura_min || '',
        temperatura_max: producto.temperatura_max || '',
        rotacion: producto.rotacion || 'MEDIA',
        stock_minimo: producto.stock_minimo || '',
        stock_maximo: producto.stock_maximo || ''
      })
    } else {
      setFormData({
        sku: '',
        nombre: '',
        descripcion: '',
        peso: '',
        volumen: '',
        clasificacion_id: '',
        tipo_producto_id: '',
        categoria_riesgo_id: '',
        requiere_temperatura: false,
    temperatura_min: '',
    temperatura_max: '',
    rotacion: 'MEDIA',
        stock_minimo: '',
        stock_maximo: ''
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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      // Extraer el producto creado de la respuesta
      const productoCreado = response?.data || response
      if (onSuccess && productoCreado) {
        onSuccess(productoCreado)
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
      tipo_producto_id: '',
      categoria_riesgo_id: '',
      requiere_temperatura: false,
    temperatura_min: '',
    temperatura_max: '',
    rotacion: 'MEDIA',
      stock_minimo: '',
      stock_maximo: ''
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
      tipo_producto_id: formData.tipo_producto_id ? parseInt(formData.tipo_producto_id) : null,
      categoria_riesgo_id: formData.categoria_riesgo_id ? parseInt(formData.categoria_riesgo_id) : null,
      requiere_temperatura: formData.requiere_temperatura,
      temperatura_min: formData.requiere_temperatura && formData.temperatura_min ? parseFloat(formData.temperatura_min) : null,
      temperatura_max: formData.requiere_temperatura && formData.temperatura_max ? parseFloat(formData.temperatura_max) : null,
      rotacion: formData.rotacion || null,
      stock_minimo: formData.stock_minimo ? parseInt(formData.stock_minimo) : null,
      stock_maximo: formData.stock_maximo ? parseInt(formData.stock_maximo) : null
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

        {/* Sección de Categoría de Riesgo */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Categoría de Riesgo y Compatibilidad
          </h3>
          
          {/* Categoría de Riesgo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría de Riesgo
            </label>
            <select
              name="categoria_riesgo_id"
              value={formData.categoria_riesgo_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Sin categoría específica</option>
              {(categoriasRiesgo || []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre} {cat.descripcion ? `- ${cat.descripcion}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Define la compatibilidad del producto con subbodegas
            </p>
          </div>

          {/* Índice de Rotación */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Índice de Rotación
            </label>
            <select
              name="rotacion"
              value={formData.rotacion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ALTA">Alta (productos de alta demanda)</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja (productos de baja demanda)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Determina la ubicación óptima: alta rotación cerca de zona de picking
            </p>
          </div>

          {/* Stock mínimo/máximo */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Mínimo
              </label>
              <input
                type="number"
                name="stock_minimo"
                value={formData.stock_minimo}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Máximo
              </label>
              <input
                type="number"
                name="stock_maximo"
                value={formData.stock_maximo}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sección de Control de Temperatura */}
        <div className="border-t pt-4 mt-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-blue-500" />
            Control de Temperatura (Cadena Fría)
          </h3>

          {/* Toggle requiere temperatura */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="requiere_temperatura"
                checked={formData.requiere_temperatura}
                onChange={(e) => setFormData({ ...formData, requiere_temperatura: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Este producto requiere control de temperatura
              </span>
            </label>
          </div>

          {/* Rango de temperatura (solo si requiere) */}
          {formData.requiere_temperatura && (
            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura Mínima (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperatura_min"
                  value={formData.temperatura_min}
                  onChange={handleChange}
                  placeholder="-20"
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura Máxima (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperatura_max"
                  value={formData.temperatura_max}
                  onChange={handleChange}
                  placeholder="8"
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="col-span-2 text-xs text-blue-700">
                El producto solo podrá ubicarse en subbodegas de cadena fría con rango compatible
              </p>
            </div>
          )}
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
            disabled={mutation.isLoading}
            className="px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isLoading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

