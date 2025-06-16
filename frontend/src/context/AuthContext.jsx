import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '@services/authService'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
  refreshing: false
}

// Auth actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_REFRESHING: 'SET_REFRESHING'
}

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      }
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    case AUTH_ACTIONS.SET_REFRESHING:
      return {
        ...state,
        refreshing: action.payload
      }
    
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
          
          // Verify token with backend
          const response = await authService.getProfile()
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token
            }
          })
        } catch (error) {
          console.error('Token verification failed:', error)
          localStorage.removeItem('token')
          dispatch({ type: AUTH_ACTIONS.LOGOUT })
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
      
      const response = await authService.login(credentials)
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token)
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      })
      
      toast.success(`¡Bienvenido, ${response.data.user.profile.firstName}!`)
      return response.data
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión'
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: errorMessage
      })
      
      toast.error(errorMessage)
      throw error
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
      
      const response = await authService.register(userData)
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token)
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      })
      
      toast.success('¡Registro exitoso! Bienvenido a Córtate.cl')
      return response.data
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al registrarse'
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage
      })
      
      toast.error(errorMessage)
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success('Sesión cerrada correctamente')
    }
  }

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await authService.updateProfile(userData)
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.data.user
      })
      
      toast.success('Perfil actualizado correctamente')
      return response.data
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar perfil'
      toast.error(errorMessage)
      throw error
    }
  }

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData)
      toast.success('Contraseña actualizada correctamente')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al cambiar contraseña'
      toast.error(errorMessage)
      throw error
    }
  }

  // Refresh token
  const refreshToken = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_REFRESHING, payload: true })
      
      const response = await authService.refreshToken()
      
      localStorage.setItem('token', response.data.token)
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      })
      
      return response.data.token
      
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      throw error
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_REFRESHING, payload: false })
    }
  }

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email)
      toast.success('Se envió un enlace de recuperación a tu email')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al enviar email de recuperación'
      toast.error(errorMessage)
      throw error
    }
  }

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await authService.resetPassword(token, password)
      toast.success('Contraseña restablecida correctamente')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al restablecer contraseña'
      toast.error(errorMessage)
      throw error
    }
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role
  }

  // Check if user is barber
  const isBarber = () => {
    return hasRole('barber')
  }

  // Check if user is client
  const isClient = () => {
    return hasRole('client')
  }

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin')
  }

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    changePassword,
    refreshToken,
    forgotPassword,
    resetPassword,
    clearError,
    
    // Helpers
    hasRole,
    isBarber,
    isClient,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext
