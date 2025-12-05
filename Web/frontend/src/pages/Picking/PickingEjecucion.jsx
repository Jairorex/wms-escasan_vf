import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  MapPin, 
  Package, 
  CheckCircle, 
  ArrowRight, 
  Barcode,
  AlertTriangle,
  Play,
  Pause,
  Check,
  X,
  Clock,
  User,
  Layers,
  Camera
} from 'lucide-react'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import BarcodeScanner from '../../components/Scanner/BarcodeScanner'

export default function PickingEjecucion() {
  const { tareaId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error, warning } = useNotification()
  
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [scannedItems, setScannedItems] = useState([])
  const [scanInput, setScanInput] = useState('')
  const [ubicacionValidada, setUbicacionValidada] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanningFor, setScanningFor] = useState(null) // 'ubicacion' o 'producto'

  // Obtener detalle de la tarea
  const { data: tarea, isLoading, error: tareaError, refetch } = useQuery({
    queryKey: ['tarea-ejecucion', tareaId],
    queryFn: async () => {
      try {
        const response = await api.getTask(tareaId)
        console.log('📦 Tarea recibida:', response)
        return response
      } catch (error) {
        console.error('❌ Error al obtener tarea:', error)
        throw error
      }
    },
    enabled: !!tareaId,
    retry: 2
  })

  // Manejar diferentes estructuras de respuesta
  const detalles = tarea?.detalles || tarea?.detalleTareas || tarea?.detalle_tareas || []
  const currentItem = detalles[currentItemIndex]
  
  // Debug: Log de detalles
  useEffect(() => {
    if (tarea) {
      console.log('🔍 Tarea completa:', tarea)
      console.log('🔍 Detalles encontrados:', detalles)
      console.log('🔍 Current item:', currentItem)
    }
  }, [tarea, detalles, currentItem])

  // Iniciar tarea
  const iniciarMutation = useMutation({
    mutationFn: () => api.startTask(tareaId),
    onSuccess: () => {
      success('Tarea iniciada - Comienza el picking')
      refetch()
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al iniciar la tarea')
    }
  })

  // Completar tarea (pasar a packing)
  const completarPickingMutation = useMutation({
    mutationFn: async () => {
      // Completar la tarea de picking - el backend creará automáticamente la tarea de packing
      const response = await api.completeTask(tareaId)
      console.log('📦 Respuesta completa del backend:', response)
      return response
    },
    onSuccess: (response) => {
      // El backend devuelve { success: true, message: ..., packing_task_id: ..., data: ... }
      const packingTaskId = response?.packing_task_id || response?.data?.packing_task_id
      console.log('📦 packing_task_id extraído:', packingTaskId)
      console.log('📦 Respuesta completa:', response)
      
      if (packingTaskId) {
        success('Picking completado - Tarea de packing creada automáticamente')
        queryClient.invalidateQueries(['tasks'])
        navigate(`/packing/ejecucion/${packingTaskId}`)
      } else {
        success('Picking completado')
        queryClient.invalidateQueries(['tasks'])
        navigate('/packing')
      }
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al completar picking')
    }
  })

  // Manejar escaneo desde la cámara
  const handleCameraScan = (scannedCode) => {
    setScanInput(scannedCode)
    setShowScanner(false)
    
    // Procesar el escaneo según el tipo
    if (scanningFor === 'ubicacion') {
      handleScanUbicacion(null, scannedCode)
    } else if (scanningFor === 'producto') {
      handleScanProducto(null, scannedCode)
    }
  }

  // Validar escaneo - Primero ubicación, luego producto
  const handleScanUbicacion = (e, scannedValue = null) => {
    if (e) e.preventDefault()
    
    if (!currentItem) return

    const codeToCheck = scannedValue || scanInput
    const expectedUbicacion = currentItem.ubicacion_origen?.codigo
    
    if (codeToCheck === expectedUbicacion) {
      setUbicacionValidada(true)
      success(`✓ Ubicación ${expectedUbicacion} verificada`)
      setScanInput('')
    } else {
      error(`Ubicación incorrecta. Esperada: ${expectedUbicacion}`)
    }
  }

  const handleScanProducto = async (e, scannedValue = null) => {
    if (e) e.preventDefault()
    
    if (!currentItem || !ubicacionValidada) {
      warning('Primero debes validar la ubicación')
      return
    }

    const codeToCheck = scannedValue || scanInput
    const expectedCode = currentItem.lote?.lote_codigo || currentItem.producto?.sku
    
    try {
      // Validar escaneo con el backend
      const response = await api.validateScan({
        tarea_id: parseInt(tareaId),
        tipo_escaneo: 'lot',
        valor: codeToCheck,
        cantidad: currentItem.cantidad_solicitada
      })

      if (response.success || codeToCheck === expectedCode || codeToCheck === currentItem.producto?.sku) {
        // Escaneo correcto
        setScannedItems([...scannedItems, {
          detalle_id: currentItem.id,
          producto: currentItem.producto?.nombre,
          cantidad: currentItem.cantidad_solicitada,
          ubicacion: currentItem.ubicacion_origen?.codigo,
          escaneado: true
        }])
        
        success(`✓ ${currentItem.producto?.nombre} verificado`)
        
        // Reset para siguiente item
        setUbicacionValidada(false)
        
        // Reset para siguiente item
        setUbicacionValidada(false)
        
        // Pasar al siguiente item
        if (currentItemIndex < detalles.length - 1) {
          setCurrentItemIndex(currentItemIndex + 1)
        }
        
        setScanInput('')
        refetch()
      } else {
        error(response.message || 'Código incorrecto. Verifica el producto.')
      }
    } catch (err) {
      // Si falla la validación del backend, usar validación local
      if (scanInput === expectedCode || scanInput === currentItem.producto?.sku) {
        setScannedItems([...scannedItems, {
          detalle_id: currentItem.id,
          producto: currentItem.producto?.nombre,
          cantidad: currentItem.cantidad_solicitada,
          ubicacion: currentItem.ubicacion_origen?.codigo,
          escaneado: true
        }])
        
        success(`✓ ${currentItem.producto?.nombre} verificado`)
        setUbicacionValidada(false)
        
        if (currentItemIndex < detalles.length - 1) {
          setCurrentItemIndex(currentItemIndex + 1)
        }
        
        setScanInput('')
      } else {
        error('Código incorrecto. Verifica el producto.')
      }
    }
  }

  // Verificar si todos los items fueron escaneados
  const allItemsScanned = scannedItems.length === detalles.length && detalles.length > 0

  // Obtener estado de la tarea
  const getEstadoInfo = () => {
    switch (tarea?.estado) {
      case 'CREADA':
        return { color: 'bg-gray-100 text-gray-800', text: 'Pendiente de iniciar' }
      case 'ASIGNADA':
        return { color: 'bg-blue-100 text-blue-800', text: 'Asignada - Lista para iniciar' }
      case 'EN_CURSO':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'En ejecución' }
      case 'COMPLETADA':
        return { color: 'bg-green-100 text-green-800', text: 'Completada' }
      default:
        return { color: 'bg-gray-100 text-gray-800', text: tarea?.estado }
    }
  }

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
          onClick={() => navigate('/picking')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Picking
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
          onClick={() => navigate('/picking')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Picking
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
        <p className="text-gray-600 mt-2">Esta tarea no tiene productos asignados para recoger.</p>
        <p className="text-sm text-gray-500 mt-1">Tarea ID: {tarea.id}</p>
        <button 
          onClick={() => navigate('/picking')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Picking
        </button>
      </div>
    )
  }

  const estadoInfo = getEstadoInfo()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Tarea #{tarea.id}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoInfo.color}`}>
                {estadoInfo.text}
              </span>
            </div>
            <p className="text-gray-500 mt-1">Tipo: {tarea.tipo_tarea}</p>
          </div>
          
          <div className="flex gap-3">
            {(tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA') && (
              <button
                onClick={() => iniciarMutation.mutate()}
                disabled={iniciarMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
              >
                <Play className="w-5 h-5" />
                Iniciar Picking
              </button>
            )}
            
            {tarea.estado === 'EN_CURSO' && allItemsScanned && (
              <button
                onClick={() => completarPickingMutation.mutate()}
                disabled={completarPickingMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Check className="w-5 h-5" />
                Completar y Pasar a Packing
              </button>
            )}
            
            <button
              onClick={() => navigate('/picking')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Checking */}
      {tarea.estado === 'EN_CURSO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Item actual */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-confirm-500" />
              Producto a Recoger ({currentItemIndex + 1} de {detalles.length})
            </h2>
            
            {currentItem ? (
              <div className="space-y-4">
                {/* Ubicación destacada */}
                <div className="bg-confirm-50 border-2 border-confirm-500 rounded-xl p-6 text-center">
                  <MapPin className="w-12 h-12 mx-auto text-confirm-600 mb-2" />
                  <p className="text-sm text-confirm-600 font-medium">UBICACIÓN</p>
                  <p className="text-4xl font-bold text-confirm-700">
                    {currentItem.ubicacion?.codigo || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {currentItem.ubicacion?.tipo_ubicacion?.nombre || 'Rack'}
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
                    <span className="text-2xl font-bold text-confirm-600">
                      {currentItem.cantidad_solicitada}
                    </span>
                  </div>
                </div>

                {/* Input de escaneo - Check-in en dos fases */}
                {!ubicacionValidada ? (
                  <form onSubmit={handleScanUbicacion} className="space-y-3">
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-3">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ Paso 1: Valida la ubicación primero
                      </p>
                    </div>
                    <label className="block text-sm font-medium text-gray-700">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Escanea el código de la ubicación
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder="Escanear código de ubicación..."
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-confirm-500 focus:border-confirm-500 text-lg"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScanningFor('ubicacion')
                          setShowScanner(true)
                        }}
                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Usar cámara"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
                      >
                        <Check className="w-6 h-6" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Ubicación esperada: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {currentItem.ubicacion_origen?.codigo}
                      </span>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleScanProducto} className="space-y-3">
                    <div className="bg-green-50 border-2 border-green-400 rounded-lg p-3 mb-3">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ Ubicación validada - Paso 2: Escanea el producto
                      </p>
                    </div>
                    <label className="block text-sm font-medium text-gray-700">
                      <Barcode className="inline w-4 h-4 mr-1" />
                      Escanea el código del producto/lote
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder="Escanear código de producto..."
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-confirm-500 focus:border-confirm-500 text-lg"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setScanningFor('producto')
                          setShowScanner(true)
                        }}
                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Usar cámara"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
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
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium text-gray-900">¡Todos los productos verificados!</p>
                <p className="text-gray-500">Presiona "Completar y Pasar a Packing"</p>
              </div>
            )}
          </div>

          {/* Lista de items */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-500" />
              Lista de Productos
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detalles.map((detalle, index) => {
                const isScanned = scannedItems.find(s => s.detalle_id === detalle.id)
                const isCurrent = index === currentItemIndex
                
                return (
                  <div
                    key={detalle.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      isScanned 
                        ? 'bg-green-50 border-green-300' 
                        : isCurrent 
                          ? 'bg-confirm-50 border-confirm-500' 
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isScanned ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isScanned ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{detalle.producto?.nombre}</p>
                      <p className="text-sm text-gray-500">
                        <MapPin className="inline w-3 h-3 mr-1" />
                        {detalle.ubicacion?.codigo} • Cant: {detalle.cantidad_solicitada}
                      </p>
                    </div>
                    
                    {isCurrent && !isScanned && (
                      <span className="px-2 py-1 bg-confirm-500 text-white text-xs rounded-full">
                        Actual
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progreso */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso</span>
                <span>{scannedItems.length} / {detalles.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-confirm-500 rounded-full h-3 transition-all duration-300"
                  style={{ width: `${(scannedItems.length / detalles.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado inicial - Antes de iniciar */}
      {(tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA') && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Play className="w-16 h-16 mx-auto text-confirm-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Tarea lista para iniciar
          </h2>
          <p className="text-gray-500 mb-6">
            Esta tarea tiene {detalles.length} producto(s) para recoger.
            <br />
            Presiona "Iniciar Picking" para comenzar.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="font-medium text-gray-900 mb-3">Resumen de productos:</h3>
            <ul className="text-left space-y-2">
              {detalles.slice(0, 5).map((detalle, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{detalle.producto?.nombre}</span>
                  <span className="text-gray-500">x{detalle.cantidad_solicitada}</span>
                </li>
              ))}
              {detalles.length > 5 && (
                <li className="text-sm text-gray-500">... y {detalles.length - 5} más</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleCameraScan}
          onClose={() => setShowScanner(false)}
          scanType="barcode"
          title={scanningFor === 'ubicacion' ? 'Escanea el código de ubicación' : 'Escanea el código del producto'}
        />
      )}
    </div>
  )
}

