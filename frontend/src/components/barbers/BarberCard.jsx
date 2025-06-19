// frontend/src/components/barbers/BarberCard.jsx (Corregido y Neutralizado)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, MapPin, Clock, Phone, MessageCircle, Heart, Eye, Calendar, Scissors, Badge, Shield
} from 'lucide-react';
import { formatPrice, formatDistance, getInitials } from '../../utils/helpers';
import { formatBarberProfile } from '../../utils/formatters';
import { BarberWhatsAppButton } from '../common/WhatsAppFloat';

const BarberCard = ({ 
  barber, 
  onFavoriteToggle, // Se mantiene la prop, pero no se usará temporalmente
  isFavorite = false,
  showDistance = true,
  layout = 'card' // 'card' | 'list'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  const profile = formatBarberProfile(barber);

  // ... (tus funciones getStatusColor, getStatusText, renderServiceTags se mantienen igual)
  const getStatusColor = () => { /* ... tu código ... */ };
  const getStatusText = () => { /* ... tu código ... */ };
  const renderServiceTags = () => { /* ... tu código ... */ };

  // Layout de tarjeta
  if (layout === 'card') {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 hover:border-yellow-400/50 transition-all duration-300 overflow-hidden group">
        <div className="relative h-48 bg-gray-800">
          {/* ... tu código de imagen y overlay sin cambios ... */}
          {/* ... */}
          
          {/* ===================== INICIO DE LA CORRECCIÓN ===================== */}
          {/* Botón de favorito - TEMPORALMENTE COMENTADO PARA SOLUCIONAR EL ERROR */}
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
          {/* ===================== FIN DE LA CORRECCIÓN ======================= */}

          {/* ... el resto de tu código de la tarjeta sin cambios ... */}
        </div>

        {/* ... el resto de tu código de la tarjeta sin cambios ... */}
      </div>
    );
  }

  // Layout de lista
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 hover:border-yellow-400/50 transition-all duration-300 p-4">
      {/* ... tu código del layout de lista ... */}
      <div className="flex items-center space-x-4">
        {/* ... */}
        <div className="flex-1 min-w-0">
          {/* ... */}
          <div className="flex items-center justify-between mt-3">
            {/* ... */}
            <div className="flex items-center space-x-2">
              {/* ===================== INICIO DE LA CORRECCIÓN ===================== */}
              {/* Botón de favorito - TEMPORALMENTE COMENTADO PARA SOLUCIONAR EL ERROR */}
              {/*
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
              */}
              {/* ===================== FIN DE LA CORRECCIÓN ======================= */}

              {/* ... el resto de tus botones de acción sin cambios ... */}
              <Link to={`/barber/${barber.id}`} className="...">
                <Eye className="w-4 h-4" />
              </Link>
              {/* ... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberCard;
