import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, AlertCircle, Loader, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [credentials, setCredentials] = useState({
    usuario: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(credentials)
    
    if (result.success) {
      navigate('/')
    } else {
      setError(result.message || 'Error al iniciar sesión')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-escasan-green-500 via-yellow-500 to-escasan-orange-500 flex items-center justify-center p-4">
      {/* Tarjeta de Login */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-escasan-green-500 mb-1">ESCASAN</h1>
          <p className="text-sm text-gray-500">Escalante Sánchez S.A.</p>
        </div>

        {/* Título de Login */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ingrese a su cuenta</h2>
          <p className="text-sm text-gray-500">Introduzca sus credenciales a continuación</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Usuario */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={credentials.usuario}
                onChange={(e) => {
                  setCredentials({ ...credentials, usuario: e.target.value })
                  setError('')
                }}
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:bg-white transition-colors disabled:opacity-50 text-gray-900 placeholder-gray-500"
                placeholder="Usuario"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => {
                  setCredentials({ ...credentials, password: e.target.value })
                  setError('')
                }}
                required
                disabled={loading}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-escasan-green-500 focus:bg-white transition-colors disabled:opacity-50 text-gray-900 placeholder-gray-500"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-escasan-green-500 text-white rounded-lg hover:bg-escasan-green-600 transition-colors font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Ingresando...
              </>
            ) : (
              <>
                Ingresar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Link Olvidó Contraseña */}
        <div className="text-center mt-6">
          <button
            type="button"
            className="text-sm text-escasan-green-500 hover:text-escasan-green-600 font-medium transition-colors"
          >
            ¿Se te olvidó tu contraseña?
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-white font-medium text-sm drop-shadow-lg">
          Potenciando el <span className="font-bold">CAMPO Y LA GANADERÍA</span>
        </p>
      </div>
    </div>
  )
}
