import { useState } from 'react'
import { Inbox, Plus } from 'lucide-react'
import RecepcionModal from '../../components/Modal/RecepcionModal'

export default function Recepcion() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepción de Mercancía</h1>
          <p className="text-gray-600">Registra la entrada de productos al almacén</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Recepción
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <Inbox className="w-8 h-8 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recepción de Mercancía</h3>
            <p className="text-gray-600">
              Haz clic en "Nueva Recepción" para registrar la entrada de productos al almacén.
              El sistema creará automáticamente las tareas de PUTAWAY correspondientes.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Recepción */}
      <RecepcionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

