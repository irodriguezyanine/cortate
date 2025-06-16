import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Star, 
  MessageCircle, 
  Eye, 
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  Clock,
  MapPin,
  Phone,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReviewForm from '../components/reviews/ReviewForm';
import { formatPrice, formatRelativeTime } from '../utils/helpers';
import { BarberWhatsAppButton } from '../components/common/WhatsAppFloat';

const BookingHistory = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Datos simulados
  const mockBookings = [
    {
      id: 1,
      barber: {
        id: 1,
        name: 'Juan Martínez',
        phone: '+56912345678',
        address: 'Providencia, Santiago'
      },
      service: {
        name: 'Corte + Barba',
        price: 15000
      },
      date: '2024-01-15T15:30:00Z',
      type: 'scheduled',
      serviceType: 'in_shop',
      status: 'completed',
      totalPrice: 15000,
      notes: 'Corte degradado, barba recortada',
      review: {
        rating: 5,
        comment: 'Excelente servicio, muy profesional'
      }
    },
    {
      id: 2,
      barber: {
        id: 2,
        name: 'Carlos Pérez',
        phone: '+56987654321',
        address: 'Las Condes, Santiago'
      },
      service: {
        name: 'Corte de Cabello',
        price: 12000
      },
      date: '2024-01-10T14:00:00Z',
      type: 'scheduled',
      serviceType: 'in_shop',
      status: 'completed',
      totalPrice: 12000,
      notes: 'Corte clásico',
      review: {
        rating: 4,
        comment: 'Buen servicio, recomendado'
      }
    },
    {
      id: 3,
      barber: {
        id: 3,
        name: 'Miguel Torres',
        phone: '+56911223344',
        address: 'Ñuñoa, Santiago'
      },
      service: {
        name: 'Corte + Barba',
        price: 18000
      },
      date: '2024-01-05T16:30:00Z',
      type: 'immediate',
      serviceType: 'home',
      status: 'cancelled',
      totalPrice: 18000,
      notes: 'Servicio a domicilio',
      cancelReason: 'Cancelado por el cliente'
    },
    {
      id: 4,
      barber: {
        id: 4,
        name: 'Roberto Silva',
        phone: '+56955667788',
        address: 'Maipú, Santiago'
      },
      service: {
        name: 'Corte de Cabello',
        price: 10000
      },
      date: '2024-01-25T11:00:00Z',
      type: 'scheduled',
      serviceType: 'in_shop',
      status: 'confirmed',
      totalPrice: 10000,
      notes: 'Corte simple'
    }
  ];

  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true);
      
      // Simular carga
      setTimeout(() => {
        setBookings(mockBookings);
        setIsLoading(false);
      }, 1000);
    };

    loadBookings();
  }, []);

  // Filtrar reservas
  useEffect(() => {
    let filtered = [...bookings];

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.barber.name.toLowerCase().includes(query) ||
        booking.service.name.toLowerCase().includes(query) ||
        booking.barber.address.toLowerCase().includes(query)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'confirmed': return 'text-green-400 bg-green-400/10';
      case 'completed': return 'text-gray-400 bg-gray-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
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

  const canReview = (booking) => {
    return booking.status === 'completed' && !booking.review;
  };

  const handleReviewSubmit = (bookingId, reviewData) => {
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId 
        ? { ...booking, review: reviewData }
        : booking
    ));
    setShowReviewForm(false);
    setSelectedBooking(null);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando historial..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-white">Mis Reservas</h1>
              <p className="text-gray-400 mt-1">
                Historial completo de tus reservas y servicios
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>

              <Link
                to="/map"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors"
              >
                Nueva reserva
              </Link>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Buscador */}
            <div className="flex-1 relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por barbero, servicio..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none pr-8"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Información de resultados */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {filteredBookings.length} de {bookings.length} reserva{bookings.length !== 1 ? 's' : ''}
              {searchQuery && ` • Búsqueda: "${searchQuery}"`}
            </span>
            
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de reservas */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    {/* Información principal */}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-semibold">
                          {booking.barber.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-white">
                            {booking.barber.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>

                        <p className="text-gray-300 mb-1">{booking.service.name}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(booking.date).toLocaleDateString('es-CL')}</span>
                            <span>{new Date(booking.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.serviceType === 'home' ? 'A domicilio' : 'En local'}</span>
                          </div>
                          
                          {booking.type === 'immediate' && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Inmediato</span>
                            </div>
                          )}
                        </div>

                        {booking.notes && (
                          <p className="text-gray-500 text-sm mt-2">
                            📝 {booking.notes}
                          </p>
                        )}

                        {booking.cancelReason && (
                          <p className="text-red-400 text-sm mt-2">
                            ❌ {booking.cancelReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Precio y acciones */}
                    <div className="flex flex-col items-end space-y-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-400">
                          {formatPrice(booking.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatRelativeTime(booking.date)}
                        </p>
                      </div>

                      {/* Calificación si existe */}
                      {booking.review && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-white font-medium">{booking.review.rating}</span>
                          <span className="text-gray-400 text-sm">Mi reseña</span>
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/barber/${booking.barber.id}`}
                          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                          title="Ver perfil del barbero"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {booking.barber.phone && (
                          <BarberWhatsAppButton
                            barber={booking.barber}
                            service={booking.service}
                            bookingData={booking}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </BarberWhatsAppButton>
                        )}

                        {canReview(booking) && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowReviewForm(true);
                            }}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black p-2 rounded-lg transition-colors"
                            title="Escribir reseña"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reseña si existe */}
                  {booking.review && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg border-l-4 border-yellow-400">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium text-yellow-400">Mi reseña</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < booking.review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        "{booking.review.comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {searchQuery || statusFilter !== 'all' ? (
                <Search className="w-8 h-8 text-gray-600" />
              ) : (
                <Calendar className="w-8 h-8 text-gray-600" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery || statusFilter !== 'all' 
                ? 'No se encontraron reservas' 
                : 'No tienes reservas aún'
              }
            </h3>
            
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Prueba ajustando los filtros de búsqueda para encontrar tus reservas.'
                : '¡Reserva tu primer corte y comienza tu experiencia con Córtate.cl!'
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
              
              <Link
                to="/map"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors"
              >
                Buscar barberos
              </Link>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        {bookings.length > 0 && (
          <div className="mt-8 bg-gray-900 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Resumen</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {bookings.length}
                </p>
                <p className="text-sm text-gray-400">Total reservas</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-400">Completadas</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {formatPrice(bookings.reduce((sum, b) => 
                    b.status === 'completed' ? sum + b.totalPrice : sum, 0
                  ))}
                </p>
                <p className="text-sm text-gray-400">Total gastado</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {bookings.filter(b => b.review).length > 0 
                    ? (bookings.filter(b => b.review).reduce((sum, b) => sum + b.review.rating, 0) / 
                       bookings.filter(b => b.review).length).toFixed(1)
                    : '0.0'
                  }
                </p>
                <p className="text-sm text-gray-400">Mi calificación promedio</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de reseña */}
      {showReviewForm && selectedBooking && (
        <ReviewForm
          barberId={selectedBooking.barber.id}
          onSuccess={(reviewData) => handleReviewSubmit(selectedBooking.id, reviewData)}
          onCancel={() => {
            setShowReviewForm(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default BookingHistory;
