import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Search, Package, MapPin, Box, AlertCircle, BarChart3, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useNotification } from '../../contexts/NotificationContext'

export default function Inventario() {
  const { info } = useNotification()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('all')
  const [vistaAgrupada, setVistaAgrupada] = useState(false)

  const { data: inventario, isLoading, refetch, error } = useQuery({
    queryKey: ['inventario', filtroEstado],
    queryFn: async () => {
      try {
        const params = {}
        if (filtroEstado !== 'all') {
          params.estado = filtroEstado
        }
        const data = await api.getInventario(params)
        return Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Error al cargar inventario:', err)
        return []
      }
    }
  })

  const inventarioFiltrado = Array.isArray(inventario) ? inventario.filter(item =>
    item.lote?.producto?.sku?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.lote?.producto?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.lote?.lote_codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.ubicacion?.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  ) : []

  // Agrupar por producto para mostrar stock total
  const stockPorProducto = inventarioFiltrado.reduce((acc, item) => {
    const productoId = item.lote?.producto?.id
    const productoNombre = item.lote?.producto?.nombre || 'Sin producto'
    const productoSku = item.lote?.producto?.sku || '-'
    
    if (!acc[productoId]) {
      acc[productoId] = {
        id: productoId,
        nombre: productoNombre,
        sku: productoSku,
        stockTotal: 0,
        lotes: 0,
        ubicaciones: new Set()
      }
    }
    
    acc[productoId].stockTotal += parseFloat(item.cantidad) || 0
    acc[productoId].lotes += 1
    if (item.ubicacion?.codigo) {
      acc[productoId].ubicaciones.add(item.ubicacion.codigo)
    }
    
    return acc
  }, {})

  const productosAgrupados = Object.values(stockPorProducto)

  // Calcular totales
  const totalStock = inventarioFiltrado.reduce((sum, item) => sum + (parseFloat(item.cantidad) || 0), 0)
  const totalProductos = productosAgrupados.length
  const totalLotes = inventarioFiltrado.length

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800'
      case 'Cuarentena':
        return 'bg-yellow-100 text-yellow-800'
      case 'Dañado':
        return 'bg-red-100 text-red-800'
      case 'Transito':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRefresh = () => {
    refetch()
    info('Inventario actualizado')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Consulta el stock disponible en almacén</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock Total</p>
              <p className="text-3xl font-bold text-gray-900">{totalStock.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Productos</p>
              <p className="text-3xl font-bold text-gray-900">{totalProductos}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Lotes Activos</p>
              <p className="text-3xl font-bold text-gray-900">{totalLotes}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Box className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por SKU, producto, lote o ubicación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Estado Filter */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Cuarentena">Cuarentena</option>
            <option value="Dañado">Dañado</option>
            <option value="Transito">Tránsito</option>
          </select>

          {/* Vista Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVistaAgrupada(false)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                !vistaAgrupada ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              Detallado
            </button>
            <button
              onClick={() => setVistaAgrupada(true)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                vistaAgrupada ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              Por Producto
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>ℹ️ Nota:</strong> El inventario se actualiza automáticamente al recibir mercancía en el módulo de <strong>Recepción</strong>. 
        Esta vista es solo de consulta.
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-confirm-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando inventario...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-500">Error al cargar inventario. Por favor, intenta de nuevo.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600"
            >
              Reintentar
            </button>
          </div>
        ) : vistaAgrupada ? (
          /* Vista agrupada por producto */
          productosAgrupados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lotes
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosAgrupados.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{prod.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600">{prod.sku}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-green-600">{prod.stockTotal.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-600">{prod.lotes}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-600">{prod.ubicaciones.size}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay registros de inventario</p>
            </div>
          )
        ) : (
          /* Vista detallada */
          inventarioFiltrado.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventarioFiltrado.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.lote?.producto?.sku || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.lote?.producto?.nombre || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Box className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <span className="text-sm text-gray-900">{item.lote?.lote_codigo || '-'}</span>
                            {item.lote?.fecha_caducidad && (
                              <p className="text-xs text-gray-500">
                                Vence: {new Date(item.lote.fecha_caducidad).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{item.ubicacion?.codigo || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-semibold text-gray-900">{item.cantidad || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(item.estado)}`}>
                          {item.estado || 'Disponible'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay registros de inventario</p>
              <p className="text-sm text-gray-400 mt-2">
                El inventario se actualiza automáticamente al recibir mercancía
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
