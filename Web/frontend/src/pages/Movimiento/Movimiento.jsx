import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Search, Play, CheckCircle } from 'lucide-react'
import TareaDetailModal from '../../components/Modal/TareaDetailModal'
import { useNotification } from '../../contexts/NotificationContext'

export default function Movimiento() {
  const { success, error: showError } = useNotification()
  const [busqueda, setBusqueda] = useState('')
  const [selectedTarea, setSelectedTarea] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: tareas, isLoading } = useQuery({
    queryKey: ['tareas-movimiento'],
    queryFn: () => api.getTasks({ tipo_tarea: 'MOVE' })
  })

  const tareasFiltradas = tareas?.filter(tarea => 
    tarea.numero_tarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.tipo_tarea?.toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  const handleStart = async (tarea) => {
    try {
      await api.startTask(tarea.id)
      success('Tarea iniciada exitosamente')
    } catch (error) {
      showError('Error al iniciar tarea: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleComplete = async (tarea) => {
    try {
      await api.completeTask(tarea.id)
      success('Tarea completada exitosamente')
    } catch (error) {
      showError('Error al completar tarea: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Movimiento</h1>
        <p className="text-gray-600">Gestiona las tareas de movimiento asignadas</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Cargando tareas...</p>
          </div>
        ) : tareasFiltradas.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tareasFiltradas.map((tarea) => (
              <div key={tarea.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tarea.numero_tarea || `Tarea #${tarea.id}`}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tarea.estado === 'CREADA' ? 'bg-blue-100 text-blue-800' :
                        tarea.estado === 'EN_PROCESO' ? 'bg-yellow-100 text-yellow-800' :
                        tarea.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tarea.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Tipo: {tarea.tipo_tarea} | Prioridad: {tarea.prioridad || 'NORMAL'}
                    </p>
                    {tarea.fecha_inicio && (
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Iniciada: {new Date(tarea.fecha_inicio).toLocaleString()}</span>
                        {tarea.fecha_fin && (
                          <span>Finalizada: {new Date(tarea.fecha_fin).toLocaleString()}</span>
                        )}
                        {tarea.tiempo_transcurrido_formateado && (
                          <span className="font-semibold text-primary-600">
                            Tiempo: {tarea.tiempo_transcurrido_formateado}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTarea(tarea)
                        setIsModalOpen(true)
                      }}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Ver Detalles
                    </button>
                    {tarea.estado === 'CREADA' && (
                      <button
                        onClick={() => handleStart(tarea)}
                        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
                      </button>
                    )}
                    {tarea.estado === 'EN_PROCESO' && (
                      <button
                        onClick={() => handleComplete(tarea)}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">No hay tareas de movimiento</p>
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

