// frontend/src/components/barbers/BarberCard.jsx (Con botón neutralizado)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Eye, MessageCircle, Heart, Shield, Calendar } from 'lucide-react';
import { formatPrice, formatDistance, getInitials } from '../../utils/helpers';
import { formatBarberProfile } from '../../utils/formatters';
import { BarberWhatsAppButton } from '../common/WhatsAppFloat';

const BarberCard = ({ 
  barber, 
  onFavoriteToggle, 
  isFavorite = false,
  showDistance = true,
  layout = 'card'
}) => {
  // ... (tus hooks y funciones auxiliares se mantienen igual)
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const profile = formatBarberProfile(barber);
  const getStatusColor = () => { /* ... */ };
  const getStatusText = () => { /* ... */ };
  const renderServiceTags = () => { /* ... */ };

  if (layout === 'card') {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 hover:border-yellow-400/50 ...">
        <div className="relative h-48 bg-gray-800">
          {/* ... tu código de imagen y overlay ... */}

          {/* Botón de favorito - TEMPORALMENTE COMENTADO */}
          <div className="absolute top-3 right-3">
            {/*
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
            */}
          </div>

          {/* ... resto de elementos del header de la tarjeta ... */}
        </div>
        <div className="p-4 space-y-3">
          {/* ... contenido de la tarjeta ... */}
        </div>
      </div>
    );
  }

  // Layout de lista
  return (
    <div className="bg-gray-900 rounded-lg border ...">
      <div className="flex items-center space-x-4">
        {/* ... */}
        <div className="flex-1 min-w-0">
          {/* ... */}
          <div className="flex items-center justify-between mt-3">
            {/* ... */}
            <div className="flex items-center space-x-2">
              {/* Botón de favorito - TEMPORALMENTE COMENTADO */}
              {/*
              <button
                onClick={() => onFavoriteToggle?.(barber.id)}
                className={`p-2 rounded-full transition-colors ...`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              */}

              {/* ... resto de botones de acción ... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberCard;
