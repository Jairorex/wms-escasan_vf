import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Search, Package, Calendar, Hash, Eye, Plus, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import LoteDetailModal from '../../components/Modal/LoteDetailModal'
import LoteFormModal from '../../components/Modal/LoteFormModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Lotes() {
  const { error: showError } = useNotification()
  const [busqueda, setBusqueda] = useState('')
  const [selectedLoteId, setSelectedLoteId] = useState(null)
  const [selectedLote, setSelectedLote] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const { data: lotes, isLoading, refetch, error } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      try {
        const data = await api.getLotes()
        return Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Error al cargar lotes:', err)
        return []
      }
    }
  })

  const lotesFiltrados = Array.isArray(lotes) ? lotes.filter(lote =>
    lote.lote_codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    lote.producto?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    lote.producto?.sku?.toLowerCase().includes(busqueda.toLowerCase())
  ) : []

  const handleCreate = () => {
    setSelectedLote(null)
    setIsFormModalOpen(true)
  }

  const handleEdit = (lote) => {
    setSelectedLote(lote)
    setIsFormModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este lote?')) {
      try {
        await api.deleteLote(id)
        refetch()
      } catch (error) {
        showError('Error al eliminar: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lotes</h1>
          <p className="text-gray-600">Gestiona los lotes de productos en el almacén</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Lote
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código de lote, producto o SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Cargando lotes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Error al cargar lotes. Por favor, intenta de nuevo.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Reintentar
            </button>
          </div>
        ) : lotesFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código de Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Original
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Fabricación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Caducidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lotesFiltrados.map((lote) => (
                  <tr key={lote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{lote.lote_codigo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{lote.producto?.nombre || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{lote.producto?.sku || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{lote.cantidad_original || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {lote.fecha_fabricacion ? format(new Date(lote.fecha_fabricacion), 'PP', { locale: es }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${
                          lote.fecha_caducidad && new Date(lote.fecha_caducidad) < new Date()
                            ? 'text-red-600 font-medium'
                            : 'text-gray-900'
                        }`}>
                          {lote.fecha_caducidad ? format(new Date(lote.fecha_caducidad), 'PP', { locale: es }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLoteId(lote.id)
                            setIsDetailModalOpen(true)
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="Ver Detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(lote)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lote.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay lotes registrados</p>
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      <LoteFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedLote(null)
          refetch()
        }}
        lote={selectedLote}
        onSuccess={refetch}
      />

      {/* Modal de Detalle */}
      <LoteDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedLoteId(null)
        }}
        loteId={selectedLoteId}
      />
    </div>
  )
}

