import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  Heart,
  Edit,
  Camera,
  Save,
  X,
  Scissors,
  Clock,
  Award,
  Eye,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatPrice, formatRelativeTime, getInitials } from '../utils/helpers';

const ClientProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || null
  });
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [favoriteBarbers, setFavoriteBarbers] = useState([]);
  const [errors, setErrors] = useState({});

  // Cargar datos del perfil
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      
      // Simular carga de datos
      setTimeout(() => {
        setStats({
          totalBookings: 12,
          completedBookings: 10,
          cancelledBookings: 2,
          totalSpent: 156000,
          averageRating: 4.7,
          favoriteBarbers: 3
        });

        setRecentBookings([
          {
            id: 1,
            barber: 'Juan Martínez',
            barberId: 1,
            service: 'Corte + Barba',
            date: '2024-01-15T15:30:00Z',
            price: 15000,
            status: 'completed',
            rating: 5
          },
          {
            id: 2,
            barber: 'Carlos Pérez',
            barberId: 2,
            service: 'Corte de Cabello',
            date: '2024-01-10T14:00:00Z',
            price: 12000,
            status: 'completed',
            rating: 4
          },
          {
            id: 3,
            barber: 'Miguel Torres',
            barberId: 3,
            service: 'Corte + Barba',
            date: '2024-01-05T16:30:00Z',
            price: 18000,
            status: 'cancelled',
            rating: null
          }
        ]);

        setFavoriteBarbers([
          {
            id: 1,
            name: 'Juan Martínez',
            rating: 4.9,
            specialties: ['Corte clásico', 'Barba'],
            distance: '1.2km'
          },
          {
            id: 2,
            name: 'Carlos Pérez',
            rating: 4.8,
            specialties: ['Corte moderno', 'Diseño'],
            distance: '2.1km'
          }
        ]);

        setIsLoading(false);
      }, 1000);
    };

    loadProfileData();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (profileData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (profileData.phone && !/^(\+?56)?[0-9]{8,9}$/.test(profileData.phone)) {
      newErrors.phone = 'Teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Actualizar contexto de usuario
      updateUser(profileData);
      setIsEditing(false);
    } catch (error) {
      setErrors({ general: 'Error al guardar los cambios' });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      avatar: user?.avatar || null
    });
    setErrors({});
    setIsEditing(false);
  };

  // Manejar cambio de avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar archivo
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: 'La imagen debe ser menor a 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setProfileData(prev => ({ ...prev, avatar: reader.result }));
        setErrors(prev => ({ ...prev, avatar: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
          <p className="text-gray-400">Gestiona tu información personal y preferencias</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información personal */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Información personal</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancel}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Guardar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {errors.general && (
                  <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                    {errors.general}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-600">
                        {profileData.avatar ? (
                          <img
                            src={profileData.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-yellow-400 flex items-center justify-center">
                            <span className="text-2xl font-bold text-black">
                              {getInitials(profileData.name)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <label className="absolute -bottom-1 -right-1 bg-yellow-400 text-black p-1 rounded-full cursor-pointer hover:bg-yellow-500 transition-colors">
                          <Camera className="w-3 h-3" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">{profileData.name}</h3>
                      <p className="text-gray-400">{profileData.email}</p>
                      {errors.avatar && (
                        <p className="text-red-400 text-sm mt-1">{errors.avatar}</p>
                      )}
                    </div>
                  </div>

                  {/* Formulario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre completo *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        />
                      ) : (
                        <div className="p-3 bg-gray-800 rounded-lg text-white">
                          {profileData.name || 'No especificado'}
                        </div>
                      )}
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        />
                      ) : (
                        <div className="p-3 bg-gray-800 rounded-lg text-white">
                          {profileData.email}
                        </div>
                      )}
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Teléfono
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+56 9 1234 5678"
                          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        />
                      ) : (
                        <div className="p-3 bg-gray-800 rounded-lg text-white">
                          {profileData.phone || 'No especificado'}
                        </div>
                      )}
                      {errors.phone && (
                        <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dirección
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Tu dirección"
                          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        />
                      ) : (
                        <div className="p-3 bg-gray-800 rounded-lg text-white">
                          {profileData.address || 'No especificado'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estadísticas */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Mis estadísticas</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400">Reservas totales</span>
                  </div>
                  <span className="text-white font-semibold">{stats?.totalBookings}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Scissors className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">Completadas</span>
                  </div>
                  <span className="text-white font-semibold">{stats?.completedBookings}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400">Mi calificación</span>
                  </div>
                  <span className="text-white font-semibold">{stats?.averageRating}/5</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400">Total gastado</span>
                  </div>
                  <span className="text-white font-semibold">{formatPrice(stats?.totalSpent)}</span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Acciones rápidas</h3>
              
              <div className="space-y-3">
                <Link
                  to="/bookings"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ver mis reservas</span>
                </Link>
                
                <Link
                  to="/map"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Buscar barberos</span>
                </Link>
                
                <Link
                  to="/favorites"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Heart className="w-4 h-4" />
                  <span>Mis favoritos</span>
                </Link>
              </div>
            </div>

            {/* Barberos favoritos */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Favoritos</h3>
                <Link
                  to="/favorites"
                  className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
                >
                  Ver todos
                </Link>
              </div>

              {favoriteBarbers.length > 0 ? (
                <div className="space-y-3">
                  {favoriteBarbers.slice(0, 3).map((barber) => (
                    <Link
                      key={barber.id}
                      to={`/barber/${barber.id}`}
                      className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white text-sm">{barber.name}</h4>
                          <p className="text-xs text-gray-400">{barber.specialties.join(', ')}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-white">{barber.rating}</span>
                          </div>
                          <p className="text-xs text-gray-500">{barber.distance}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Heart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No tienes favoritos aún</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historial reciente */}
        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Reservas recientes</h2>
              <Link
                to="/bookings"
                className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
              >
                Ver historial completo
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-black font-semibold text-sm">
                          {booking.barber.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-white">{booking.barber}</h3>
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
                      <p className={`text-sm ${
                        booking.status === 'completed' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {booking.status === 'completed' ? 'Completada' : 'Cancelada'}
                      </p>
                      {booking.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-white">{booking.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No tienes reservas aún
                </h3>
                <p className="text-gray-400 mb-4">
                  ¡Reserva tu primer corte y comienza tu experiencia!
                </p>
                <Link
                  to="/map"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Buscar barberos</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
