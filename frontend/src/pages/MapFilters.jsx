import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  MapPin, 
  Clock, 
  Home, 
  Store, 
  Scissors,
  RotateCcw,
  Check
} from 'lucide-react';
import { PRICE_RANGES, FILTER_OPTIONS } from '../../utils/constants';
import { formatPrice } from '../../utils/helpers';

const MapFilters = ({ 
  filters, 
  onFiltersChange, 
  onClose, 
  barbersCount = 0 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [hasChanges, setHasChanges] = useState(false);

  // Detectar cambios en los filtros
  useEffect(() => {
    const isEqual = JSON.stringify(filters) === JSON.stringify(localFilters);
    setHasChanges(!isEqual);
  }, [filters, localFilters]);

  // Actualizar filtro individual
  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Aplicar filtros
  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  // Resetear filtros
  const resetFilters = () => {
    const defaultFilters = {
      rating: null,
      priceRange: null,
      serviceType: null,
      services: [],
      available: false,
      distance: 10,
      sortBy: 'distance'
    };
    setLocalFilters(defaultFilters);
  };

  // Manejar selección de servicios
  const toggleService = (service) => {
    const currentServices = localFilters.services || [];
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    updateFilter('services', updatedServices);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Filtros de búsqueda</h2>
            <p className="text-sm text-gray-400 mt-1">
              Personaliza tu búsqueda de barberos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Calificación */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>Calificación mínima</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {FILTER_OPTIONS.RATING_FILTER.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('rating', option.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    localFilters.rating === option.value
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < option.value ? 'text-yellow-400 fill-current' : 'text-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Botón para limpiar calificación */}
            {localFilters.rating && (
              <button
                onClick={() => updateFilter('rating', null)}
                className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Mostrar todas las calificaciones
              </button>
            )}
          </div>

          {/* Rango de precios */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Rango de precio</h3>
            <div className="space-y-2">
              {PRICE_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => updateFilter('priceRange', [range.min, range.max])}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    localFilters.priceRange && 
                    localFilters.priceRange[0] === range.min && 
                    localFilters.priceRange[1] === range.max
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            
            {/* Botón para limpiar precio */}
            {localFilters.priceRange && (
              <button
                onClick={() => updateFilter('priceRange', null)}
                className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Mostrar todos los precios
              </button>
            )}
          </div>

          {/* Tipo de servicio */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-yellow-400" />
              <span>Tipo de atención</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => updateFilter('serviceType', 'in_shop')}
                className={`p-3 rounded-lg border transition-all ${
                  localFilters.serviceType === 'in_shop'
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Store className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">En local</div>
                    <div className="text-sm opacity-75">Visita el local del barbero</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => updateFilter('serviceType', 'home')}
                className={`p-3 rounded-lg border transition-all ${
                  localFilters.serviceType === 'home'
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Home className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">A domicilio</div>
                    <div className="text-sm opacity-75">El barbero va a tu ubicación</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => updateFilter('serviceType', 'both')}
                className={`p-3 rounded-lg border transition-all ${
                  localFilters.serviceType === 'both'
                    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <Store className="w-4 h-4" />
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Ambos</div>
                    <div className="text-sm opacity-75">Local y domicilio disponibles</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Botón para limpiar tipo de servicio */}
            {localFilters.serviceType && (
              <button
                onClick={() => updateFilter('serviceType', null)}
                className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Mostrar todos los tipos
              </button>
            )}
          </div>

          {/* Servicios especiales */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
              <Scissors className="w-5 h-5 text-yellow-400" />
              <span>Servicios especiales</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'express', name: 'Corte Exprés', icon: '⚡' },
                { id: 'kids', name: 'Niños', icon: '👶' },
                { id: 'design', name: 'Diseño', icon: '🎨' },
                { id: 'father_son', name: 'Padre e Hijo', icon: '👨‍👦' }
              ].map((service) => (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    localFilters.services?.includes(service.id)
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{service.icon}</span>
                    <span className="text-sm font-medium">{service.name}</span>
                    {localFilters.services?.includes(service.id) && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Disponibilidad */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span>Disponibilidad</span>
            </h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.available}
                  onChange={(e) => updateFilter('available', e.target.checked)}
                  className="w-4 h-4 text-yellow-400 bg-gray-700 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <span className="text-gray-300">Solo mostrar barberos disponibles</span>
              </label>
            </div>
          </div>

          {/* Distancia */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-yellow-400" />
              <span>Distancia máxima</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400 min-w-0">1km</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={localFilters.distance}
                  onChange={(e) => updateFilter('distance', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm text-gray-400 min-w-0">50km</span>
              </div>
              <div className="text-center">
                <span className="text-yellow-400 font-medium">
                  {localFilters.distance}km
                </span>
              </div>
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Ordenar por</h3>
            <div className="grid grid-cols-2 gap-3">
              {FILTER_OPTIONS.SORT_BY.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('sortBy', option.value)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    localFilters.sortBy === option.value
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              {barbersCount} resultado{barbersCount !== 1 ? 's' : ''} encontrado{barbersCount !== 1 ? 's' : ''}
            </div>
            
            {hasChanges && (
              <div className="text-sm text-yellow-400">
                Filtros modificados
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={resetFilters}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Resetear</span>
            </button>
            
            <button
              onClick={applyFilters}
              className="flex-2 bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-6 rounded-lg transition-colors font-medium"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estilos para el slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #facc15;
          cursor: pointer;
          border: 2px solid #374151;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #facc15;
          cursor: pointer;
          border: 2px solid #374151;
        }
      `}</style>
    </div>
  );
};

export default MapFilters;
