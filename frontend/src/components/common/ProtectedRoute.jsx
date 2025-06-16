import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Lock } from 'lucide-react'

const ProtectedRoute = ({ 
  children, 
  role = null, 
  requireVerification = false,
  fallbackUrl = '/login'
}) => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    hasRole,
    isBarber,
    isClient 
  } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner fullScreen message="Verificando acceso..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackUrl} 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // Check role-based access
  if (role && !hasRole(role)) {
    return <UnauthorizedAccess userRole={user?.role} requiredRole={role} />
  }

  // Check email verification if required
  if (requireVerification && !user?.emailVerified) {
    return <EmailVerificationRequired />
  }

  // Check if barber profile is complete (for barber routes)
  if (role === 'barber' && isBarber() && !isBarberProfileComplete(user)) {
    return <IncompleteBarberProfile />
  }

  // Check if user account is active
  if (user?.accountStatus?.status === 'suspended') {
    return <AccountSuspended />
  }

  if (user?.accountStatus?.status === 'banned') {
    return <AccountBanned />
  }

  // All checks passed, render children
  return children
}

// Helper function to check if barber profile is complete
const isBarberProfileComplete = (user) => {
  if (!user?.barberProfile) return false
  
  const profile = user.barberProfile
  const required = [
    'businessName',
    'services.corteHombre.price',
    'services.corteBarba.price',
    'location.address'
  ]
  
  return required.every(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], profile)
    return value !== undefined && value !== null && value !== ''
  })
}

// Unauthorized access component
const UnauthorizedAccess = ({ userRole, requiredRole }) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Acceso No Autorizado
        </h1>
        
        <p className="text-gray-400 mb-6">
          No tienes permisos para acceder a esta página. 
          {requiredRole && (
            <>
              <br />
              <span className="text-sm">
                Se requiere rol de: <span className="text-primary-400 font-medium">{requiredRole}</span>
              </span>
              <br />
              <span className="text-sm">
                Tu rol actual: <span className="text-gray-300 font-medium">{userRole}</span>
              </span>
            </>
          )}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full btn btn-primary"
          >
            Volver
          </button>
          
          <Navigate to="/" replace />
        </div>
      </motion.div>
    </div>
  )
}

// Email verification required component
const EmailVerificationRequired = () => {
  const { user, resendVerification } = useAuth()
  const [isResending, setIsResending] = React.useState(false)
  const [resent, setResent] = React.useState(false)

  const handleResendVerification = async () => {
    try {
      setIsResending(true)
      await resendVerification()
      setResent(true)
    } catch (error) {
      console.error('Error resending verification:', error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-yellow-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Verificación de Email Requerida
        </h1>
        
        <p className="text-gray-400 mb-6">
          Para acceder a esta página, necesitas verificar tu dirección de email.
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            Email: {user?.email}
          </span>
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleResendVerification}
            disabled={isResending || resent}
            className="w-full btn btn-primary"
          >
            {isResending ? (
              <LoadingSpinner size="sm" />
            ) : resent ? (
              'Email Enviado ✓'
            ) : (
              'Reenviar Email de Verificación'
            )}
          </button>
          
          {resent && (
            <p className="text-green-400 text-sm">
              Se envió un nuevo email de verificación. Revisa tu bandeja de entrada.
            </p>
          )}
          
          <button
            onClick={() => window.history.back()}
            className="w-full btn btn-ghost"
          >
            Volver
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Incomplete barber profile component
const IncompleteBarberProfile = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-primary-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Perfil Incompleto
        </h1>
        
        <p className="text-gray-400 mb-6">
          Para acceder al dashboard, necesitas completar tu perfil de barbero con:
        </p>
        
        <ul className="text-left text-gray-300 mb-6 space-y-2">
          <li>• Nombre del negocio</li>
          <li>• Precios de servicios básicos</li>
          <li>• Dirección del local</li>
          <li>• Horarios de atención</li>
        </ul>
        
        <div className="space-y-3">
          <Navigate to="/perfil/completar" replace />
          
          <button
            onClick={() => window.history.back()}
            className="w-full btn btn-ghost"
          >
            Volver
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Account suspended component
const AccountSuspended = () => {
  const { user } = useAuth()
  const suspensionEnd = user?.accountStatus?.suspendedUntil
  const reason = user?.accountStatus?.suspensionReason

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-orange-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Cuenta Suspendida
        </h1>
        
        <p className="text-gray-400 mb-4">
          Tu cuenta ha sido suspendida temporalmente.
        </p>
        
        {reason && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
            <p className="text-orange-300 text-sm">
              <strong>Motivo:</strong> {reason}
            </p>
          </div>
        )}
        
        {suspensionEnd && (
          <p className="text-gray-300 text-sm mb-6">
            La suspensión termina el: {new Date(suspensionEnd).toLocaleDateString('es-CL')}
          </p>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => window.open('mailto:soporte@cortate.cl', '_blank')}
            className="w-full btn btn-primary"
          >
            Contactar Soporte
          </button>
          
          <Navigate to="/" replace />
        </div>
      </motion.div>
    </div>
  )
}

// Account banned component
const AccountBanned = () => {
  const { user } = useAuth()
  const reason = user?.accountStatus?.banReason

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Cuenta Bloqueada
        </h1>
        
        <p className="text-gray-400 mb-4">
          Tu cuenta ha sido bloqueada permanentemente.
        </p>
        
        {reason && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">
              <strong>Motivo:</strong> {reason}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => window.open('mailto:apelaciones@cortate.cl', '_blank')}
            className="w-full btn btn-primary"
          >
            Apelar Bloqueo
          </button>
          
          <Navigate to="/" replace />
        </div>
      </motion.div>
    </div>
  )
}

// Higher-order component for role-based protection
export const withRoleProtection = (Component, requiredRole) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute role={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking permissions
export const usePermissions = () => {
  const { user, hasRole, isAuthenticated } = useAuth()
  
  return {
    canAccessBarberDashboard: isAuthenticated && hasRole('barber'),
    canAccessClientProfile: isAuthenticated && hasRole('client'),
    canAccessAdminPanel: isAuthenticated && hasRole('admin'),
    canCreateBooking: isAuthenticated && hasRole('client'),
    canManageBookings: isAuthenticated && hasRole('barber'),
    isAccountActive: user?.accountStatus?.status === 'active'
  }
}

export default ProtectedRoute
