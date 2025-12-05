import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Barcode, Printer, Search, Package, Calendar, MapPin } from 'lucide-react'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'

export default function Etiquetas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLotes, setSelectedLotes] = useState([])
  const { success, error } = useNotification()

  // Obtener lotes para generar etiquetas
  const { data: lotes, isLoading } = useQuery({
    queryKey: ['lotes-etiquetas', searchTerm],
    queryFn: async () => {
      try {
        const response = await api.getLotes({ search: searchTerm })
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
      } catch (error) {
        console.error('Error al cargar lotes:', error)
        return []
      }
    }
  })

  const handleSelectLote = (lote) => {
    setSelectedLotes(prev => {
      const exists = prev.find(l => l.id === lote.id)
      if (exists) {
        return prev.filter(l => l.id !== lote.id)
      }
      return [...prev, lote]
    })
  }

  const handleSelectAll = () => {
    if (selectedLotes.length === lotes?.length) {
      setSelectedLotes([])
    } else {
      setSelectedLotes(lotes || [])
    }
  }

  const handlePrintEtiquetas = () => {
    if (selectedLotes.length === 0) {
      error('Selecciona al menos un lote para imprimir')
      return
    }

    // Crear ventana de impresión con las etiquetas
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiquetas de Productos - WMS ESCASAN</title>
        <style>
          @page { size: 4in 2in; margin: 0; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .etiqueta {
            width: 4in;
            height: 2in;
            border: 1px dashed #ccc;
            padding: 10px;
            box-sizing: border-box;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
          }
          .logo { font-weight: bold; font-size: 14px; color: #009245; }
          .lote-code { font-size: 12px; font-weight: bold; }
          .producto-nombre { 
            font-size: 16px; 
            font-weight: bold; 
            text-align: center; 
            margin: 8px 0;
          }
          .barcode {
            text-align: center;
            font-family: 'Libre Barcode 39', monospace;
            font-size: 40px;
            letter-spacing: 5px;
          }
          .barcode-text { 
            text-align: center; 
            font-size: 10px; 
            margin-top: 2px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            font-size: 10px;
          }
          .info-item { display: flex; gap: 5px; }
          .info-label { font-weight: bold; color: #666; }
          @media print {
            .no-print { display: none; }
          }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      </head>
      <body>
        ${selectedLotes.map(lote => `
          <div class="etiqueta">
            <div class="header">
              <span class="logo">WMS ESCASAN</span>
              <span class="lote-code">LOTE: ${lote.lote_codigo || lote.codigo_lote}</span>
            </div>
            <div class="producto-nombre">${lote.producto?.nombre || 'Producto'}</div>
            <div class="barcode">*${lote.lote_codigo || lote.codigo_lote}*</div>
            <div class="barcode-text">${lote.lote_codigo || lote.codigo_lote}</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">SKU:</span>
                <span>${lote.producto?.sku || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Caducidad:</span>
                <span>${lote.fecha_caducidad ? new Date(lote.fecha_caducidad).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fabricación:</span>
                <span>${lote.fecha_fabricacion ? new Date(lote.fecha_fabricacion).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cantidad:</span>
                <span>${lote.cantidad_original || lote.cantidad_inicial || 0} unidades</span>
              </div>
            </div>
          </div>
        `).join('')}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
    success(`Imprimiendo ${selectedLotes.length} etiqueta(s)`)
  }

  const handleGenerateBarcode = async (lote) => {
    // Generar código de barras para un lote específico
    try {
      await api.generateBarcode(lote.id)
      success(`Código de barras generado para lote ${lote.lote_codigo || lote.codigo_lote}`)
    } catch (err) {
      error('Error al generar código de barras')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generación de Etiquetas</h1>
          <p className="text-gray-600">Genera e imprime etiquetas con códigos de barras para productos</p>
        </div>
        <button
          onClick={handlePrintEtiquetas}
          disabled={selectedLotes.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            selectedLotes.length > 0 
              ? 'bg-confirm-500 text-white hover:bg-confirm-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Printer className="w-5 h-5" />
          Imprimir ({selectedLotes.length})
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código de lote, producto o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-confirm-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Info selección */}
      {selectedLotes.length > 0 && (
        <div className="bg-confirm-50 border border-confirm-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-confirm-700">
            <strong>{selectedLotes.length}</strong> lote(s) seleccionado(s) para imprimir
          </span>
          <button
            onClick={() => setSelectedLotes([])}
            className="text-confirm-600 hover:text-confirm-800 text-sm font-medium"
          >
            Limpiar selección
          </button>
        </div>
      )}

      {/* Lista de Lotes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Lotes Disponibles</h3>
          {lotes && lotes.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-confirm-600 hover:text-confirm-800 font-medium"
            >
              {selectedLotes.length === lotes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-confirm-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando lotes...</p>
          </div>
        ) : lotes && lotes.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {lotes.map((lote) => {
              const isSelected = selectedLotes.find(l => l.id === lote.id)
              return (
                <div
                  key={lote.id}
                  onClick={() => handleSelectLote(lote)}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-confirm-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'bg-confirm-500 border-confirm-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* Icono */}
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Barcode className="w-6 h-6 text-gray-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{lote.lote_codigo || lote.codigo_lote}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {lote.producto?.sku || 'Sin SKU'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {lote.producto?.nombre || 'Producto desconocido'}
                    </p>
                  </div>

                  {/* Fechas */}
                  <div className="text-right text-sm">
                    <p className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Vence: {lote.fecha_caducidad ? new Date(lote.fecha_caducidad).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-gray-500">
                      Cant: {lote.cantidad_original || lote.cantidad_inicial || 0} unidades
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Barcode className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>No se encontraron lotes</p>
            <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
}

