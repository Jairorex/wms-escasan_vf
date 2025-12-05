import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  MapPin, 
  Package, 
  CheckCircle, 
  Barcode,
  AlertTriangle,
  Play,
  Check,
  X,
  Clock,
  Layers,
  Inbox,
  Camera
} from 'lucide-react'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import BarcodeScanner from '../../components/Scanner/BarcodeScanner'

export default function PutawayEjecucion() {
  const { tareaId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error, warning } = useNotification()
  
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [validatedItems, setValidatedItems] = useState([])
  const [scanInput, setScanInput] = useState('')
  const [checkInPhase, setCheckInPhase] = useState(true) // true = check-in, false = putaway
  const [showScanner, setShowScanner] = useState(false)
  const [scanningFor, setScanningFor] = useState(null) // 'ubicacion' o 'producto'

  // Obtener detalle de la tarea
  const { data: tarea, isLoading, error: tareaError, refetch } = useQuery({
    queryKey: ['tarea-putaway', tareaId],
    queryFn: async () => {
      try {
        const response = await api.getTask(tareaId)
        console.log('📦 Tarea PUTAWAY recibida:', response)
        return response
      } catch (error) {
        console.error('❌ Error al obtener tarea PUTAWAY:', error)
        throw error
      }
    },
    enabled: !!tareaId,
    retry: 2
  })

  // Manejar diferentes estructuras de respuesta
  const detalles = tarea?.detalles || tarea?.detalleTareas || tarea?.detalle_tareas || []
  const currentItem = detalles[currentItemIndex]

  // Iniciar tarea
  const iniciarMutation = useMutation({
    mutationFn: () => api.startTask(tareaId),
    onSuccess: () => {
      success('Tarea iniciada - Comienza el check-in')
      refetch()
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al iniciar la tarea')
    }
  })

  // Completar tarea
  const completarPutawayMutation = useMutation({
    mutationFn: async () => {
      return await api.completeTask(tareaId)
    },
    onSuccess: () => {
      success('¡Putaway completado!')
      queryClient.invalidateQueries(['tasks'])
      navigate('/recepcion')
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Error al completar putaway')
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

  // Validar escaneo de ubicación
  const handleScanUbicacion = (e, scannedValue = null) => {
    if (e) e.preventDefault()
    
    if (!currentItem) return

    const codeToCheck = scannedValue || scanInput
    const expectedUbicacion = currentItem.ubicacion_destino?.codigo
    
    if (codeToCheck === expectedUbicacion) {
      // Ubicación correcta
      setValidatedItems([...validatedItems, {
        detalle_id: currentItem.id,
        ubicacion_validada: true
      }])
      
      success(`✓ Ubicación ${expectedUbicacion} verificada`)
      
      // Pasar al siguiente item
      if (currentItemIndex < detalles.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1)
      } else {
        // Todos los items validados, pasar a fase de putaway
        setCheckInPhase(false)
      }
      
      setScanInput('')
    } else {
      error(`Ubicación incorrecta. Esperada: ${expectedUbicacion}`)
    }
  }

  // Validar escaneo de producto/lote en fase de putaway
  const handleScanProducto = async (e, scannedValue = null) => {
    if (e) e.preventDefault()
    
    if (!currentItem) return

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

      if (response.success) {
        setValidatedItems([...validatedItems, {
          detalle_id: currentItem.id,
          producto_validado: true
        }])
        
        success(`✓ ${currentItem.producto?.nombre} verificado y almacenado`)
        
        // Pasar al siguiente item
        if (currentItemIndex < detalles.length - 1) {
          setCurrentItemIndex(currentItemIndex + 1)
        }
        
        setScanInput('')
        refetch()
      } else {
        error(response.message || 'Error al validar el escaneo')
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error al validar el escaneo')
    }
  }

  // Verificar si todos los items fueron validados
  const allItemsValidated = validatedItems.length === detalles.length && detalles.length > 0

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

  // Debug: Log de detalles
  useEffect(() => {
    if (tarea) {
      console.log('🔍 Tarea PUTAWAY completa:', tarea)
      console.log('🔍 Detalles encontrados:', detalles)
      console.log('🔍 Current item:', currentItem)
      console.log('🔍 Estado de la tarea:', tarea.estado)
      console.log('🔍 checkInPhase:', checkInPhase)
    }
  }, [tarea, detalles, currentItem, checkInPhase])

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
          onClick={() => navigate('/recepcion')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Recepción
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
          onClick={() => navigate('/recepcion')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Recepción
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
        <p className="text-gray-600 mt-2">Esta tarea no tiene productos asignados para ubicar.</p>
        <p className="text-sm text-gray-500 mt-1">Tarea ID: {tarea.id}</p>
        <button 
          onClick={() => navigate('/recepcion')}
          className="mt-4 px-4 py-2 bg-confirm-500 text-white rounded-lg"
        >
          Volver a Recepción
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
                Putaway - Tarea #{tarea.id}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoInfo.color}`}>
                {estadoInfo.text}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              {checkInPhase ? 'Fase: Check-in de Ubicación' : 'Fase: Almacenamiento'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {(tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA') && (
              <button
                onClick={() => iniciarMutation.mutate()}
                disabled={iniciarMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 transition-colors"
              >
                <Play className="w-5 h-5" />
                Iniciar Putaway
              </button>
            )}
            
            {tarea.estado === 'EN_CURSO' && allItemsValidated && !checkInPhase && (
              <button
                onClick={() => completarPutawayMutation.mutate()}
                disabled={completarPutawayMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Check className="w-5 h-5" />
                Completar Putaway
              </button>
            )}
            
            <button
              onClick={() => navigate('/recepcion')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Check-in / Putaway */}
      {tarea.estado === 'EN_CURSO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Item actual */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {checkInPhase ? (
                <>
                  <MapPin className="w-5 h-5 text-confirm-500" />
                  Check-in Ubicación ({currentItemIndex + 1} de {detalles.length})
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 text-confirm-500" />
                  Almacenar Producto ({currentItemIndex + 1} de {detalles.length})
                </>
              )}
            </h2>
            
            {currentItem ? (
              <div className="space-y-4">
                {/* Ubicación destacada (solo en check-in) */}
                {checkInPhase && (
                  <div className="bg-confirm-50 border-2 border-confirm-500 rounded-xl p-6 text-center">
                    <MapPin className="w-12 h-12 mx-auto text-confirm-600 mb-2" />
                    <p className="text-sm text-confirm-600 font-medium">UBICACIÓN DESTINO</p>
                    <p className="text-4xl font-bold text-confirm-700">
                      {currentItem.ubicacion_destino?.codigo || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Escanea el código de la ubicación para verificar
                    </p>
                  </div>
                )}

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
                  {!checkInPhase && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Ubicación:</span>
                      <span className="font-mono text-confirm-600">
                        {currentItem.ubicacion_destino?.codigo || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Input de escaneo */}
                <form onSubmit={checkInPhase ? handleScanUbicacion : handleScanProducto} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Barcode className="inline w-4 h-4 mr-1" />
                    {checkInPhase ? 'Escanea el código de la ubicación' : 'Escanea el código del producto/lote'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder={checkInPhase ? "Escanear código de ubicación..." : "Escanear código de producto..."}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-confirm-500 focus:border-confirm-500 text-lg"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScanningFor(checkInPhase ? 'ubicacion' : 'producto')
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
                    {checkInPhase ? (
                      <>Código esperado: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {currentItem.ubicacion_destino?.codigo}
                      </span></>
                    ) : (
                      <>Código esperado: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {currentItem.lote?.lote_codigo || currentItem.producto?.sku}
                      </span></>
                    )}
                  </p>
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium text-gray-900">¡Todos los productos almacenados!</p>
                <p className="text-gray-500">Presiona "Completar Putaway"</p>
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
                const isValidated = validatedItems.find(v => v.detalle_id === detalle.id)
                const isCurrent = index === currentItemIndex
                
                return (
                  <div
                    key={detalle.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      isValidated 
                        ? 'bg-green-50 border-green-300' 
                        : isCurrent 
                          ? 'bg-confirm-50 border-confirm-500' 
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isValidated ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isValidated ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{detalle.producto?.nombre}</p>
                      <p className="text-sm text-gray-500">
                        <MapPin className="inline w-3 h-3 mr-1" />
                        {detalle.ubicacion_destino?.codigo} • Cant: {detalle.cantidad_solicitada}
                      </p>
                    </div>
                    
                    {isCurrent && !isValidated && (
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
                <span>{validatedItems.length} / {detalles.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-confirm-500 rounded-full h-3 transition-all duration-300"
                  style={{ width: `${(validatedItems.length / detalles.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado inicial - Antes de iniciar */}
      {(tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA') && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Inbox className="w-16 h-16 mx-auto text-confirm-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Tarea lista para iniciar
          </h2>
          <p className="text-gray-500 mb-6">
            Esta tarea tiene {detalles.length} producto(s) para almacenar.
            <br />
            Presiona "Iniciar Putaway" para comenzar con el check-in de ubicaciones.
          </p>
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

