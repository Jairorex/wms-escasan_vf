import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'

export default function BarcodeScanner({ 
  onScan, 
  onClose, 
  scanType = 'both', // 'barcode', 'qr', 'both'
  title = 'Escanea el código'
}) {
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const startScanning = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerRef.current.id)
        html5QrCodeRef.current = html5QrCode

        // Configuración para códigos de barras
        const config = {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          formatsToSupport: scanType === 'barcode' 
            ? [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39]
            : scanType === 'qr'
            ? [Html5QrcodeSupportedFormats.QR_CODE]
            : undefined // Ambos por defecto
        }

        await html5QrCode.start(
          { facingMode: 'environment' }, // Cámara trasera
          config,
          (decodedText, decodedResult) => {
            // Éxito al escanear
            handleScanSuccess(decodedText)
          },
          (errorMessage) => {
            // Ignorar errores de escaneo continuo
          }
        )

        setIsScanning(true)
        setError(null)
      } catch (err) {
        console.error('Error al iniciar escáner:', err)
        setError('No se pudo acceder a la cámara. Verifica los permisos.')
        setIsScanning(false)
      }
    }

    startScanning()

    return () => {
      stopScanning()
    }
  }, [])

  const stopScanning = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.error('Error al detener escáner:', err)
      }
      setIsScanning(false)
    }
  }

  const handleScanSuccess = (decodedText) => {
    stopScanning()
    onScan(decodedText)
  }

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-confirm-500" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div 
                id="barcode-scanner"
                ref={scannerRef}
                className="w-full rounded-lg overflow-hidden bg-black"
                style={{ minHeight: '300px' }}
              />
              <p className="text-sm text-gray-600 text-center mt-4">
                Apunta la cámara al código de barras o QR
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

