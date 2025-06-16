import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  Calendar, 
  MessageCircle,
  Heart,
  Share2,
  ArrowLeft,
  Scissors,
  Home,
  Store,
  Shield,
  Award,
  Eye,
  Camera,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import barberService from '../../services/barberService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ReviewList from '../reviews/ReviewList';
import { BarberWhatsAppButton } from '../common/WhatsAppFloat';
import { formatPrice, formatDistance, getInitials } from '../../utils/helpers';
import { formatBarberProfile, formatWorkingHours } from '../../utils/formatters';

const BarberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [barber, setBarber] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'reviews' | 'gallery'

  // Cargar datos del barbero
  useEffect(() => {
    const loadBarber = async () => {
      setIsLoading(true);
      try {
        const result = await barberService.getBarberById(id);
        if (result.success) {
          setBarber(result.data);
        } else {
          setError(result.message || 'Barbero no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el barbero');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadBarber();
    }
  }, [id]);

  // Manejar favoritos
  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setIsFavorite(!isFavorite);
    // TODO: Implementar llamada a API para favoritos
  };

  // Compartir perfil
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${barber.name} - Córtate.cl`,
          text: `Conoce el perfil de ${barber.name} en Córtate.cl`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      // TODO: Mostrar notificación de copiado
    }
  };

  // Navegar entre imágenes
  const handlePrevImage = () => {
    if (barber.gallery && barber.gallery.length > 0) {
      setActiveImageIndex(prev => 
        prev === 0 ? barber.gallery.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (barber.gallery && barber.gallery.length > 0) {
      setActiveImageIndex(prev => 
        prev === barber.gallery.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400">
            <Scissors className="w-12 h-12 mx-auto mb-2" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Error</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/map')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors"
            >
              Volver al mapa
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return null;
  }

  const profile = formatBarberProfile(barber);
  const workingHours = formatWorkingHours(barber.workingHours);

  return (
    <div className="min-h-screen bg-black">
      {/* Header con imagen de portada */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-gray-800 to-gray-900">
        {barber.coverImage ? (
          <img
            src={barber.coverImage}
            alt={`Portada de ${barber.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors className="w-16 h-16 text-yellow-400 opacity-50" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        {/* Botones de navegación */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleShare}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </button>
            
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-full transition-colors ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
              }`}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Estado del barbero */}
        <div className="absolute bottom-4 left-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${
            barber.status === 'available' 
              ? 'bg-green-500 text-white' 
              : barber.status === 'busy'
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-500 text-white'
          }`}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>{profile.statusText}</span>
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
          {/* Header del perfil */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-700 bg-gray-800">
                  {barber.profileImage ? (
                    <img
                      src={barber.profileImage}
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-yellow-400 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl font-bold text-black">
                        {getInitials(barber.name)}
                      </span>
                    </div>
                  )}
                </div>
                
                {barber.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full">
                    <Shield className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Información básica */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start justify-between">
                  <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      {barber.name}
                    </h1>
                    
                    {barber.specialties && barber.specialties.length > 0 && (
                      <p className="text-gray-400">
                        {barber.specialties.join(' • ')}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{barber.address}</span>
                      </div>
                      
                      {barber.distance && (
                        <span>• {formatDistance(barber.distance)}</span>
                      )}
                    </div>

                    {/* Calificación y reseñas */}
                    <div className="flex items-center space-x-4">
                      {barber.rating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="font-semibold text-white">
                            {profile.formattedRating}
                          </span>
                          <span className="text-gray-400">
                            ({profile.formattedReviews} reseñas)
                          </span>
                        </div>
                      )}
                      
                      {barber.totalCuts && (
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Scissors className="w-4 h-4" />
                          <span>{barber.totalCuts} cortes</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col space-y-3 mt-4 md:mt-0">
                    <div className="flex space-x-3">
                      <BarberWhatsAppButton
                        barber={barber}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </BarberWhatsAppButton>
                      
                      <button
                        onClick={() => navigate(`/booking/${barber.id}`)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Reservar</span>
                      </button>
                    </div>

                    {barber.phone && (
                      <a
                        href={`tel:${barber.phone}`}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-center"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Llamar</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs de navegación */}
          <div className="border-t border-gray-700">
            <div className="flex">
              {[
                { id: 'info', label: 'Información', icon: Scissors },
                { id: 'reviews', label: 'Reseñas', icon: Star },
                { id: 'gallery', label: 'Galería', icon: Camera }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                      activeTab === tab.id
                        ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/5'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenido de las tabs */}
          <div className="p-6 md:p-8">
            {/* Tab: Información */}
            {activeTab === 'info' && (
              <div className="space-y-8">
                {/* Descripción */}
                {barber.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Acerca de mí</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {barber.description}
                    </p>
                  </div>
                )}

                {/* Servicios y precios */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Servicios y precios</h3>
                  <div className="grid gap-4">
                    {barber.services?.map((service, index) => (
                      <div
                        key={index}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-gray-400 mt-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-yellow-400">
                              {formatPrice(service.price)}
                            </div>
                            {service.duration && (
                              <div className="text-sm text-gray-400">
                                {service.duration} min
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tipos de atención */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Tipos de atención</h3>
                  <div className="flex flex-wrap gap-3">
                    {barber.serviceTypes?.map((type) => (
                      <div
                        key={type}
                        className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 flex items-center space-x-2"
                      >
                        {type === 'in_shop' && <Store className="w-4 h-4 text-yellow-400" />}
                        {type === 'home' && <Home className="w-4 h-4 text-yellow-400" />}
                        <span className="text-white text-sm">
                          {type === 'in_shop' ? 'En local' : 'A domicilio'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Servicios adicionales */}
                {barber.additionalServices && barber.additionalServices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Servicios especiales</h3>
                    <div className="flex flex-wrap gap-3">
                      {barber.additionalServices.map((service) => (
                        <div
                          key={service}
                          className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-2 text-yellow-400 text-sm"
                        >
                          {service}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Horarios de atención */}
                {workingHours && workingHours.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <span>Horarios de atención</span>
                    </h3>
                    <div className="grid gap-2">
                      {workingHours.map((day, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0"
                        >
                          <span className="text-gray-300 font-medium">
                            {day.day}
                          </span>
                          <span className={`text-sm ${
                            day.isOpen ? 'text-white' : 'text-gray-500'
                          }`}>
                            {day.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Reseñas */}
            {activeTab === 'reviews' && (
              <ReviewList barberId={barber.id} />
            )}

            {/* Tab: Galería */}
            {activeTab === 'gallery' && (
              <div>
                {barber.gallery && barber.gallery.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {barber.gallery.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveImageIndex(index);
                          setShowImageModal(true);
                        }}
                        className="aspect-square bg-gray-800 rounded-lg overflow-hidden hover:opacity-80 transition-opacity group"
                      >
                        <img
                          src={image.url || image}
                          alt={`Trabajo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Sin imágenes en la galería
                    </h3>
                    <p className="text-gray-400">
                      Este barbero aún no ha subido fotos de sus trabajos
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de imagen */}
      {showImageModal && barber.gallery && barber.gallery.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Imagen */}
            <img
              src={barber.gallery[activeImageIndex]?.url || barber.gallery[activeImageIndex]}
              alt={`Trabajo ${activeImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Controles */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {barber.gallery.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            {/* Indicador */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {activeImageIndex + 1} / {barber.gallery.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberProfile;
