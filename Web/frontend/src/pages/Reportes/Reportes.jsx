import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  FileText, 
  Download, 
  BarChart3, 
  Package, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter,
  Warehouse,
  Thermometer
} from 'lucide-react'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'

export default function Reportes() {
  const [reportType, setReportType] = useState('inventario')
  const [dateRange, setDateRange] = useState({
    inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  })
  const { success, error } = useNotification()

  // Obtener datos del inventario
  const { data: inventario } = useQuery({
    queryKey: ['reporte-inventario'],
    queryFn: async () => {
      const response = await api.getInventario()
      return response.data || []
    },
    enabled: reportType === 'inventario'
  })

  // Obtener alertas
  const { data: alertas } = useQuery({
    queryKey: ['reporte-alertas', dateRange],
    queryFn: async () => {
      const response = await api.getAlertas()
      return response.data || []
    },
    enabled: reportType === 'alertas'
  })

  // Obtener movimientos
  const { data: movimientos } = useQuery({
    queryKey: ['reporte-movimientos', dateRange],
    queryFn: async () => {
      const response = await api.getMovimientos(dateRange)
      return response.data || []
    },
    enabled: reportType === 'movimientos'
  })

  // Obtener subbodegas
  const { data: subbodegas } = useQuery({
    queryKey: ['reporte-subbodegas'],
    queryFn: async () => {
      const response = await api.getSubbodegas()
      return response.data || []
    },
    enabled: reportType === 'subbodegas'
  })

  const reportTypes = [
    { id: 'inventario', name: 'Inventario General', icon: Package },
    { id: 'alertas', name: 'Alertas y Vencimientos', icon: AlertTriangle },
    { id: 'movimientos', name: 'Movimientos de Stock', icon: TrendingUp },
    { id: 'subbodegas', name: 'Estado de Subbodegas', icon: Warehouse },
  ]

  const handleExportCSV = () => {
    let data = []
    let headers = []
    let filename = ''

    switch (reportType) {
      case 'inventario':
        headers = ['Producto', 'SKU', 'Ubicación', 'Lote', 'Cantidad', 'Estado']
        data = (inventario || []).map(item => [
          item.producto?.nombre || '',
          item.producto?.sku || '',
          item.ubicacion?.codigo || '',
          item.lote?.codigo_lote || '',
          item.cantidad || 0,
          item.estado || ''
        ])
        filename = 'reporte_inventario'
        break
      case 'alertas':
        headers = ['Tipo', 'Descripción', 'Nivel', 'Estado', 'Fecha']
        data = (alertas || []).map(item => [
          item.tipo || '',
          item.descripcion || '',
          item.nivel_riesgo || '',
          item.estado || '',
          item.fecha_alerta ? new Date(item.fecha_alerta).toLocaleDateString() : ''
        ])
        filename = 'reporte_alertas'
        break
      case 'subbodegas':
        headers = ['Nombre', 'Tipo', 'Temp. Mín', 'Temp. Máx', 'Stock Mínimo']
        data = (subbodegas || []).map(item => [
          item.nombre || '',
          item.tipo || '',
          item.temperatura_min || 'N/A',
          item.temperatura_max || 'N/A',
          item.stock_minimo || 0
        ])
        filename = 'reporte_subbodegas'
        break
      default:
        error('Selecciona un tipo de reporte')
        return
    }

    // Crear CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    success('Reporte exportado exitosamente')
  }

  const renderReportContent = () => {
    switch (reportType) {
      case 'inventario':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(inventario || []).slice(0, 50).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.producto?.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.producto?.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.ubicacion?.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lote?.codigo_lote}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.cantidad}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.estado === 'DISPONIBLE' ? 'bg-green-100 text-green-800' :
                        item.estado === 'RESERVADO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(inventario || []).length > 50 && (
              <p className="text-center text-sm text-gray-500 py-4">
                Mostrando 50 de {inventario.length} registros. Exporta el CSV para ver todos.
              </p>
            )}
          </div>
        )

      case 'alertas':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(alertas || []).slice(0, 50).map((alerta, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alerta.tipo}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{alerta.descripcion}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        alerta.nivel_riesgo === 'ALTO' ? 'bg-red-100 text-red-800' :
                        alerta.nivel_riesgo === 'MEDIO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alerta.nivel_riesgo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        alerta.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                        alerta.estado === 'RESUELTA' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {alerta.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alerta.fecha_alerta ? new Date(alerta.fecha_alerta).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'subbodegas':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(subbodegas || []).map((sub) => (
              <div key={sub.id} className="bg-white rounded-lg shadow p-6 border">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    sub.tipo === 'CADENA_FRIA' ? 'bg-blue-100' : 
                    sub.tipo === 'QUIMICOS' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    {sub.tipo === 'CADENA_FRIA' ? (
                      <Thermometer className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Warehouse className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{sub.nombre}</h3>
                    <p className="text-sm text-gray-500">{sub.tipo}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {sub.temperatura_min !== null && (
                    <p className="flex justify-between">
                      <span className="text-gray-600">Rango temperatura:</span>
                      <span className="font-medium">{sub.temperatura_min}°C - {sub.temperatura_max}°C</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-gray-600">Stock mínimo:</span>
                    <span className="font-medium">{sub.stock_minimo || 0} unidades</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Genera y exporta reportes del sistema</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Tipo de reporte */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Tipo:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {reportTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === type.id
                      ? 'bg-confirm-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.name}
                </button>
              )
            })}
          </div>

          {/* Rango de fechas (solo para algunos reportes) */}
          {(reportType === 'movimientos' || reportType === 'alertas') && (
            <>
              <div className="flex items-center gap-2 ml-auto">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.inicio}
                  onChange={(e) => setDateRange(prev => ({ ...prev, inicio: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-500">a</span>
                <input
                  type="date"
                  value={dateRange.fin}
                  onChange={(e) => setDateRange(prev => ({ ...prev, fin: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contenido del reporte */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            {reportTypes.find(t => t.id === reportType)?.name}
          </h2>
        </div>
        <div className="p-6">
          {renderReportContent()}
        </div>
      </div>
    </div>
  )
}

