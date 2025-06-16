import React from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Mail,
  ArrowLeft 
} from 'lucide-react'

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const [isResetting, setIsResetting] = React.useState(false)
  const [showDetails, setShowDetails] = React.useState(false)

  const handleReset = async () => {
    setIsResetting(true)
    // Small delay to show loading state
    setTimeout(() => {
      resetErrorBoundary()
      setIsResetting(false)
    }, 1000)
  }

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    const subject = encodeURIComponent('Error Report - Córtate.cl')
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(errorReport, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `)

    window.open(`mailto:soporte@cortate.cl?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            ¡Ups! Algo salió mal
          </h1>
          
          <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
            Ha ocurrido un error inesperado. No te preocupes, nuestro equipo ha sido notificado y estamos trabajando para solucionarlo.
          </p>
        </motion.div>

        {/* Error Details Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-300 text-sm flex items-center mx-auto space-x-2 transition-colors"
          >
            <Bug className="w-4 h-4" />
            <span>{showDetails ? 'Ocultar' : 'Ver'} detalles técnicos</span>
          </button>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-gray-900 border border-gray-700 rounded-lg p-4 text-left overflow-hidden"
            >
              <h3 className="text-red-400 font-medium mb-2">Error Message:</h3>
              <code className="text-gray-300 text-sm block mb-4 break-all">
                {error.message}
              </code>
              
              {error.stack && (
                <>
                  <h3 className="text-red-400 font-medium mb-2">Stack Trace:</h3>
                  <pre className="text-gray-400 text-xs overflow-x-auto whitespace-pre-wrap max-h-40 scrollbar-thin">
                    {error.stack}
                  </pre>
                </>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {/* Reload Button */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="btn btn-primary flex items-center justify-center space-x-2 min-w-[140px]"
          >
            <RefreshCw className={`w-5 h-5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Recargando...' : 'Intentar de nuevo'}</span>
          </button>

          {/* Home Button */}
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-secondary flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Ir al inicio</span>
          </button>

          {/* Report Error Button */}
          <button
            onClick={handleReportError}
            className="btn btn-ghost flex items-center justify-center space-x-2"
          >
            <Mail className="w-5 h-5" />
            <span>Reportar error</span>
          </button>
        </motion.div>

        {/* Additional Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-8 border-t border-gray-800"
        >
          <p className="text-gray-500 text-sm mb-4">
            Si el problema persiste, puedes:
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => window.open('https://wa.me/56912345678', '_blank')}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Contactar por WhatsApp
            </button>
            
            <button
              onClick={() => window.open('mailto:soporte@cortate.cl', '_blank')}
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Enviar email
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-xs text-gray-600"
        >
          Error ID: {Date.now().toString(36)} • {new Date().toLocaleString('es-CL')}
        </motion.p>
      </motion.div>
    </div>
  )
}

// Network Error Component
export const NetworkError = ({ onRetry }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full text-center"
    >
      <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-10 h-10 text-orange-400" />
      </div>
      
      <h1 className="text-2xl font-bold mb-4">Sin conexión</h1>
      <p className="text-gray-400 mb-6">
        Parece que no tienes conexión a internet. Verifica tu conexión e intenta nuevamente.
      </p>
      
      <div className="space-y-3">
        <button onClick={onRetry} className="w-full btn btn-primary">
          Intentar nuevamente
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full btn btn-ghost"
        >
          Ir al inicio
        </button>
      </div>
    </motion.div>
  </div>
)

// 404 Error Component
export const NotFoundError = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full text-center"
    >
      <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl font-bold text-gray-400">404</span>
      </div>
      
      <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
      <p className="text-gray-400 mb-6">
        La página que buscas no existe o ha sido movida.
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => window.history.back()}
          className="w-full btn btn-primary flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full btn btn-ghost"
        >
          Ir al inicio
        </button>
      </div>
    </motion.div>
  </div>
)

// Server Error Component
export const ServerError = ({ onRetry }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full text-center"
    >
      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl font-bold text-red-400">500</span>
      </div>
      
      <h1 className="text-2xl font-bold mb-4">Error del servidor</h1>
      <p className="text-gray-400 mb-6">
        Estamos experimentando problemas técnicos. Intenta nuevamente en unos minutos.
      </p>
      
      <div className="space-y-3">
        <button onClick={onRetry} className="w-full btn btn-primary">
          Intentar nuevamente
        </button>
        <button
          onClick={() => window.open('https://wa.me/56912345678', '_blank')}
          className="w-full btn btn-ghost"
        >
          Contactar soporte
        </button>
      </div>
    </motion.div>
  </div>
)

// Maintenance Mode Component
export const MaintenanceMode = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <RefreshCw className="w-10 h-10 text-primary-400" />
      </motion.div>
      
      <h1 className="text-2xl font-bold mb-4">Mantenimiento programado</h1>
      <p className="text-gray-400 mb-6">
        Estamos mejorando Córtate.cl para ofrecerte una mejor experiencia. 
        Volveremos pronto.
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => window.location.reload()}
          className="w-full btn btn-primary"
        >
          Verificar nuevamente
        </button>
        <button
          onClick={() => window.open('https://twitter.com/cortate_cl', '_blank')}
          className="w-full btn btn-ghost"
        >
          Seguir actualizaciones
        </button>
      </div>
    </motion.div>
  </div>
)

// Error boundary hook
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null)
  
  const resetError = () => setError(null)
  
  const handleError = React.useCallback((error) => {
    console.error('Error caught by error handler:', error)
    setError(error)
  }, [])
  
  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      handleError(new Error(event.reason))
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [handleError])
  
  return { error, handleError, resetError }
}

export default ErrorFallback
