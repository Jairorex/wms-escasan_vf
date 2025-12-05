import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Inbox, 
  Bell,
  LogOut,
  Database,
  MapPin,
  Boxes,
  Users,
  User,
  ShoppingCart,
  Package2,
  Move,
  BarChart3,
  Warehouse,
  RefreshCw,
  Thermometer,
  Snowflake,
  FileText,
  Barcode,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { info } = useNotification()
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }
  
  const handleLogout = async () => {
    await logout()
    info('Sesión cerrada exitosamente')
    navigate('/login')
  }

  // Determinar navegación según rol
  // El rol puede venir como string o como objeto con propiedad nombre
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const rolNormalizado = userRol?.toLowerCase()?.normalize("NFD").replace(/[\u0300-\u036f]/g, "")?.trim()
  
  // Debug: mostrar el rol en consola para verificar
  console.log('🔍 Rol usuario:', { original: userRol, normalizado: rolNormalizado, user })
  
  // Roles del sistema - usando includes para mayor flexibilidad
  const isAdmin = rolNormalizado === 'administrador' || rolNormalizado?.includes('admin')
  const isSupervisor = rolNormalizado === 'supervisor' && !rolNormalizado?.includes('inventario')
  const isSupervisorInventario = rolNormalizado?.includes('supervisor') && rolNormalizado?.includes('inventario')
  const isOperario = rolNormalizado === 'operario'
  const isRecepcionista = rolNormalizado === 'recepcionista' || rolNormalizado?.includes('recepcion')
  const isOperarioCadenaFria = rolNormalizado?.includes('cadena') || rolNormalizado?.includes('fria') || rolNormalizado?.includes('frio')
  const isOperarioPicking = rolNormalizado?.includes('picking')

  // Construir navegación según rol
  const getNavigation = () => {
    // Dashboard siempre visible
    const nav = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]

    // Tareas para todos los roles operativos
    if (isAdmin || isSupervisor || isSupervisorInventario || isOperario || isOperarioPicking || isOperarioCadenaFria || isRecepcionista) {
      nav.push({ name: 'Tareas', href: '/tareas', icon: ClipboardList })
    }

    // === RECEPCIONISTA ===
    // Recepción, validación, generación de códigos
    // Solo Recepcionista y Admin pueden hacer recepciones (NO supervisores)
    if (isRecepcionista || isAdmin) {
      nav.push({ name: 'Recepción Estándar', href: '/recepcion', icon: Inbox })
      nav.push({ name: 'Generar Etiquetas', href: '/etiquetas', icon: Barcode })
    }

    // === OPERARIO CADENA FRÍA ===
    // Recepción fría, control de temperatura, alertas
    if (isOperarioCadenaFria || isAdmin || isSupervisor) {
      nav.push({ name: 'Recepción Cadena Fría', href: '/recepcion-fria', icon: Snowflake })
      nav.push({ name: 'Control Temperatura', href: '/control-temperatura', icon: Thermometer })
    }

    // === OPERARIO PICKING ===
    // Picking, reabastecimiento, packing
    // Operarios pueden ver picking pero NO crear (solo Admin puede crear)
    if (isOperarioPicking || isOperario || isAdmin || isSupervisor) {
      nav.push({ name: 'Picking', href: '/picking', icon: ShoppingCart })
      nav.push({ name: 'Packing', href: '/packing', icon: Package2 })
    }

    // Reabastecimiento para operarios de picking y supervisores
    if (isOperarioPicking || isAdmin || isSupervisor || isSupervisorInventario) {
      nav.push({ name: 'Reabastecimiento', href: '/reabastecimiento', icon: RefreshCw })
    }

    // === SUPERVISOR INVENTARIO ===
    // Inventario, reportes, control de stock
    if (isSupervisorInventario || isAdmin || isSupervisor) {
      nav.push({ name: 'Inventario', href: '/inventario', icon: Package })
      nav.push({ name: 'Subbodegas', href: '/subbodegas', icon: Warehouse })
      nav.push({ name: 'Reportes', href: '/reportes', icon: FileText })
    }

    // Alertas para todos excepto operarios básicos
    if (isAdmin || isSupervisor || isSupervisorInventario || isOperarioCadenaFria || isRecepcionista) {
      nav.push({ name: 'Alertas', href: '/alertas', icon: Bell })
    }

    // Estadísticas para supervisores y admin
    if (isAdmin || isSupervisor || isSupervisorInventario) {
      nav.push({ name: 'Estadísticas', href: '/estadisticas', icon: BarChart3 })
    }

    // === ADMINISTRADOR ===
    // Catálogos solo para admin
    if (isAdmin) {
      nav.push({
        name: 'Catálogos', 
        href: '/catalogos', 
        icon: Database,
        children: [
          { name: 'Productos', href: '/catalogos/productos', icon: Package },
          { name: 'Ubicaciones', href: '/catalogos/ubicaciones', icon: MapPin },
          { name: 'Lotes', href: '/catalogos/lotes', icon: Boxes },
          { name: 'Usuarios', href: '/catalogos/usuarios', icon: Users },
        ]
      })
    }

    return nav
  }

  const navigation = getNavigation()

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 bg-escasan-green-500 shadow-lg transition-all duration-300 z-50 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo y Botón de Toggle */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-escasan-green-600">
            {!sidebarCollapsed && (
              <h1 className="text-2xl font-bold text-white">WMS ESCASAN</h1>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-escasan-green-600 transition-colors text-white"
              title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              const hasChildren = item.children && item.children.length > 0
              
              if (hasChildren) {
                const isCatalogosActive = item.children.some(child => isActive(child.href))
                return (
                  <div key={item.name} className="space-y-1">
                    <div 
                      className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-medium rounded-lg transition-colors ${
                        isCatalogosActive
                          ? 'bg-escasan-orange-500 text-white'
                          : 'text-white hover:bg-escasan-green-600'
                      }`}
                      title={sidebarCollapsed ? item.name : ''}
                    >
                      <Icon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="ml-8 space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const childActive = isActive(child.href)
                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                                childActive
                                  ? 'bg-escasan-orange-500 text-white'
                                  : 'text-white hover:bg-escasan-orange-500'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 mr-2" />
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-escasan-orange-500 text-white'
                      : 'text-white hover:bg-escasan-orange-500'
                  }`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <Icon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className={`p-4 border-t border-escasan-green-600 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <button 
              onClick={handleLogout}
              className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-2 text-sm font-medium text-white rounded-lg hover:bg-cancel-500 transition-colors`}
              title={sidebarCollapsed ? 'Cerrar Sesión' : ''}
            >
              <LogOut className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
              {!sidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {navigation.find(item => isActive(item.href) || (item.children && item.children.some(child => isActive(child.href))))?.name || 
               navigation.find(item => item.children?.some(child => isActive(child.href)))?.children?.find(child => isActive(child.href))?.name || 
               'Dashboard'}
            </h2>
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.nombre || user.usuario}</span>
                  {userRol && (
                    <span className="px-2 py-1 text-xs bg-escasan-green-100 text-escasan-green-800 rounded-full">
                      {userRol}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

