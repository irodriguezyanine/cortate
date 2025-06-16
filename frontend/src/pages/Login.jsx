import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Scissors,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useForm } from 'react-hook-form'
import LoadingSpinner from '@components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  const { login, loading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get redirect location
  const from = location.state?.from || '/'
  
  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, from])

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      await login({
        ...data,
        rememberMe
      })
      
      // Navigation is handled by useEffect above
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login error:', error)
    }
  }

  // Demo accounts for testing
  const demoAccounts = [
    {
      type: 'Cliente',
      email: 'cliente@demo.com',
      password: 'demo123',
      color: 'bg-blue-500'
    },
    {
      type: 'Barbero',
      email: 'barbero@demo.com',
      password: 'demo123',
      color: 'bg-green-500'
    }
  ]

  const fillDemoAccount = (account) => {
    // Using setValue from react-hook-form doesn't work well with controlled inputs
    // So we'll use a different approach
    document.querySelector('input[name="email"]').value = account.email
    document.querySelector('input[name="password"]').value = account.password
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Verificando sesión..." />
  }

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - Córtate.cl</title>
        <meta name="description" content="Inicia sesión en Córtate.cl para acceder a tu cuenta y gestionar tus reservas de cortes de pelo." />
      </Helmet>

      <div className="min-h-screen bg-black flex">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full space-y-8"
          >
            {/* Header */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                  <Scissors className="w-7 h-7 text-black" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  CÓRTATE.CL
                </span>
              </Link>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                ¡Bienvenido de vuelta!
              </h1>
              <p className="text-gray-400">
                Inicia sesión para acceder a tu cuenta
              </p>
            </div>

            {/* Demo Accounts */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-3">Cuentas de prueba:</p>
                <div className="flex space-x-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.type}
                      onClick={() => fillDemoAccount(account)}
                      className={`flex-1 ${account.color} text-white px-3 py-2 rounded text-xs font-medium hover:opacity-80 transition-opacity`}
                    >
                      {account.type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    autoComplete="email"
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.email ? 'border-red-500' : 'border-gray-600'
                    } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors`}
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password', {
                      required: 'La contraseña es requerida',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`block w-full pl-10 pr-12 py-3 border ${
                      errors.password ? 'border-red-500' : 'border-gray-600'
                    } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors`}
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-600 bg-gray-800 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Recordarme
                  </label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                >
                  <p className="text-red-400 text-sm flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </p>
                </motion.div>
              )}
            </form>

            {/* Register Link */}
            <div className="text-center pt-6 border-t border-gray-700">
              <p className="text-gray-400">
                ¿No tienes una cuenta?{' '}
                <Link
                  to="/register"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>

            {/* Social Login (Future) */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">O continúa con</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-600 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium">Google</span>
              </button>
              <button
                type="button"
                disabled
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-600 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium">Facebook</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Próximamente: Inicio de sesión con redes sociales
            </p>
          </motion.div>
        </div>

        {/* Right Side - Image/Branding */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-primary-600/30" />
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-hero-pattern opacity-10" />
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-center p-12">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center max-w-lg"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <Scissors className="w-12 h-12 text-black" />
              </motion.div>
              
              <h2 className="text-4xl font-bold text-white mb-6">
                Tu corte perfecto te está esperando
              </h2>
              
              <p className="text-xl text-gray-300 mb-8">
                Conectamos con los mejores barberos de Chile. 
                Reserva online y disfruta de un servicio de calidad.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span>Barberos verificados y profesionales</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span>Servicios a domicilio y en local</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span>Reservas online las 24 horas</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
