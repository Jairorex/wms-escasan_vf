import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { 
  Warehouse, 
  Plus, 
  Search, 
  Thermometer, 
  Package,
  AlertTriangle,
  CheckCircle,
  MapPin,
  RefreshCw
} from 'lucide-react'
import SubbodegaFormModal from '../../components/Modal/SubbodegaFormModal'
import SubbodegaDetailModal from '../../components/Modal/SubbodegaDetailModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Subbodegas() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotification()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedSubbodega, setSelectedSubbodega] = useState(null)

  // Obtener subbodegas
  const { data: subbodegasData, isLoading } = useQuery({
    queryKey: ['subbodegas', filtroTipo],
    queryFn: async () => {
      const response = await api.getSubbodegas({ tipo: filtroTipo || undefined })
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        return response
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data
      }
      if (response?.success && Array.isArray(response.data)) {
        return response.data
      }
      return []
    }
  })

  // Extraer array de subbodegas
  const subbodegas = Array.isArray(subbodegasData) ? subbodegasData : (subbodegasData?.data || [])

  // Obtener tipos de subbodega
  const { data: tiposData = [] } = useQuery({
    queryKey: ['tipos-subbodega'],
    queryFn: async () => {
      const response = await api.getTiposSubbodega()
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        return response
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data
      }
      return []
    }
  })

  // Extraer array de tipos
  const tipos = Array.isArray(tiposData) ? tiposData : (tiposData?.data || [])

  // Filtrar subbodegas
  const subbodegasFiltradas = Array.isArray(subbodegas) ? subbodegas.filter(sb => {
    const matchSearch = sb.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sb.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  }) : []

  const handleOpenDetail = (subbodega) => {
    setSelectedSubbodega(subbodega)
    setIsDetailModalOpen(true)
  }

  const handleOpenEdit = (subbodega) => {
    setSelectedSubbodega(subbodega)
    setIsFormModalOpen(true)
  }

  const getTipoColor = (tipo) => {
    const colores = {
      'PICKING': 'bg-blue-100 text-blue-800',
      'RESGUARDO': 'bg-gray-100 text-gray-800',
      'CADENA_FRIA': 'bg-cyan-100 text-cyan-800',
      'QUIMICOS': 'bg-orange-100 text-orange-800',
      'ALTO_VALOR': 'bg-yellow-100 text-yellow-800',
      'CUARENTENA': 'bg-red-100 text-red-800',
      'DESTRUCCION': 'bg-red-200 text-red-900',
      'IMPORTACION': 'bg-purple-100 text-purple-800'
    }
    return colores[tipo] || 'bg-gray-100 text-gray-800'
  }

  const getTipoNombre = (tipo) => {
    const nombres = {
      'PICKING': 'Picking',
      'RESGUARDO': 'Resguardo',
      'CADENA_FRIA': 'Cadena Fría',
      'QUIMICOS': 'Químicos',
      'ALTO_VALOR': 'Alto Valor',
      'CUARENTENA': 'Cuarentena',
      'DESTRUCCION': 'Destrucción',
      'IMPORTACION': 'Importación'
    }
    return nombres[tipo] || tipo
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-escasan-green-500" />
            Gestión de Subbodegas
          </h1>
          <p className="text-gray-500 mt-1">
            Administra las áreas de almacenamiento por tipo y zona
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedSubbodega(null)
            setIsFormModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-escasan-green-500 text-white rounded-lg hover:bg-escasan-green-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Subbodega
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar subbodega..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {tipos.map(tipo => (
              <option key={tipo.codigo} value={tipo.codigo}>{tipo.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Subbodegas */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-escasan-green-500" />
        </div>
      ) : subbodegasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay subbodegas</h3>
          <p className="text-gray-500">Crea una nueva subbodega para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subbodegasFiltradas.map((subbodega) => (
            <div
              key={subbodega.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header del card */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{subbodega.nombre}</h3>
                    <p className="text-sm text-gray-500">{subbodega.codigo}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTipoColor(subbodega.tipo)}`}>
                    {getTipoNombre(subbodega.tipo)}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-3">
                {subbodega.descripcion && (
                  <p className="text-sm text-gray-600">{subbodega.descripcion}</p>
                )}

                {/* Indicadores */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{subbodega.ubicaciones_count || 0} ubicaciones</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>{subbodega.stock_total || 0} unidades</span>
                  </div>
                </div>

                {/* Control de temperatura */}
                {subbodega.requiere_temperatura && (
                  <div className="flex items-center gap-2 p-2 bg-cyan-50 rounded-lg">
                    <Thermometer className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm text-cyan-800">
                      {subbodega.temperatura_min}°C - {subbodega.temperatura_max}°C
                    </span>
                  </div>
                )}

                {/* Estado de reabastecimiento */}
                {subbodega.necesita_reabastecimiento ? (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-800">Necesita reabastecimiento</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Stock OK</span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="px-4 py-3 bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenDetail(subbodega)}
                  className="px-3 py-1.5 text-sm bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
                >
                  Ver Detalles
                </button>
                <button
                  onClick={() => handleOpenEdit(subbodega)}
                  className="px-3 py-1.5 text-sm bg-escasan-orange-500 text-white rounded-lg hover:bg-escasan-orange-600 transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      <SubbodegaFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedSubbodega(null)
        }}
        subbodega={selectedSubbodega}
      />

      <SubbodegaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedSubbodega(null)
        }}
        subbodega={selectedSubbodega}
      />
    </div>
  )
}

