import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Star, 
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Settings,
  Eye,
  Plus,
  Scissors,
  MapPin,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatPrice, formatRelativeTime } from '../utils/helpers';

const BarberDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'year'

  // Datos simulados - en producción vendrían del backend
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simular carga de datos
      setTimeout(() => {
        setStats({
          totalBookings: 47,
          pendingBookings: 3,
          completedBookings: 41,
          cancelledBookings: 3,
          totalRevenue: 658000,
          averageRating: 4.8,
          totalReviews: 28,
          responseRate: 96,
          weeklyGrowth: 12,
          monthlyRevenue: [
            { month: 'Ene', revenue: 120000 },
            { month: 'Feb', revenue: 145000 },
            { month: 'Mar', revenue: 168000 },
            { month: 'Abr', revenue: 192000 },
            { month: 'May', revenue: 205000 },
            { month: 'Jun', revenue: 225000 }
          ]
        });

        setRecentBookings([
          {
            id: 1,
            client: 'Carlos Mendoza',
            service: 'Corte + Barba',
            date: '2024-01-20T15:30:00Z',
            price: 15000,
            status: 'pending'
          },
          {
            id: 2,
            client: 'Diego Fuentes',
            service: 'Corte de Cabello',
            date: '2024-01-20T17:00:00Z',
            price: 12000,
            status: 'confirmed'
          },
          {
            id: 3,
            client: 'Andrés Silva',
            service: 'Corte + Barba',
            date: '2024-01-21T10:00:00Z',
            price: 15000,
            status: 'confirmed'
          }
        ]);

        setRecentReviews([
          {
            id: 1,
            client: 'Roberto Pérez',
            rating: 5,
            comment: 'Excelente servicio, muy profesional',
            date: '2024-01-19T14:00:00Z'
          },
          {
            id: 2,
            client: 'Mario López',
            rating: 4,
            comment: 'Buen corte, ambiente agradable',
            date: '2024-01-18T16:30:00Z'
          }
        ]);

        setIsLoading(false);
      }, 1500);
    };

    loadDashboardData();
  }, [selectedPeriod]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'confirmed': return 'text-green-400';
      case 'completed': return 'text-gray-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-white">
                ¡Hola, {user?.name}! 👋
              </h1>
              <p className="text-gray-400 mt-1">
                Aquí tienes un resumen de tu actividad
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
              </select>

              <Link
                to="/barber/profile"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Configurar perfil</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Ingresos totales</h3>
                <p className="text-2xl font-bold text-white">{formatPrice(stats.totalRevenue)}</p>
                <p className="text-sm text-green-400 mt-1">+{stats.weeklyGrowth}% esta semana</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Reservas totales</h3>
                <p className="text-2xl font-bold text-white">{stats.totalBookings}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {stats.pendingBookings} pendientes
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Calificación</h3>
                <p className="text-2xl font-bold text-white">{stats.averageRating}/5</p>
                <p className="text-sm text-gray-400 mt-1">
                  {stats.totalReviews} reseñas
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Tasa de respuesta</h3>
                <p className="text-2xl font-bold text-white">{stats.responseRate}%</p>
                <p className="text-sm text-green-400 mt-1">Excelente</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <MessageCircle className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reservas recientes */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Próximas reservas</h2>
                  <Link
                    to="/barber/bookings"
                    className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
                  >
                    Ver todas
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {recentBookings.length > 0 ? (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-black font-semibold text-sm">
                              {booking.client.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-white">{booking.client}</h3>
                            <p className="text-sm text-gray-400">{booking.service}</p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(booking.date)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-yellow-400">
                            {formatPrice(booking.price)}
                          </p>
                          <p className={`text-sm ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No tienes reservas próximas
                    </h3>
                    <p className="text-gray-400">
                      Las nuevas reservas aparecerán aquí
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estado actual */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tu estado</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Estado actual:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Disponible</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cortes inmediatos:</span>
                  <span className="text-blue-400 text-sm">Activado</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Perfil visible:</span>
                  <span className="text-green-400 text-sm">Sí</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Ver mi perfil público</span>
                </button>
                
                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Cambiar estado</span>
                </button>
              </div>
            </div>

            {/* Reseñas recientes */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Reseñas recientes</h3>
                <Link
                  to="/barber/reviews"
                  className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
                >
                  Ver todas
                </Link>
              </div>

              {recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white text-sm">
                          {review.client}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        "{review.comment}"
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(review.date)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Star className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No tienes reseñas aún
                  </p>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Acciones rápidas</h3>
              
              <div className="space-y-3">
                <Link
                  to="/barber/profile"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Editar perfil</span>
                </Link>
                
                <Link
                  to="/barber/gallery"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Subir fotos</span>
                </Link>
                
                <Link
                  to="/barber/schedule"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Horarios</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tips section */}
        <div className="mt-8 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-xl border border-yellow-400/20 p-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-yellow-400 rounded-lg">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Consejos para mejorar tu perfil
              </h3>
              
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Subir fotos de calidad de tus trabajos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Responder rápido a las reservas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span>Mantener tus horarios actualizados</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span>Responder a las reseñas de clientes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard;
