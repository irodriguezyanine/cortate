import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { 
  Home, 
  ArrowLeft, 
  Search, 
  MapPin, 
  Scissors,
  AlertTriangle
} from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()

  const quickLinks = [
    {
      title: 'Buscar Barberos',
      description: 'Encuentra barberos cerca de ti',
      path: '/mapa',
      icon: MapPin,
      color: 'bg-blue-500'
    },
    {
      title: 'Ver Lista',
      description: 'Explora todos los barberos disponibles',
      path: '/lista',
      icon: Search,
      color: 'bg-green-500'
    },
    {
      title: 'Únete como Barbero',
      description: '¿Eres barbero? Súmate a nosotros',
      path: '/register?tipo=barbero',
      icon: Scissors,
      color: 'bg-primary-500'
    }
  ]

  const floatingElements = [
    { size: 'w-16 h-16', position: 'top-20 left-10', delay: 0 },
    { size: 'w-12 h-12', position: 'top-40 right-20', delay: 1 },
    { size: 'w-20 h-20', position: 'bottom-32 left-20', delay: 2 },
    { size: 'w-14 h-14', position: 'bottom-20 right-10', delay: 0.5 },
  ]

  return (
    <>
      <Helmet>
        <title>Página no encontrada - Córtate.cl</title>
        <meta name="description" content="La página que buscas no existe. Explora nuestros servicios de barbería o encuentra barberos cerca de ti." />
      </Helmet>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Floating Background Elements */}
        {floatingElements.map((element, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 0.1, 
              scale: 1,
              y: [0, -20, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              delay: element.delay,
              ease: "easeInOut"
            }}
            className={`absolute ${element.position} ${element.size} bg-primary-500 rounded-full blur-sm`}
          />
        ))}

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Animated 404 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <motion.h1 
                className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-4"
                animate={{ 
                  textShadow: [
                    "0 0 20px rgba(212, 175, 55, 0.5)",
                    "0 0 40px rgba(212, 175, 55, 0.8)",
                    "0 0 20px rgba(212, 175, 55, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                404
              </motion.h1>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </motion.div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¡Ups! Esta página se fue a cortar el pelo
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
                La página que buscas no existe o fue movida. 
                Pero no te preocupes, tenemos muchas otras opciones para ti.
              </p>
              
              {/* Fun message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 max-w-md mx-auto"
              >
                <p className="text-primary-300 text-sm">
                  💡 Mientras tanto, ¿qué tal si encuentras tu barbero ideal?
                </p>
              </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-12"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <motion.button
                  onClick={() => navigate(-1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-secondary flex items-center justify-center space-x-2 px-6 py-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver atrás</span>
                </motion.button>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/"
                    className="btn btn-primary flex items-center justify-center space-x-2 px-6 py-3"
                  >
                    <Home className="w-5 h-5" />
                    <span>Ir al inicio</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              <h3 className="md:col-span-3 text-xl font-semibold text-gray-300 mb-4">
                O explora estas opciones populares:
              </h3>
              
              {quickLinks.map((link, index) => {
                const Icon = link.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Link
                      to={link.path}
                      className="block p-6 bg-gray-900/50 border border-gray-700 rounded-xl hover:border-primary-500/50 transition-all duration-300 group"
                    >
                      <div className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                        {link.title}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {link.description}
                      </p>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Additional Help */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-16 pt-8 border-t border-gray-800"
            >
              <p className="text-gray-500 text-sm mb-4">
                ¿Necesitas ayuda adicional?
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <button
                  onClick={() => window.open('https://wa.me/56912345678', '_blank')}
                  className="text-green-400 hover:text-green-300 transition-colors px-4 py-2 border border-green-400/20 rounded-lg hover:bg-green-400/10"
                >
                  Contactar por WhatsApp
                </button>
                
                <button
                  onClick={() => window.open('mailto:soporte@cortate.cl', '_blank')}
                  className="text-primary-400 hover:text-primary-300 transition-colors px-4 py-2 border border-primary-400/20 rounded-lg hover:bg-primary-400/10"
                >
                  Enviar email
                </button>
                
                <Link
                  to="/ayuda"
                  className="text-gray-400 hover:text-gray-300 transition-colors px-4 py-2 border border-gray-400/20 rounded-lg hover:bg-gray-400/10"
                >
                  Centro de ayuda
                </Link>
              </div>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-12"
            >
              <Link to="/" className="inline-flex items-center space-x-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-black" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  CÓRTATE.CL
                </span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Decorative Scissors Animation */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 right-10 opacity-5"
        >
          <Scissors className="w-32 h-32 text-primary-500" />
        </motion.div>

        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 left-10 opacity-5"
        >
          <Scissors className="w-24 h-24 text-primary-500" />
        </motion.div>
      </div>
    </>
  )
}

export default NotFound
