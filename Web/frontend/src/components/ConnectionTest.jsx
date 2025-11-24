import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function ConnectionTest() {
  const [status, setStatus] = useState('checking')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('checking')
        // Probar endpoint de health simple (más rápido)
        const response = await fetch('http://localhost:8000/api/health/simple')
        const result = await response.json()
        
        if (result.status === 'ok' || result.success) {
          setStatus('connected')
          setData(result)
        } else {
          setStatus('error')
          setError(result.message || 'Error desconocido')
        }
      } catch (err) {
        setStatus('error')
        setError(err.message || 'No se pudo conectar al backend')
      }
    }

    testConnection()
    // Probar cada 30 segundos
    const interval = setInterval(testConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-50 min-w-[300px]">
      <div className="flex items-center gap-2 mb-2">
        {status === 'checking' && <Loader className="w-4 h-4 animate-spin text-blue-600" />}
        {status === 'connected' && <CheckCircle className="w-4 h-4 text-green-600" />}
        {status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
        <span className="text-sm font-semibold">
          {status === 'checking' && 'Verificando conexión...'}
          {status === 'connected' && 'Backend conectado'}
          {status === 'error' && 'Error de conexión'}
        </span>
      </div>
      
      {status === 'connected' && data && (
        <div className="text-xs text-gray-600 space-y-1">
          <p>✓ Estado: {data.status || 'Conectado'}</p>
          <p>✓ Versión: {data.version || '1.0.0'}</p>
          <p>✓ Timestamp: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-xs text-red-600">
          <p>{error}</p>
          <p className="mt-1 text-gray-500">Verifica que el backend esté corriendo en http://localhost:8000</p>
        </div>
      )}
    </div>
  )
}

