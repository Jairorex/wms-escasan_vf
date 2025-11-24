import { useState } from 'react'
import { Package, Plus } from 'lucide-react'
import PickingModal from '../../components/Modal/PickingModal'

export default function Picking() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Picking / Salida de Mercancía</h1>
          <p className="text-gray-600">Prepara la salida de productos del almacén</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Preparación
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Picking de Mercancía</h3>
            <p className="text-gray-600">
              Haz clic en "Nueva Preparación" para preparar la salida de productos del almacén.
              El sistema creará automáticamente las tareas de PICKING usando estrategia FEFO (First Expired First Out).
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Picking */}
      <PickingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
