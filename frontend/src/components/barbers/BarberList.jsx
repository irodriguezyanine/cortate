import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  List, 
  Filter, 
  SortAsc, 
  MapPin,
  Search,
  RefreshCw
} from 'lucide-react';
import BarberCard from './BarberCard';
import LoadingSpinner, { CardListSkeleton } from '../common/LoadingSpinner';
import { filterAndSortBarbers } from '../../utils/helpers';

const BarberList = ({ 
  barbers = [], 
  isLoading = false,
  onFavoriteToggle,
  onRefresh,
  showLocation = true,
  layout: defaultLayout = 'grid',
  showFilters = true,
  emptyMessage = 'No se encontraron barberos'
}) => {
  const [layout, setLayout] = useState(defaultLayout);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [filteredBarbers, setFilteredBarbers] = useState([]);
  const [favorites, setFavorites] = useState(new Set());

  // Aplicar filtros y búsqueda
  useEffect(() => {
    let filtered = [...barbers];

    // Aplicar búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(barber => 
        barber.name?.toLowerCase().includes(query) ||
        barber.address?.toLowerCase().includes(query) ||
        barber.specialties?.some(spec => spec.toLowerCase().includes(query)) ||
        barber.services?.some(service => service.name.toLowerCase().includes(query))
      );
    }

    // Aplicar ordenamiento
    filtered = filterAndSortBarbers(filtered, {}, sortBy);

    setFilteredBarbers(filtered);
  }, [barbers, searchQuery, sortBy]);

  // Manejar favoritos
  const handleFavoriteToggle = (barberId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(barberId)) {
      newFavorites.delete(barberId);
    } else {
      newFavorites.add(barberId);
    }
    setFavorites(newFavorites);
    onFavoriteToggle?.(barberId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {showFilters && (
          <div className="animate-pulse">
            <div className="h-12 bg-gray-800 rounded-lg"></div>
          </div>
        )}
        <CardListSkeleton count={layout === 'grid' ? 9 : 6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles y filtros */}
      {showFilters && (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
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
                placeholder="Buscar barberos..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* Ordenamiento */}
              <div className="flex items-center space-x-2">
                <SortAsc className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="distance">Distancia</option>
                  <option value="rating">Calificación</option>
                  <option value="price_low">Precio: Menor a Mayor</option>
                  <option value="price_high">Precio: Mayor a Menor</option>
                  <option value="reviews">Más Reseñas</option>
                  <option value="name">Nombre A-Z</option>
                </select>
              </div>

              {/* Selector de layout */}
              <div className="flex bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
                <button
                  onClick={() => setLayout('grid')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    layout === 'grid' 
                      ? 'bg-yellow-400 text-black' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Vista de cuadrícula"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    layout === 'list' 
                      ? 'bg-yellow-400 text-black' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Vista de lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Botón de recargar */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg border border-gray-600 transition-colors"
                  title="Recargar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Información de resultados */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {filteredBarbers.length} de {barbers.length} barbero{barbers.length !== 1 ? 's' : ''}
              {searchQuery && ` • Búsqueda: "${searchQuery}"`}
            </span>
            
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista/Grid de barberos */}
      {filteredBarbers.length > 0 ? (
        <div className={`${
          layout === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
          {filteredBarbers.map((barber) => (
            <BarberCard
              key={barber.id}
              barber={barber}
              layout={layout === 'grid' ? 'card' : 'list'}
              showDistance={showLocation}
              isFavorite={favorites.has(barber.id)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              {searchQuery ? (
                <Search className="w-8 h-8 text-gray-600" />
              ) : (
                <MapPin className="w-8 h-8 text-gray-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchQuery ? 'No se encontraron resultados' : emptyMessage}
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchQuery 
                  ? `No encontramos barberos que coincidan con "${searchQuery}". Prueba con otros términos de búsqueda.`
                  : 'No hay barberos disponibles en este momento. Intenta recargar o ajustar los filtros.'
                }
              </p>
            </div>

            {(searchQuery || onRefresh) && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors"
                  >
                    Limpiar búsqueda
                  </button>
                )}
                
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    Recargar lista
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información adicional */}
      {filteredBarbers.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-400">
              Mostrando {filteredBarbers.length} barbero{filteredBarbers.length !== 1 ? 's' : ''}
              {showLocation && ' ordenados por distancia'}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Corte inmediato</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Sin perfil</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberList;
