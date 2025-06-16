import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Phone, Clock, Users } from 'lucide-react'
import { useAuth } from '@context/AuthContext'

const WhatsAppFloat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Show button after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Auto-close after 10 seconds of inactivity
  useEffect(() => {
    let timer
    if (isOpen) {
      timer = setTimeout(() => {
        setIsOpen(false)
      }, 10000)
    }
    return () => clearTimeout(timer)
  }, [isOpen])

  const whatsappNumber = '+56912345678' // Replace with actual number
  
  const formatWhatsAppUrl = (message) => {
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const quickMessages = [
    {
      icon: Users,
      title: 'Consulta General',
      message: `${getGreeting()}! Tengo una consulta sobre Córtate.cl`
    },
    {
      icon: Phone,
      title: 'Problema con Reserva',
      message: `Hola! Tengo un problema con mi reserva${isAuthenticated && user ? ` (Usuario: ${user.profile.firstName})` : ''}`
    },
    {
      icon: Clock,
      title: 'Horarios de Atención',
      message: 'Hola! ¿Cuáles son los horarios de atención al cliente?'
    }
  ]

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* WhatsApp Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="mb-4 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-green-500 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Soporte Córtate.cl</h3>
                    <p className="text-sm opacity-90">En línea • Responde rápido</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Greeting Message */}
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <p className="text-gray-800 text-sm">
                    {getGreeting()}! 👋
                    <br />
                    ¿En qué podemos ayudarte? Selecciona una opción o escríbenos directamente.
                  </p>
                </div>

                {/* Quick Options */}
                <div className="space-y-2 mb-4">
                  {quickMessages.map((option, index) => {
                    const Icon = option.icon
                    return (
                      <motion.a
                        key={index}
                        href={formatWhatsAppUrl(option.message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <Icon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm font-medium">
                          {option.title}
                        </span>
                      </motion.a>
                    )
                  })}
                </div>

                {/* Direct Contact */}
                <motion.a
                  href={formatWhatsAppUrl(`${getGreeting()}! Necesito ayuda con Córtate.cl`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Escribir por WhatsApp</span>
                </motion.a>

                {/* Footer */}
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Horario: Lun-Vie 9:00-20:00, Sáb 10:00-18:00
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Float Button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          {/* Notification Dot */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white">!</span>
          </motion.div>

          {/* Icon with rotation */}
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <MessageCircle className="w-6 h-6" />
            )}
          </motion.div>

          {/* Pulse effect */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-green-400 rounded-full"
          />
        </motion.button>

        {/* Tooltip for first-time users */}
        <AnimatePresence>
          {!isOpen && isVisible && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              transition={{ delay: 1 }}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none"
            >
              ¿Necesitas ayuda?
              <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// Alternative compact version
export const WhatsAppCompact = () => {
  const whatsappNumber = '+56912345678'
  
  const openWhatsApp = () => {
    const message = encodeURIComponent('Hola! Necesito ayuda con Córtate.cl')
    window.open(`https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`, '_blank')
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={openWhatsApp}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
    >
      <MessageCircle className="w-6 h-6" />
      
      {/* Pulse effect */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-green-400 rounded-full"
      />
    </motion.button>
  )
}

// WhatsApp link helper
export const createWhatsAppLink = (message, number = '+56912345678') => {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${number.replace('+', '')}?text=${encodedMessage}`
}

// WhatsApp button component for other parts of the app
export const WhatsAppButton = ({ 
  message = 'Hola! Necesito ayuda con Córtate.cl',
  number = '+56912345678',
  className = '',
  children,
  variant = 'default'
}) => {
  const openWhatsApp = () => {
    window.open(createWhatsAppLink(message, number), '_blank')
  }

  if (variant === 'text') {
    return (
      <button
        onClick={openWhatsApp}
        className={`text-green-600 hover:text-green-700 font-medium transition-colors ${className}`}
      >
        {children || 'Contactar por WhatsApp'}
      </button>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openWhatsApp}
      className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${className}`}
    >
      <MessageCircle className="w-5 h-5" />
      <span>{children || 'WhatsApp'}</span>
    </motion.button>
  )
}

export default WhatsAppFloat
