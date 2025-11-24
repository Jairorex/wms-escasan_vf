import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay usuario guardado en localStorage
    const savedUser = localStorage.getItem('auth_user')
    const token = localStorage.getItem('auth_token')
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Error parsing saved user:', e)
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const response = await api.login(credentials)
      
      if (response.success && response.data) {
        const userData = response.data.usuario
        const token = response.data.token

        if (token) {
          localStorage.setItem('auth_token', token)
        }
        if (userData) {
          localStorage.setItem('auth_user', JSON.stringify(userData))
          setUser(userData)
        }
        
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || 'Error al iniciar sesión' }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Error al conectar con el servidor' 
      }
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setUser(null)
    }
  }

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

