import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  Scissors, 
  Home, 
  Calendar, 
  Shield,
  ChevronRight,
  Play,
  Users,
  Award,
  Smartphone
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'

const Landing = () => {
  const [searchLocation, setSearchLocation] = useState('')
  const [stats, setStats] = useState({
    totalBarbers: 250,
    totalBookings: 1500,
    averageRating: 4.8,
    cities: 15
  })
  
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchLocation.trim()) {
      navigate(`/mapa?buscar=${encodeURIComponent(searchLocation)}`)
    } else {
      navigate('/mapa')
    }
  }

  const features = [
    {
      icon: Search,
      title: 'Encuentra tu barbero ideal',
      description: 'Busca por ubicación, servicios, precios y reseñas reales de otros clientes.'
    },
    {
      icon: Calendar,
      title: 'Reserva en segundos',
      description: 'Agenda tu cita online las 24 horas. Sin llamadas ni esperas.'
    },
    {
      icon: Home,
      title: 'A domicilio o en local',
      description: 'Elige si prefieres que vayan a tu casa o visitar la barbería.'
    },
    {
      icon: Shield,
      title: '100% seguro y confiable',
      description: 'Barberos verificados, pagos seguros y garantía de satisfacción.'
    }
  ]

  const howItWorks = [
    {
      step: 1,
      title: 'Busca',
      description: 'Encuentra barberos cerca de ti usando nuestro mapa interactivo',
      icon: Search
    },
    {
      step: 2,
      title: 'Elige',
      description: 'Compara precios, reseñas y servicios para tomar la mejor decisión',
      icon: Star
    },
    {
      step: 3,
      title: 'Reserva',
      description: 'Agenda tu cita en el horario que más te convenga',
      icon: Calendar
    },
    {
      step: 4,
      title: 'Disfruta',
      description: 'Recibe tu corte perfecto y deja tu reseña para ayudar a otros',
      icon: Scissors
    }
  ]

  const testimonials = [
    {
      name: 'Carlos M.',
      rating: 5,
      comment: 'Increíble servicio. Mi barbero llegó puntual y el corte quedó perfecto.',
      service: 'Corte a domicilio',
      avatar: null
    },
    {
      name: 'Andrea P.',
      rating: 5,
      comment: 'Super fácil reservar para mi hijo. El barbero fue muy paciente con él.',
      service: 'Corte niño',
      avatar: null
    },
    {
      name: 'Roberto L.',
      rating: 5,
      comment: 'La mejor app para encontrar buenos barberos. Ya la uso hace meses.',
      service: 'Corte + barba',
      avatar: null
    }
  ]

  return (
    <>
      <Helmet>
        <title>Córtate.cl - Tu corte perfecto, a un clic de distancia</title>
        <meta name="description" content="Encuentra y reserva tu corte de pelo ideal en Chile. Barberos verificados, servicios a domicilio o en local, reservas online 24/7." />
        <meta name="keywords" content="barbería, corte de pelo, reservas online, Chile, barberos a domicilio" />
        <meta property="og:title" content="Córtate.cl - Tu corte perfecto, a un clic de distancia" />
        <meta property="og:description" content="La mejor plataforma para encontrar barberos en Chile. Reserva online, compara precios y lee reseñas reales." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://cortate.cl" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-hero-pattern opacity-5"></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          
          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-20 left-10 w-16 h-16 bg-primary-500/20 rounded-full blur-sm"
            ></motion.div>
            <motion.div
              animate={{ 
                y: [0, 20, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-20 right-10 w-20 h-20 bg-primary-400/10 rounded-full blur-sm"
            ></motion.div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Main Heading */}
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="block">Tu corte</span>
                <span className="block bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                  perfecto
                </span>
                <span className="block">a un clic</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Encuentra barberos profesionales cerca de ti. 
                <span className="text-primary-400"> Reserva online</span>, 
                compara precios y recibe el mejor servicio 
                <span className="text-primary-400"> a domicilio o en local</span>.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="max-w-2xl mx-auto"
              >
                <form onSubmit={handleSearch} className="relative">
                  <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2">
                    <MapPin className="w-6 h-6 text-primary-400 mx-4" />
                    <input
                      type="text"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      placeholder="¿Dónde estás? Ej: Providencia, Santiago"
                      className="flex-1 bg-transparent text-white placeholder-gray-400 px-4 py-4 text-lg focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-black px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/25 transform hover:scale-105"
                    >
                      Buscar
                    </button>
                  </div>
                </form>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-wrap justify-center gap-4 mt-8"
              >
                <Link
                  to="/mapa"
                  className="btn btn-secondary flex items-center space-x-2 hover:scale-105 transition-transform"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Ver Mapa</span>
                </Link>
                <Link
                  to="/lista"
                  className="btn btn-ghost flex items-center space-x-2 hover:scale-105 transition-transform"
                >
                  <Search className="w-5 h-5" />
                  <span>Ver Lista</span>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto"
              >
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-400">
                    {stats.totalBarbers}+
                  </div>
                  <div className="text-gray-400 mt-1">Barberos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-400">
                    {stats.totalBookings}+
                  </div>
                  <div className="text-gray-400 mt-1">Reservas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-400">
                    {stats.averageRating}
                  </div>
                  <div className="text-gray-400 mt-1">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-400">
                    {stats.cities}+
                  </div>
                  <div className="text-gray-400 mt-1">Ciudades</div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-primary-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-primary-400 rounded-full mt-2"></div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                ¿Por qué elegir 
                <span className="text-primary-400"> Córtate.cl</span>?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                La plataforma más completa para encontrar tu barbero ideal en Chile
              </p>
            </motion.div>

            <motion.div
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="card bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-black" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                ¿Cómo funciona?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Solo 4 pasos para conseguir tu corte perfecto
              </p>
            </motion.div>

            <motion.div
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {howItWorks.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="text-center group"
                  >
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-10 h-10 text-black" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-800 border-2 border-primary-400 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Lo que dicen nuestros 
                <span className="text-primary-400">clientes</span>
              </h2>
              <p className="text-xl text-gray-300">
                Miles de personas ya confían en nosotros
              </p>
            </motion.div>

            <motion.div
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="card bg-gray-800/50 border-gray-700 p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-black font-bold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{testimonial.name}</h4>
                      <div className="flex items-center">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-primary-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 italic">
                    "{testimonial.comment}"
                  </p>
                  <span className="text-sm text-primary-400 font-medium">
                    {testimonial.service}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA for Barbers */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/20 rounded-3xl p-8 md:p-12"
            >
              <Scissors className="w-16 h-16 text-primary-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                ¿Eres barbero?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Únete a la red de barberos más grande de Chile. 
                Aumenta tus ingresos, gestiona tu agenda y haz crecer tu negocio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register?tipo=barbero"
                  className="btn btn-primary flex items-center justify-center space-x-2 px-8 py-4 text-lg"
                >
                  <Users className="w-6 h-6" />
                  <span>Súmate como barbero</span>
                </Link>
                <button className="btn btn-ghost flex items-center justify-center space-x-2 px-8 py-4 text-lg">
                  <Play className="w-6 h-6" />
                  <span>Ver cómo funciona</span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                ¿Listo para tu mejor corte?
              </h2>
              <p className="text-xl text-black/80 mb-8">
                Únete a miles de personas que ya encontraron su barbero ideal
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="bg-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-900 transition-colors text-lg"
                >
                  Crear cuenta gratis
                </Link>
                <Link
                  to="/mapa"
                  className="bg-white/20 text-black px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors text-lg border border-black/20"
                >
                  Explorar barberos
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  )
}

export default Landing
