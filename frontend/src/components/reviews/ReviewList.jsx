import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  Verified,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ReviewList = ({ 
  barberId, 
  reviews = [], 
  isLoading = false, 
  onLoadMore,
  hasMore = false,
  onHelpfulClick,
  onReportReview 
}) => {
  const { user } = useAuth();
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [helpfulReviews, setHelpfulReviews] = useState(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Expandir/contraer reseña
  const toggleReviewExpansion = (reviewId) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  // Marcar como útil
  const handleHelpfulClick = (reviewId) => {
    setHelpfulReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
    onHelpfulClick?.(reviewId);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.ceil(diffDays / 30)} meses`;
    
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Renderizar estrellas
  const renderStars = (rating, size = 'sm') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  // Componente de reseña individual
  const ReviewItem = ({ review }) => {
    const isExpanded = expandedReviews.has(review.id);
    const isHelpful = helpfulReviews.has(review.id);
    const shouldShowExpandButton = review.comment.length > 200;
    const displayComment = shouldShowExpandButton && !isExpanded 
      ? review.comment.substring(0, 200) + '...'
      : review.comment;

    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        {/* Header de la reseña */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-black font-semibold text-sm">
                {review.author.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            
            {/* Info del autor */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-white truncate">
                  {review.author.name}
                </h4>
                {review.author.verified && (
                  <Verified className="w-4 h-4 text-blue-400 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center space-x-4 mt-1">
                {renderStars(review.rating)}
                <span className="text-gray-400 text-sm">
                  {formatDate(review.date)}
                </span>
              </div>
            </div>
          </div>

          {/* Menú de opciones */}
          <button className="text-gray-400 hover:text-white p-1">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Comentario */}
        <div className="mb-4">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {displayComment}
          </p>
          
          {shouldShowExpandButton && (
            <button
              onClick={() => toggleReviewExpansion(review.id)}
              className="text-yellow-400 hover:text-yellow-300 text-sm mt-2 flex items-center space-x-1 transition-colors"
            >
              <span>{isExpanded ? 'Ver menos' : 'Ver más'}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Fotos de la reseña */}
        {review.photos && review.photos.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {review.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-700 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={photo}
                    alt={`Foto ${index + 1} de reseña`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Respuesta del barbero */}
        {review.response && (
          <div className="bg-gray-700 rounded-lg p-4 mt-4 border-l-4 border-yellow-400">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-semibold text-xs">B</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-semibold text-white">
                    Respuesta del barbero
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(review.response.date)}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {review.response.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-600">
          <div className="flex items-center space-x-4">
            {/* Botón de útil */}
            <button
              onClick={() => handleHelpfulClick(review.id)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                isHelpful
                  ? 'bg-yellow-400/20 text-yellow-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Útil</span>
              {review.helpful > 0 && (
                <span className="bg-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {review.helpful + (isHelpful ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Botón de responder (solo para barberos) */}
            {user?.role === 'barber' && user?.id === barberId && !review.response && (
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white text-sm transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>Responder</span>
              </button>
            )}
          </div>

          {/* Reportar */}
          <button
            onClick={() => onReportReview?.(review.id)}
            className="flex items-center space-x-1 text-gray-500 hover:text-red-400 text-xs transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Reportar</span>
          </button>
        </div>
      </div>
    );
  };

  // Modal de foto
  const PhotoModal = () => {
    if (!selectedPhoto) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedPhoto(null)}
      >
        <div className="relative max-w-4xl max-h-full">
          <img
            src={selectedPhoto}
            alt="Foto de reseña ampliada"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  // Renderizado principal
  if (isLoading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Sin reseñas aún
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Este barbero aún no tiene reseñas. ¡Sé el primero en compartir tu experiencia!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de reseñas */}
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}

      {/* Botón cargar más */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Cargando...</span>
              </>
            ) : (
              <span>Cargar más reseñas</span>
            )}
          </button>
        </div>
      )}

      {/* Modal de foto */}
      <PhotoModal />
    </div>
  );
};

export default ReviewList;
