import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Scissors, 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook, 
  Twitter,
  Youtube,
  Smartphone,
  Shield,
  Award,
  Clock,
  ChevronRight
} from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Buscar Barberos', path: '/mapa' },
    { name: 'Cómo Funciona', path: '/como-funciona' },
    { name: 'Precios', path: '/precios' },
    { name: 'Ayuda', path: '/ayuda' }
  ]

  const forBarbers = [
    { name: 'Únete como Barbero', path: '/register?tipo=barbero' },
    { name: 'App para Barberos', path: '/app-barbero' },
    { name: 'Recursos', path: '/recursos' },
    { name: 'Comisiones', path: '/comisiones' },
    { name: 'Soporte Barberos', path: '/soporte-barberos' }
  ]

  const support = [
    { name: 'Centro de Ayuda', path: '/ayuda' },
    { name: 'Contacto', path: '/contacto' },
    { name: 'Términos y Condiciones', path: '/terminos' },
    { name: 'Política de Privacidad', path: '/privacidad' },
    { name: 'Reclamos', path: '/reclamos' }
  ]

  const cities = [
    'Santiago',
    'Valparaíso',
    'Viña del Mar',
    'Concepción',
    'La Serena',
    'Antofagasta'
  ]

  const socialLinks = [
    { 
      name: 'Instagram', 
      icon: Instagram, 
      url: 'https://instagram.com/cortate.cl',
      color: 'hover:text-pink-400'
    },
    { 
      name: 'Facebook', 
      icon: Facebook, 
      url: 'https://facebook.com/cortate.cl',
      color: 'hover:text-blue-400'
    },
    { 
      name: 'Twitter', 
      icon: Twitter, 
      url: 'https://twitter.com/cortate_cl',
      color: 'hover:text-blue-300'
    },
    { 
      name: 'YouTube', 
      icon: Youtube, 
      url: 'https://youtube.com/@cortate.cl',
      color: 'hover:text-red-400'
    }
  ]

  const features = [
    { icon: Shield, text: 'Barberos Verificados' },
    { icon: Clock, text: 'Disponible 24/7' },
    { icon: Award, text: 'Mejor Calificados' },
    { icon: Smartphone, text: 'App Móvil' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Features Bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-3 text-center md:text-left"
                >
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-gray-300 font-medium">{feature.text}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <Scissors className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                CÓRTATE.CL
              </span>
            </Link>
            
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              La plataforma líder en Chile para encontrar y reservar servicios de barbería. 
              Conectamos clientes con los mejores barberos profesionales del país.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-primary-400" />
                <span>Santiago, Chile</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-primary-400" />
                <span>+56 9 XXXX XXXX</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-primary-400" />
                <span>hola@cortate.cl</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 transition-colors ${social.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                  >
                    <ChevronRight className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Barbers */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Para Barberos</h3>
            <ul className="space-y-3">
              {forBarbers.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                  >
                    <ChevronRight className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Soporte</h3>
            <ul className="space-y-3">
              {support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                  >
                    <ChevronRight className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Newsletter */}
            <div className="mt-8">
              <h4 className="text-md font-medium mb-3 text-white">Newsletter</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Tu email"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
                <button className="bg-primary-500 hover:bg-primary-600 text-black px-4 py-2 rounded-r-lg text-sm font-medium transition-colors">
                  Suscribir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cities */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-white">Ciudades Disponibles</h3>
          <div className="flex flex-wrap gap-4">
            {cities.map((city) => (
              <Link
                key={city}
                to={`/mapa?ciudad=${city.toLowerCase()}`}
                className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>

        {/* App Downloads */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-white">Descarga Nuestra App</h3>
          <div className="flex flex-wrap gap-4">
            <motion.a
              href="#"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center">
                <span className="text-black font-bold text-xs">iOS</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Descargar en</p>
                <p className="text-white font-medium">App Store</p>
              </div>
            </motion.a>

            <motion.a
              href="#"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">GP</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Disponible en</p>
                <p className="text-white font-medium">Google Play</p>
              </div>
            </motion.a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} Córtate.cl. Todos los derechos reservados.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link to="/terminos" className="hover:text-primary-400 transition-colors">
                Términos
              </Link>
              <Link to="/privacidad" className="hover:text-primary-400 transition-colors">
                Privacidad
              </Link>
              <Link to="/cookies" className="hover:text-primary-400 transition-colors">
                Cookies
              </Link>
              <span className="text-primary-400">
                Hecho con ❤️ en Chile
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
