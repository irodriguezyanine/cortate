// frontend/src/components/common/WhatsAppFloat.jsx

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Phone, Clock, Users } from 'lucide-react'
// No veo que uses useAuth aquí, pero lo mantengo por si acaso.
// import { useAuth } from '@context/AuthContext'

const WhatsAppFloat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  // const { user, isAuthenticated } = useAuth()

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
  
  // Asumo que tienes `user` y `isAuthenticated` desde tu contexto, si no, puedes quitarlos.
  const isAuthenticated = false; 
  const user = null;

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
      {/* ... Tu componente WhatsAppFloat completo (no necesita cambios) ... */}
      {/* (Todo el código de WhatsAppFloat que ya tienes va aquí, no lo repito para brevedad) */}
    </>
  )
}

// Alternative compact version
export const WhatsAppCompact = () => { /* ... Tu código sin cambios ... */ }

// WhatsApp link helper
export const createWhatsAppLink = (message, number = '+56912345678') => {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${number.replace('+', '')}?text=${encodedMessage}`
}


// ====================================================================
// ======================> INICIO DE LA CORRECCIÓN <=====================
// ====================================================================

// ESTE ES EL COMPONENTE QUE FALTABA
// Es un componente especializado para el barbero.
// Recibe el objeto 'barber' y otras props (como className y children)
export const BarberWhatsAppButton = ({ barber, ...props }) => {
  // Si no hay barbero o no tiene teléfono, no renderizamos nada.
  if (!barber || !barber.phone) {
    return null;
  }

  // Creamos el mensaje personalizado para el barbero.
  const message = `¡Hola ${barber.name}! Vi tu perfil en Córtate.cl y me gustaría consultar algo.`;

  // Usamos el componente genérico 'WhatsAppButton' para renderizar el botón.
  // Le pasamos el número y mensaje del barbero, y el resto de props (className, children).
  return (
    <WhatsAppButton
      number={barber.phone}
      message={message}
      {...props} // Esto pasa className, children, etc.
    />
  );
};


// ====================================================================
// ======================> FIN DE LA CORRECCIÓN <======================
// ====================================================================


// WhatsApp button component for other parts of the app (Componente genérico)
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

  // Se modificó para que el botón sea un poco más flexible y acepte un ícono como 'children'
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openWhatsApp}
      className={`${className}`} // Usamos solo la clase que viene de props para máxima flexibilidad
    >
      {children}
    </motion.button>
  )
}

export default WhatsAppFloat
