import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Package, 
  CheckCircle, 
  Barcode,
  AlertTriangle,
  Play,
  Check,
  X,
  Box,
  Layers,
  Truck,
  Camera
} from 'lucide-react'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import BarcodeScanner from '../../components/Scanner/BarcodeScanner'

export default function PackingEjecucion() {
  const { tareaId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error, warning } = useNotification()
  
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [packedItems, setPackedItems] = useState([])
  const [scanInput, setScanInput] = useState('')
  const [cajaActual, setCajaActual] = useState(1)
  const [checkInCompletado, setCheckInCompletado] = useState(false)
  const [checkInItems, setCheckInItems] = useState([])
  const [showScanner, setShowScanner] = useState(false)
  const [scanningFor, setScanningFor] = useState(null) // 'checkin' o 'packing'

  // Obtener detalle de la tarea
  const { data: tarea, isLoading, error: tareaError, refetch } = useQuery({
    queryKey: ['tarea-packing', tareaId],
    queryFn: async () => {
      try {
        const response = await api.getTask(tareaId)
        console.log('📦 Tarea PACKING recibida:', response)
        return response
      } catch (error) {
        console.error('❌ Error al obtener tarea PACKING:', error)
        throw error
      }
    },
    enabled: !!tareaId,
    retry: 2
  })

  // Manejar diferentes estructuras de respuesta
  const detalles = tarea?.detalles || tarea?.detalleTareas || tarea?.detalle_tareas || []
  const currentItem = detalles[currentItemIndex]

  // Iniciar tarea de packing
  const iniciarMutation = useMutation({
    mutationFn: () => api.startTask(tareaId),
    onSuccess: () => {
      success('Packing iniciado - Primero verifica los productos (check-in)')
      refetch()
      setCheckInCompletado(false) // Iniciar en fase de check-in
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al iniciar packing')
    }
  })

  // Manejar escaneo desde la cámara
  const handleCameraScan = (scannedCode) => {
    setScanInput(scannedCode)
    setShowScanner(false)
    
    // Procesar el escaneo según el tipo
    if (scanningFor === 'checkin') {
      handleCheckIn(null, scannedCode)
    } else if (scanningFor === 'packing') {
      handlePackItem(null, scannedCode)
    }
  }

  // Validar check-in de producto
  const handleCheckIn = (e, scannedValue = null) => {
    if (e) e.preventDefault()
    
    if (!currentItem) return

    const codeToCheck = scannedValue || scanInput
    const expectedCode = currentItem.lote?.lote_codigo || currentItem.producto?.sku
    
    if (codeToCheck === expectedCode || codeToCheck === currentItem.producto?.sku) {
      // Check-in correcto
      setCheckInItems([...checkInItems, {
        detalle_id: currentItem.id,
        verificado: true
      }])
      
      success(`✓ ${currentItem.producto?.nombre} verificado en check-in`)
      
      // Pasar al siguiente item
      if (currentItemIndex < detalles.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1)
      } else {
        // Todos los items verificados, pasar a fase de packing
        setCheckInCompletado(true)
        setCurrentItemIndex(0) // Reiniciar índice para packing
      }
      
      setScanInput('')
    } else {
      error('Código incorrecto. Verifica el producto.')
    }
  }

  // Completar tarea (finalizar)
  const completarPackingMutation = useMutation({
    mutationFn: async () => {
      return await api.completeTask(tareaId)
    },
    onSuccess: () => {
      success('¡Packing completado! La tarea ha sido finalizada.')
      queryClient.invalidateQueries(['tasks'])
      navigate('/packing')
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al completar packing')
    }
  })

  // Validar escaneo de packing (después del check-in)
  const handlePackItem = (e, scannedValue = null) => {
    if (e) e.preventDefault()
    
    if (!currentItem) return

    // Verificar que el producto haya pasado el check-in
    const checkInItem = checkInItems.find(c => c.detalle_id === currentItem.id)
    if (!checkInItem) {
      warning('Este producto debe pasar primero por el check-in')
      return
    }

    const codeToCheck = scannedValue || scanInput
    const expectedCode = currentItem.lote?.lote_codigo || currentItem.producto?.sku
    
    if (codeToCheck === expectedCode || codeToCheck === currentItem.producto?.sku) {
      // Escaneo correcto
      setPackedItems([...packedItems, {
        detalle_id: currentItem.id,
        producto: currentItem.producto?.nombre,
        cantidad: currentItem.cantidad_solicitada,
        caja: cajaActual,
        empacado: true
      }])
      
      success(`✓ ${currentItem.producto?.nombre} empacado en Caja #${cajaActual}`)
      
      // Pasar al siguiente item
      if (currentItemIndex < detalles.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1)
      }
      
      setScanInput('')
    } else {
      error('Código incorrecto. Verifica el producto.')
    }
  }

  // Nueva caja
  const handleNuevaCaja = () => {
    setCajaActual(cajaActual + 1)
    success(`Caja #${cajaActual + 1} iniciada`)
  }

  // Verificar si todos los items fueron empacados
  const allItemsPacked = packedItems.length === detalles.length && detalles.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-confirm-600"></div>
        <p className="ml-4 text-gray-600">Cargando tarea...</p>
      </div>
    )
  }

  if (tareaError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Error al cargar la tarea</h2>
        <p className="text-gray-600 mt-2">{tareaError.message || 'Error desconocido'}</p>
        <button 
          onClick={() => navigate('/packing')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Packing
        </button>
      </div>
    )
  }

  if (!tarea) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Tarea no encontrada</h2>
        <button 
          onClick={() => navigate('/packing')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Packing
        </button>
      </div>
    )
  }

  // Verificar si hay detalles
  if (!detalles || detalles.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Tarea sin detalles</h2>
        <p className="text-gray-600 mt-2">Esta tarea no tiene productos asignados para empacar.</p>
        <p className="text-sm text-gray-500 mt-1">Tarea ID: {tarea.id}</p>
        <button 
          onClick={() => navigate('/packing')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Packing
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Packing - Tarea #{tarea.id}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                tarea.estado === 'EN_CURSO' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {tarea.estado === 'EN_CURSO' ? 'Empacando' : tarea.estado}
              </span>
            </div>
            <p className="text-gray-500 mt-1">Verificación y empaque de productos</p>
          </div>
          
          <div className="flex gap-3">
            {(tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA') && (
              <button
                onClick={() => iniciarMutation.mutate()}
                disabled={iniciarMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
              >
                <Play className="w-5 h-5" />
                Iniciar Packing
              </button>
            )}
            
            {tarea.estado === 'EN_CURSO' && allItemsPacked && (
              <button
                onClick={() => completarPackingMutation.mutate()}
                disabled={completarPackingMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Truck className="w-5 h-5" />
                Finalizar y Listo para Despacho
              </button>
            )}
            
            <button
              onClick={() => navigate('/packing')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Check-in o Packing */}
      {tarea.estado === 'EN_CURSO' && !checkInCompletado && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in inicial */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-yellow-500" />
              Check-in de Productos ({currentItemIndex + 1} de {detalles.length})
            </h2>
            
            {currentItem ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Verifica que los productos recibidos del picking sean correctos
                  </p>
                </div>

                {/* Detalles del producto */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Producto:</span>
                    <span className="font-semibold">{currentItem.producto?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-mono">{currentItem.producto?.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lote:</span>
                    <span className="font-mono">{currentItem.lote?.lote_codigo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {currentItem.cantidad_solicitada}
                    </span>
                  </div>
                </div>

                {/* Input de escaneo check-in */}
                <form onSubmit={handleCheckIn} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Barcode className="inline w-4 h-4 mr-1" />
                    Escanea el código del producto para verificar
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder="Escanear código de producto..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-lg"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      <Check className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Código esperado: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {currentItem.lote?.lote_codigo || currentItem.producto?.sku}
                    </span>
                  </p>
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium text-gray-900">¡Check-in completado!</p>
                <p className="text-gray-500">Todos los productos verificados. Procede a empacar.</p>
              </div>
            )}
          </div>

          {/* Lista de productos en check-in */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-500" />
              Productos en Check-in
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detalles.map((detalle, index) => {
                const checkInItem = checkInItems.find(c => c.detalle_id === detalle.id)
                const isCurrent = index === currentItemIndex
                
                return (
                  <div
                    key={detalle.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      checkInItem 
                        ? 'bg-green-50 border-green-300' 
                        : isCurrent 
                          ? 'bg-yellow-50 border-yellow-500' 
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      checkInItem ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {checkInItem ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{detalle.producto?.nombre}</p>
                      <p className="text-sm text-gray-500">
                        Cant: {detalle.cantidad_solicitada}
                      </p>
                    </div>
                    
                    {isCurrent && !checkInItem && (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                        Actual
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progreso check-in */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso Check-in</span>
                <span>{checkInItems.length} / {detalles.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-500 rounded-full h-3 transition-all duration-300"
                  style={{ width: `${(checkInItems.length / detalles.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Packing (después del check-in) */}
      {tarea.estado === 'EN_CURSO' && checkInCompletado && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Item actual para empacar */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Producto a Empacar ({currentItemIndex + 1} de {detalles.length})
            </h2>
            
            {currentItem ? (
              <div className="space-y-4">
                {/* Caja actual */}
                <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-4 text-center">
                  <Box className="w-10 h-10 mx-auto text-orange-600 mb-2" />
                  <p className="text-sm text-orange-600 font-medium">EMPACANDO EN</p>
                  <p className="text-3xl font-bold text-orange-700">Caja #{cajaActual}</p>
                  <button
                    onClick={handleNuevaCaja}
                    className="mt-2 text-sm text-orange-600 hover:text-orange-800 underline"
                  >
                    + Nueva caja
                  </button>
                </div>

                {/* Detalles del producto */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Producto:</span>
                    <span className="font-semibold">{currentItem.producto?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-mono">{currentItem.producto?.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lote:</span>
                    <span className="font-mono">{currentItem.lote?.lote_codigo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {currentItem.cantidad_solicitada}
                    </span>
                  </div>
                </div>

                {/* Input de escaneo packing */}
                <form onSubmit={handleScanPacking} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Barcode className="inline w-4 h-4 mr-1" />
                    Verifica escaneando el producto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder="Escanear código de barras..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Check className="w-6 h-6" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium text-gray-900">¡Todos los productos empacados!</p>
                <p className="text-gray-500">Presiona "Finalizar" para completar</p>
              </div>
            )}
          </div>

          {/* Lista de items empacados */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-500" />
              Productos Empacados
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detalles.map((detalle, index) => {
                const packed = packedItems.find(p => p.detalle_id === detalle.id)
                const isCurrent = index === currentItemIndex && !packed
                
                return (
                  <div
                    key={detalle.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      packed 
                        ? 'bg-green-50 border-green-300' 
                        : isCurrent 
                          ? 'bg-orange-50 border-orange-500' 
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      packed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {packed ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{detalle.producto?.nombre}</p>
                      <p className="text-sm text-gray-500">
                        Cant: {detalle.cantidad_solicitada}
                        {packed && <span className="ml-2 text-green-600">• Caja #{packed.caja}</span>}
                      </p>
                    </div>
                    
                    {isCurrent && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                        Actual
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Resumen de cajas */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total de cajas:</p>
                  <p className="text-2xl font-bold text-orange-600">{cajaActual}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Productos empacados:</p>
                  <p className="text-2xl font-bold text-green-600">
                    {packedItems.length} / {detalles.length}
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div 
                  className="bg-orange-500 rounded-full h-3 transition-all duration-300"
                  style={{ width: `${(packedItems.length / detalles.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado inicial */}
      {(tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA') && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Box className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Tarea de Packing lista
          </h2>
          <p className="text-gray-500 mb-6">
            Esta tarea tiene {detalles.length} producto(s) para verificar y empacar.
            <br />
            Presiona "Iniciar Packing" para comenzar.
          </p>
        </div>
      )}
    </div>
  )
}

