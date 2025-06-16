import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle,
  Heart,
  Eye,
  Calendar,
  Scissors,
  Badge,
  Shield
} from 'lucide-react';
import { formatPrice, formatDistance, getInitials } from '../../utils/helpers';
import { formatBarberProfile } from '../../utils/formatters';
import { BarberWhatsAppButton } from '../common/WhatsAppFloat';

const BarberCard = ({ 
  barber, 
  onFavoriteToggle, 
  isFavorite = false,
  showDistance = true,
  layout = 'card' // 'card' | 'list'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  const profile = formatBarberProfile(barber);

  // Obtener color del estado
  const getStatusColor = () => {
    if (!barber.hasProfile) return 'bg-red-500';
    
    switch (barber.status) {
      case 'available':
        return barber.availability?.immediateBooking ? 'bg-blue-500' : 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
      default:
        return 'bg-gray-500';
    }
  };

  // Obtener texto del estado
  const getStatusText = () => {
    if (!barber.hasProfile) return 'Sin perfil';
    
    switch (barber.status) {
      case 'available':
        return barber.availability?.immediateBooking ? 'Disponible ahora' : 'Disponible';
      case 'busy':
        return 'Ocupado';
      case 'offline':
        return 'Desconectado';
      default:
        return 'Estado desconocido';
    }
  };

  // Renderizar etiquetas de servicios
  const renderServiceTags = () => {
    const tags = [];
    
    if (barber.additionalServices?.includes('express')) {
      tags.push({ name: 'Exprés', color: 'bg-blue-500' });
    }
    if (barber.additionalServices?.includes('kids')) {
      tags.push({ name: 'Niños', color: 'bg-green-500' });
    }
    if (barber.additionalServices?.includes('design')) {
      tags.push({ name: 'Diseño', color: 'bg-purple-500' });
    }
    if (barber.serviceTypes?.includes('home')) {
      tags.push({ name: 'Domicilio', color: 'bg-orange-500' });
    }
    
    return tags.slice(0, 3); // Máximo 3 etiquetas
  };

  // Layout de tarjeta
  if (layout === 'card') {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 hover:border-yellow-400/50 transition-all duration-300 overflow-hidden group">
        {/* Header con imagen */}
        <div className="relative h-48 bg-gray-800">
          {barber.profileImage && !imageError ? (
            <img
              src={barber.profileImage}
              alt={barber.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-black">
                  {getInitials(barber.name)}
                </span>
              </div>
            </div>
          )}

          {/* Overlay con botones */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3">
            <Link
              to={`/barber/${barber.id}`}
              className="bg-white/90 hover:bg-white text-black p-2 rounded-full transition-colors"
            >
              <Eye className="w-5 h-5" />
            </Link>
            {barber.hasProfile && (
              <BarberWhatsAppButton
                barber={barber}
                className="bg-green-500/90 hover:bg-green-500 text-white p-2 rounded-full transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </BarberWhatsAppButton>
            )}
          </div>

          {/* Estado del barbero */}
          <div className="absolute top-3 left-3">
            <div className={`${getStatusColor()} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1`}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>{getStatusText()}</span>
            </div>
          </div>

          {/* Botón de favorito */}
          <div className="absolute top-3 right-3">
            <button
              onClick={() => onFavoriteToggle?.(barber.id)}
              className={`p-2 rounded-full transition-colors ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Badge verificado */}
          {barber.verified && (
            <div className="absolute bottom-3 left-3">
              <div className="bg-blue-500 text-white p-1 rounded-full">
                <Shield className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-3">
          {/* Nombre y calificación */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {barber.name}
              </h3>
              {showDistance && barber.distance && (
                <p className="text-sm text-gray-400 flex items-center space-x-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{formatDistance(barber.distance)}</span>
                </p>
              )}
            </div>
            
            {barber.hasProfile && barber.rating > 0 && (
              <div className="flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-white">{profile.formattedRating}</span>
                <span className="text-xs text-gray-400">({profile.formattedReviews})</span>
              </div>
            )}
          </div>

          {/* Dirección */}
          <p className="text-sm text-gray-400 truncate">
            {barber.address || 'Dirección no especificada'}
          </p>

          {/* Servicios y precios */}
          {barber.hasProfile && barber.services?.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-400">Desde </span>
                <span className="text-yellow-400 font-semibold">
                  {profile.priceRange}
                </span>
              </div>
            </div>
          )}

          {/* Tags de servicios */}
          <div className="flex flex-wrap gap-1">
            {renderServiceTags().map((tag, index) => (
              <span
                key={index}
                className={`${tag.color} text-white text-xs px-2 py-1 rounded-full`}
              >
                {tag.name}
              </span>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-2 pt-2">
            <Link
              to={`/barber/${barber.id}`}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Ver perfil
            </Link>
            
            {barber.hasProfile && (
              <Link
                to={`/booking/${barber.id}`}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors"
              >
                Reservar
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Layout de lista
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 hover:border-yellow-400/50 transition-all duration-300 p-4">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {barber.profileImage && !imageError ? (
            <img
              src={barber.profileImage}
              alt={barber.name}
              className="w-16 h-16 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-black">
                {getInitials(barber.name)}
              </span>
            </div>
          )}
          
          {/* Estado indicator */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor()} rounded-full border-2 border-gray-900`}></div>
        </div>

        {/* Información principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {barber.name}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {barber.address || 'Dirección no especificada'}
              </p>
              
              {/* Distancia y estado */}
              <div className="flex items-center space-x-4 mt-1">
                {showDistance && barber.distance && (
                  <span className="text-sm text-gray-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{formatDistance(barber.distance)}</span>
                  </span>
                )}
                <span className="text-sm text-gray-400">
                  {getStatusText()}
                </span>
              </div>
            </div>

            {/* Calificación y precio */}
            <div className="flex flex-col items-end space-y-1">
              {barber.hasProfile && barber.rating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-white">{profile.formattedRating}</span>
                  <span className="text-xs text-gray-400">({profile.formattedReviews})</span>
                </div>
              )}
              
              {barber.hasProfile && profile.priceRange && (
                <span className="text-sm text-yellow-400 font-semibold">
                  {profile.priceRange}
                </span>
              )}
            </div>
          </div>

          {/* Tags y acciones */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-wrap gap-1">
              {renderServiceTags().slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className={`${tag.color} text-white text-xs px-2 py-1 rounded-full`}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onFavoriteToggle?.(barber.id)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite 
                    ? 'text-red-500' 
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              <Link
                to={`/barber/${barber.id}`}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
              >
                <Eye className="w-4 h-4" />
              </Link>

              {barber.hasProfile && (
                <>
                  <BarberWhatsAppButton
                    barber={barber}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </BarberWhatsAppButton>

                  <Link
                    to={`/booking/${barber.id}`}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black p-2 rounded-full transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberCard;
