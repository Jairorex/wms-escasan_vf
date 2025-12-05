import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { Search, Play, CheckCircle, Box, Eye, Package } from 'lucide-react'
import TareaDetailModal from '../../components/Modal/TareaDetailModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Packing() {
  const navigate = useNavigate()
  const { success, error: showError } = useNotification()
  const [busqueda, setBusqueda] = useState('')
  const [selectedTarea, setSelectedTarea] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Cargar tareas PACK y también tareas PICK que fueron completadas (listas para packing)
  const { data: tareas, isLoading } = useQuery({
    queryKey: ['tareas-packing'],
    queryFn: async () => {
      // Obtener tareas tipo PACK
      const packTareas = await api.getTasks({ tipo_tarea: 'PACK' })
      return packTareas || []
    }
  })

  const tareasFiltradas = tareas?.filter(tarea => 
    tarea.numero_tarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.tipo_tarea?.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  // Navegar a la pantalla de ejecución de packing
  const handleEjecutar = (tarea) => {
    navigate(`/packing/ejecucion/${tarea.id}`)
  }

  const handleViewDetails = (tarea) => {
    setSelectedTarea(tarea)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Packing / Empaque</h1>
        <p className="text-gray-600">Verificación y empaque de productos para despacho</p>
      </div>

      {/* Info del flujo */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Box className="w-8 h-8 text-orange-600" />
          <div>
            <h3 className="font-semibold text-orange-900">Flujo de Packing</h3>
            <p className="text-sm text-orange-700">
              Las tareas aparecen aquí cuando el picking ha sido completado. 
              Verifica cada producto y empácalo en cajas para despacho.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas de packing..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando tareas...</p>
          </div>
        ) : tareasFiltradas.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tareasFiltradas.map((tarea) => (
              <div key={tarea.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Box className="w-5 h-5 text-orange-500" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tarea.numero_tarea || `Tarea #${tarea.id}`}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tarea.estado === 'CREADA' ? 'bg-blue-100 text-blue-800' :
                        tarea.estado === 'ASIGNADA' ? 'bg-purple-100 text-purple-800' :
                        tarea.estado === 'EN_CURSO' ? 'bg-yellow-100 text-yellow-800' :
                        tarea.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tarea.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Tipo: {tarea.tipo_tarea} | Prioridad: {tarea.prioridad || 'NORMAL'}
                    </p>
                    {tarea.detalles && tarea.detalles.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {tarea.detalles.length} producto(s) para empacar
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Botón para ejecutar packing con checking */}
                    {(tarea.estado === 'CREADA' || tarea.estado === 'ASIGNADA' || tarea.estado === 'EN_CURSO') && (
                      <button
                        onClick={() => handleEjecutar(tarea)}
                        className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {tarea.estado === 'EN_CURSO' ? 'Continuar' : 'Empacar'}
                      </button>
                    )}
                    
                    {tarea.estado === 'COMPLETADA' && (
                      <span className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Listo para despacho
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleViewDetails(tarea)}
                      className="px-4 py-2 text-sm bg-confirm-500 text-white rounded-lg hover:bg-confirm-600 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay tareas de packing pendientes</p>
            <p className="text-sm text-gray-400 mt-1">
              Las tareas aparecen aquí cuando se completa el picking
            </p>
          </div>
        )}
      </div>

      {selectedTarea && (
        <TareaDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedTarea(null)
          }}
          tareaId={selectedTarea.id}
        />
      )}
    </div>
  )
}
