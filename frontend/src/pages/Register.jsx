import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  Scissors,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Users,
  Calendar,
  MapPin,
  Building
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useForm } from 'react-hook-form'
import LoadingSpinner from '@components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Register = () => {
  const [userType, setUserType] = useState('client') // 'client' or 'barber'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  const { registerClient, registerBarber, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Check URL params for user type
  useEffect(() => {
    const tipo = searchParams.get('tipo')
    if (tipo === 'barbero') {
      setUserType('barber')
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      businessName: '',
      rut: '',
      address: ''
    }
  })

  const password = watch('password')

  // Handle form submission
  const onSubmit = async (data) => {
    if (!acceptTerms) {
      toast.error('Debes aceptar los términos y condiciones')
      return
    }

    if (data.password !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      const registerFunction = userType === 'client' ? registerClient : registerBarber
      
      await registerFunction({
        ...data,
        acceptTerms
      })
      
      toast.success('¡Registro exitoso! Bienvenido a Córtate.cl')
      navigate('/')
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Registration error:', error)
    }
  }

  // Password strength validation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    const levels = [
      { strength: 0, text: 'Muy débil', color: 'text-red-500' },
      { strength: 1, text: 'Débil', color: 'text-orange-500' },
      { strength: 2, text: 'Buena', color: 'text-yellow-500' },
      { strength: 3, text: 'Fuerte', color: 'text-green-500' },
      { strength: 4, text: 'Muy fuerte', color: 'text-green-600' }
    ]
    
    return levels[strength] || levels[0]
  }

  const passwordStrength = getPasswordStrength(password)

  // User type selection
  const userTypes = [
    {
      type: 'client',
      title: 'Soy Cliente',
      description: 'Quiero encontrar y reservar servicios de barbería',
      icon: User,
      features: [
        'Buscar barberos cercanos',
        'Reservar citas online',
        'Ver reseñas y precios',
        'Servicios a domicilio'
      ]
    },
    {
      type: 'barber',
      title: 'Soy Barbero',
      description: 'Quiero ofrecer mis servicios y recibir clientes',
      icon: Scissors,
      features: [
        'Crear perfil profesional',
        'Recibir reservas automáticas',
        'Gestionar agenda',
        'Aumentar ingresos'
      ]
    }
  ]

  if (loading) {
    return <LoadingSpinner fullScreen message="Verificando sesión..." />
  }

  return (
    <>
      <Helmet>
        <title>Registrarse - Córtate.cl</title>
        <meta name="description" content="Únete a Córtate.cl como cliente para encontrar barberos o como barbero para ofrecer tus servicios." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <Scissors className="w-7 h-7 text-black" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                CÓRTATE.CL
              </span>
            </Link>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Únete a Córtate.cl
            </h1>
            <p className="text-gray-400 text-lg">
              Elige cómo quieres usar nuestra plataforma
            </p>
          </motion.div>

          {/* User Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {userTypes.map((type) => {
              const Icon = type.icon
              const isSelected = userType === type.type
              
              return (
                <motion.button
                  key={type.type}
                  onClick={() => setUserType(type.type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary-500' : 'bg-gray-700'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-black' : 'text-gray-300'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{type.title}</h3>
                      <p className="text-gray-400 text-sm">{type.description}</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.button>
              )
            })}
          </motion.div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {userType === 'client' ? 'Registro de Cliente' : 'Registro de Barbero'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('firstName', {
                          required: 'El nombre es requerido',
                          minLength: {
                            value: 2,
                            message: 'El nombre debe tener al menos 2 caracteres'
                          }
                        })}
                        type="text"
                        className={`w-full pl-10 pr-3 py-3 border ${
                          errors.firstName ? 'border-red-500' : 'border-gray-600'
                        } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                        placeholder="Tu nombre"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.firstName.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Apellido *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('lastName', {
                          required: 'El apellido es requerido',
                          minLength: {
                            value: 2,
                            message: 'El apellido debe tener al menos 2 caracteres'
                          }
                        })}
                        type="text"
                        className={`w-full pl-10 pr-3 py-3 border ${
                          errors.lastName ? 'border-red-500' : 'border-gray-600'
                        } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                        placeholder="Tu apellido"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.lastName.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                      className={`w-full pl-10 pr-3 py-3 border ${
                        errors.email ? 'border-red-500' : 'border-gray-600'
                      } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
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

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('phone', {
                        required: 'El teléfono es requerido',
                        pattern: {
                          value: /^(\+?56)?[2-9]\d{7,8}$/,
                          message: 'Formato de teléfono chileno inválido'
                        }
                      })}
                      type="tel"
                      className={`w-full pl-10 pr-3 py-3 border ${
                        errors.phone ? 'border-red-500' : 'border-gray-600'
                      } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.phone.message}</span>
                    </p>
                  )}
                </div>

                {/* Date of Birth (only for clients) */}
                {userType === 'client' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de nacimiento *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('dateOfBirth', {
                          required: 'La fecha de nacimiento es requerida',
                          validate: (value) => {
                            const age = new Date().getFullYear() - new Date(value).getFullYear()
                            return age >= 16 || 'Debes tener al menos 16 años'
                          }
                        })}
                        type="date"
                        className={`w-full pl-10 pr-3 py-3 border ${
                          errors.dateOfBirth ? 'border-red-500' : 'border-gray-600'
                        } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.dateOfBirth.message}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Barber-specific fields */}
                <AnimatePresence>
                  {userType === 'barber' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 border-t border-gray-700 pt-6"
                    >
                      <h3 className="text-lg font-semibold text-primary-400 mb-4">
                        Información Profesional
                      </h3>

                      {/* Business Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nombre del negocio *
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            {...register('businessName', {
                              required: userType === 'barber' ? 'El nombre del negocio es requerido' : false
                            })}
                            type="text"
                            className={`w-full pl-10 pr-3 py-3 border ${
                              errors.businessName ? 'border-red-500' : 'border-gray-600'
                            } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                            placeholder="Barbería Los Maestros"
                          />
                        </div>
                        {errors.businessName && (
                          <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.businessName.message}</span>
                          </p>
                        )}
                      </div>

                      {/* RUT */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          RUT *
                        </label>
                        <input
                          {...register('rut', {
                            required: userType === 'barber' ? 'El RUT es requerido' : false,
                            pattern: {
                              value: /^[0-9]+-[0-9kK]{1}$/,
                              message: 'Formato de RUT inválido (ej: 12345678-9)'
                            }
                          })}
                          type="text"
                          className={`w-full px-3 py-3 border ${
                            errors.rut ? 'border-red-500' : 'border-gray-600'
                          } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                          placeholder="12345678-9"
                        />
                        {errors.rut && (
                          <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.rut.message}</span>
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Dirección del local *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            {...register('address', {
                              required: userType === 'barber' ? 'La dirección es requerida' : false
                            })}
                            type="text"
                            className={`w-full pl-10 pr-3 py-3 border ${
                              errors.address ? 'border-red-500' : 'border-gray-600'
                            } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                            placeholder="Av. Providencia 123, Providencia"
                          />
                        </div>
                        {errors.address && (
                          <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.address.message}</span>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('password', {
                        required: 'La contraseña es requerida',
                        minLength: {
                          value: 6,
                          message: 'La contraseña debe tener al menos 6 caracteres'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full pl-10 pr-12 py-3 border ${
                        errors.password ? 'border-red-500' : 'border-gray-600'
                      } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                      placeholder="Tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Fortaleza de contraseña:</span>
                        <span className={`text-xs ${passwordStrength.color}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.strength === 0 ? 'bg-red-500' :
                            passwordStrength.strength === 1 ? 'bg-orange-500' :
                            passwordStrength.strength === 2 ? 'bg-yellow-500' :
                            passwordStrength.strength === 3 ? 'bg-green-500' : 'bg-green-600'
                          }`}
                          style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password.message}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('confirmPassword', {
                        required: 'Confirma tu contraseña',
                        validate: (value) => value === password || 'Las contraseñas no coinciden'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`w-full pl-10 pr-12 py-3 border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                      } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                      placeholder="Confirma tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.confirmPassword.message}</span>
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-600 bg-gray-800 rounded"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-300">
                    Acepto los{' '}
                    <Link to="/terminos" className="text-primary-400 hover:text-primary-300">
                      términos y condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link to="/privacidad" className="text-primary-400 hover:text-primary-300">
                      política de privacidad
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !acceptTerms}
                  className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <span>
                        {userType === 'client' ? 'Crear cuenta de cliente' : 'Crear cuenta de barbero'}
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center pt-6 border-t border-gray-700 mt-8">
                <p className="text-gray-400">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default Register
