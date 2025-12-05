import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import Tareas from './pages/Tareas/Tareas'
import Picking from './pages/Picking/Picking'
import PickingEjecucion from './pages/Picking/PickingEjecucion'
import Packing from './pages/Packing/Packing'
import PackingEjecucion from './pages/Packing/PackingEjecucion'
import PutawayEjecucion from './pages/Putaway/PutawayEjecucion'
import Inventario from './pages/Inventario/Inventario'
import Recepcion from './pages/Recepcion/Recepcion'
import Alertas from './pages/Alertas/Alertas'
import Productos from './pages/Catalogos/Productos'
import Ubicaciones from './pages/Catalogos/Ubicaciones'
import Lotes from './pages/Catalogos/Lotes'
import Usuarios from './pages/Catalogos/Usuarios'
import Estadisticas from './pages/Estadisticas/Estadisticas'
import Login from './pages/Login/Login'
// Nuevos módulos WMS v2.0
import Subbodegas from './pages/Subbodegas/Subbodegas'
import Reabastecimiento from './pages/Reabastecimiento/Reabastecimiento'
// Módulos por rol
import RecepcionCadenaFria from './pages/RecepcionCadenaFria/RecepcionCadenaFria'
import ControlTemperatura from './pages/ControlTemperatura/ControlTemperatura'
import Etiquetas from './pages/Etiquetas/Etiquetas'
import Reportes from './pages/Reportes/Reportes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="picking" element={<Picking />} />
          <Route path="picking/ejecucion/:tareaId" element={<PickingEjecucion />} />
          <Route path="packing" element={<Packing />} />
          <Route path="packing/ejecucion/:tareaId" element={<PackingEjecucion />} />
          <Route path="putaway/ejecucion/:tareaId" element={<PutawayEjecucion />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="recepcion" element={<Recepcion />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          {/* Nuevos módulos WMS v2.0 */}
          <Route path="subbodegas" element={<Subbodegas />} />
          <Route path="reabastecimiento" element={<Reabastecimiento />} />
          {/* Módulos por rol */}
          <Route path="recepcion-fria" element={<RecepcionCadenaFria />} />
          <Route path="control-temperatura" element={<ControlTemperatura />} />
          <Route path="etiquetas" element={<Etiquetas />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="catalogos">
            <Route path="productos" element={<Productos />} />
            <Route path="ubicaciones" element={<Ubicaciones />} />
            <Route path="lotes" element={<Lotes />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </QueryClientProvider>
  )
}

export default App
