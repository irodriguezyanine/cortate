import React, { useState } from 'react';
import { 
  Star, 
  Camera, 
  X, 
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ReviewForm = ({ barberId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    photos: []
  });
  
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [photosPreviews, setPhotosPreviews] = useState([]);

  // Manejar cambio de calificación
  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  // Manejar cambio de comentario
  const handleCommentChange = (e) => {
    const comment = e.target.value;
    setFormData(prev => ({ ...prev, comment }));
    
    if (errors.comment) {
      setErrors(prev => ({ ...prev, comment: '' }));
    }
  };

  // Manejar selección de fotos
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 3;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (files.length > maxFiles) {
      setErrors(prev => ({ 
        ...prev, 
        photos: `Máximo ${maxFiles} fotos permitidas` 
      }));
      return;
    }

    // Validar tamaño de archivos
    const invalidFiles = files.filter(file => file.size > maxSize);
    if (invalidFiles.length > 0) {
      setErrors(prev => ({ 
        ...prev, 
        photos: 'Algunas fotos son muy grandes (máximo 5MB)' 
      }));
      return;
    }

    // Validar tipos de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      setErrors(prev => ({ 
        ...prev, 
        photos: 'Solo se permiten archivos JPG, PNG o WebP' 
      }));
      return;
    }

    setFormData(prev => ({ ...prev, photos: files }));
    setErrors(prev => ({ ...prev, photos: '' }));

    // Crear previews
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setPhotosPreviews(previews);
  };

  // Remover foto
  const removePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    const newPreviews = photosPreviews.filter((_, i) => i !== index);
    
    setFormData(prev => ({ ...prev, photos: newPhotos }));
    setPhotosPreviews(newPreviews);

    // Liberar URL object
    if (photosPreviews[index]) {
      URL.revokeObjectURL(photosPreviews[index].url);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Debes seleccionar una calificación';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'Debes escribir un comentario';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'El comentario debe tener al menos 10 caracteres';
    } else if (formData.comment.trim().length > 500) {
      newErrors.comment = 'El comentario no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar reseña
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular envío de reseña
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Crear objeto de reseña simulado
      const newReview = {
        id: Date.now(),
        author: {
          name: user.name,
          avatar: user.avatar,
          verified: user.verified || false
        },
        rating: formData.rating,
        comment: formData.comment.trim(),
        date: new Date().toISOString(),
        photos: photosPreviews.map(preview => preview.url),
        helpful: 0,
        response: null
      };

      onSuccess(newReview);
    } catch (error) {
      setErrors({ general: 'Error al enviar la reseña. Intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpiar previews al desmontar
  React.useEffect(() => {
    return () => {
      photosPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, []);

  const getRatingText = (rating) => {
    const texts = {
      1: 'Muy malo',
      2: 'Malo', 
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente'
    };
    return texts[rating] || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Escribir reseña</h2>
            <p className="text-sm text-gray-400 mt-1">
              Comparte tu experiencia con otros usuarios
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error general */}
          {errors.general && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          {/* Calificación */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Calificación *
            </label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredRating || formData.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-500'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {(hoveredRating || formData.rating) > 0 && (
                <p className="text-sm text-yellow-400">
                  {getRatingText(hoveredRating || formData.rating)}
                </p>
              )}
            </div>

            {errors.rating && (
              <p className="text-red-400 text-sm mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comentario *
            </label>
            
            <textarea
              value={formData.comment}
              onChange={handleCommentChange}
              placeholder="Cuéntanos sobre tu experiencia..."
              rows="4"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
            />
            
            <div className="flex justify-between items-center mt-2">
              {errors.comment ? (
                <p className="text-red-400 text-sm">{errors.comment}</p>
              ) : (
                <p className="text-gray-400 text-sm">
                  Mínimo 10 caracteres
                </p>
              )}
              <p className="text-gray-400 text-sm">
                {formData.comment.length}/500
              </p>
            </div>
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fotos (opcional)
            </label>
            
            <p className="text-sm text-gray-400 mb-3">
              Comparte fotos de tu corte (máximo 3 fotos, 5MB cada una)
            </p>

            {/* Input de archivos */}
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-1 text-sm text-gray-400">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra las fotos
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG o WebP (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>

              {errors.photos && (
                <p className="text-red-400 text-sm">{errors.photos}</p>
              )}

              {/* Previews de fotos */}
              {photosPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {photosPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-start space-x-3">
              <div className="text-blue-400 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300 font-medium">
                  Tu reseña será pública
                </p>
                <ul className="text-gray-400 space-y-1">
                  <li>• Ayuda a otros usuarios a tomar mejores decisiones</li>
                  <li>• Solo puedes reseñar barberos donde has reservado</li>
                  <li>• Las reseñas inapropiadas serán eliminadas</li>
                  <li>• El barbero puede responder a tu reseña</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.rating || !formData.comment.trim()}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-4 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Enviando...</span>
                </>
              ) : (
                <span>Publicar reseña</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
