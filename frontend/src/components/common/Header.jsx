import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  MapPin, 
  Calendar,
  BarChart3,
  Bell,
  Search,
  Scissors
} from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { clsx } from 'clsx'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  const { user, isAuthenticated, logout, isBarber, isClient } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus when location changes
  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileMenuOpen(false)
  }, [location])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.mobile-menu') && !event.target.closest('.menu-button')) {
        setIsMenuOpen(false)
      }
      if (!event.target.closest('.profile-menu') && !event.target.closest('.profile-button')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const navigationItems = [
    { 
      name: 'Inicio', 
      path: '/', 
      icon: null,
      public: true 
    },
    { 
      name: 'Mapa', 
      path: '/mapa', 
      icon: MapPin,
      public: true 
    },
    { 
      name: 'Lista', 
      path: '/lista', 
      icon: Search,
      public: true 
    }
  ]

  const userMenuItems = isBarber() ? [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Perfil', path: '/perfil', icon: User },
    { name: 'Configuración', path: '/configuracion', icon: Settings }
  ] : [
    { name: 'Mis Reservas', path: '/reservas', icon: Calendar },
    { name: 'Perfil', path: '/perfil', icon: User },
    { name: 'Configuración', path: '/configuracion', icon: Settings }
  ]

  return (
    <header className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled 
        ? 'bg-black/95 backdrop-blur-md shadow-lg border-b border-primary-500/20' 
        : 'bg-black/80 backdrop-blur-sm'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg group-hover:scale-105 transition-transform duration-200">
              <Scissors className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              CÓRTATE.CL
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActivePath(item.path)
                      ? 'text-primary-400 bg-primary-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                {/* Notification Bell */}
                <button className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                </button>

                {/* Profile Menu */}
                <div className="relative profile-menu">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="profile-button flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                      {user?.profile?.avatar ? (
                        <img 
                          src={user.profile.avatar} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {user?.profile?.firstName}
                    </span>
                  </button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-1"
                      >
                        {userMenuItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </Link>
                          )
                        })}
                        <hr className="my-1 border-gray-700" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-black px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/25"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="menu-button md:hidden p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu md:hidden bg-gray-900 border-t border-gray-700"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Navigation Links */}
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium transition-colors',
                      isActivePath(item.path)
                        ? 'text-primary-400 bg-primary-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    )}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span>{item.name}</span>
                  </Link>
                )
              })}

              {/* Auth Section */}
              {isAuthenticated ? (
                <>
                  <hr className="my-4 border-gray-700" />
                  
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                      {user?.profile?.avatar ? (
                        <img 
                          src={user.profile.avatar} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-black" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {isBarber() ? 'Barbero' : 'Cliente'}
                      </p>
                    </div>
                  </div>

                  {/* User Menu Items */}
                  {userMenuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-3 rounded-lg text-base font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <>
                  <hr className="my-4 border-gray-700" />
                  <Link
                    to="/login"
                    className="block px-3 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-3 rounded-lg text-base font-medium bg-gradient-to-r from-primary-500 to-primary-600 text-black hover:from-primary-600 hover:to-primary-700 transition-all"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header
