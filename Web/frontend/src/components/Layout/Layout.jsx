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
  BarChart3
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { info } = useNotification()

  const handleLogout = async () => {
    await logout()
    info('Sesión cerrada exitosamente')
    navigate('/login')
  }

  // Determinar navegación según rol
  // El rol puede venir como string o como objeto con propiedad nombre
  const userRol = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre
  const isAdmin = userRol?.toLowerCase() === 'administrador'
  const isSupervisor = userRol?.toLowerCase() === 'supervisor'
  const isOperario = userRol?.toLowerCase() === 'operario'

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tareas', href: '/tareas', icon: ClipboardList },
    // Pestañas de operaciones (solo para operarios y supervisores)
    ...((isAdmin||isOperario || isSupervisor) ? [
      { name: 'Picking', href: '/picking', icon: ShoppingCart },
      { name: 'Packing', href: '/packing', icon: Package2 },
      { name: 'Movimiento', href: '/movimiento', icon: Move },
    ] : []),
    // Solo admin y supervisor ven inventario y recepción
    ...((isAdmin || isSupervisor) ? [
      { name: 'Inventario', href: '/inventario', icon: Package },
      { name: 'Recepción', href: '/recepcion', icon: Inbox },
    ] : []),
    { name: 'Alertas', href: '/alertas', icon: Bell },
    // Catálogos solo para admin
    ...(isAdmin ? [{
      name: 'Catálogos', 
      href: '/catalogos', 
      icon: Database,
      children: [
        { name: 'Productos', href: '/catalogos/productos', icon: Package },
        { name: 'Ubicaciones', href: '/catalogos/ubicaciones', icon: MapPin },
        { name: 'Lotes', href: '/catalogos/lotes', icon: Boxes },
        { name: 'Usuarios', href: '/catalogos/usuarios', icon: Users },
      ]
    }] : []),
    // Estadísticas de supervisores (solo admin y supervisor)
    ...((isAdmin || isSupervisor) ? [
      { name: 'Estadísticas', href: '/estadisticas', icon: BarChart3 },
    ] : []),
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <h1 className="text-2xl font-bold text-primary-600">WMS</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              const hasChildren = item.children && item.children.length > 0
              
              if (hasChildren) {
                const isCatalogosActive = item.children.some(child => isActive(child.href))
                return (
                  <div key={item.name} className="space-y-1">
                    <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                      isCatalogosActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700'
                    }`}>
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
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
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <ChildIcon className="w-4 h-4 mr-2" />
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
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
                    <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
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

