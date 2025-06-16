import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Filter, 
  Map, 
  Search, 
  MapPin, 
  Sliders,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import BarberList from '../components/barbers/BarberList';
import MapFilters from '../components/maps/MapFilters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import barberService from '../services/barberService';
import googleMapsService from '../services/googleMapsService';
import { useAuth } from '../context/AuthContext';
import { filterAndSortBarbers } from '../utils/helpers';

const ListPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados principales
  const [barbers, setBarbers] = useState([]);
  const [filteredBarbers, setFilteredBarbers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filtros
  const [filters, setFilters] = useState({
    rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')) : null,
    priceRange: searchParams.get('priceRange') ? searchParams.get('priceRange').split(',').map(Number) : null,
    serviceType: searchParams.get('serviceType') || null,
    services: searchParams.get('services') ? searchParams.get('services').split(',') : [],
    available: searchParams.get('available') === 'true',
    distance: searchParams.get('distance') ? parseInt(searchParams.get('distance')) : 20,
    sortBy: searchParams.get('sortBy') || 'distance'
  });

  // Categorías para filtrado rápido
  const categories = [
    { id: 'all', name: 'Todos', count: barbers.length },
    { id: 'available', name: 'Disponibles', count: barbers.filter(b => b.status === 'available').length },
    { id: 'immediate', name: 'Inmediatos', count: barbers.filter(b => b.availability?.immediateBooking).length },
    { id: 'home_service', name: 'A domicilio', count: barbers.filter(b => b.serviceTypes?.includes('home')).length },
    { id: 'top_rated', name: 'Mejor valorados', count: barbers.filter(b => b.rating >= 4.5).length }
  ];

  // Obtener ubicación del usuario
  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await googleMapsService.getCurrentLocation();
      setUserLocation(location);
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      const defaultLocation = { lat: -33.4489, lng: -70.6693 };
      setUserLocation(defaultLocation);
      return defaultLocation;
    }
  }, []);

  // Cargar barberos
  const loadBarbers = useCallback(async (location = userLocation) => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await barberService.getCombinedBarbers(
        location.lat, 
        location.lng, 
        filters.distance
      );

      if (result.success) {
        setBarbers(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar barberos');
      setBarbers([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, filters.distance]);

  // Aplicar filtros y búsqueda
  useEffect(() => {
    let filtered = [...barbers];

    // Aplicar categoría seleccionada
    switch (selectedCategory) {
      case 'available':
        filtered = filtered.filter(b => b.status === 'available');
        break;
      case 'immediate':
        filtered = filtered.filter(b => b.availability?.immediateBooking);
        break;
      case 'home_service':
        filtered = filtered.filter(b => b.serviceTypes?.includes('home'));
        break;
      case 'top_rated':
        filtered = filtered.filter(b => b.rating >= 4.5);
        break;
      default:
        break;
    }

    // Aplicar filtros adicionales
    const searchFilters = { ...filters };
    if (searchQuery) {
      searchFilters.search = searchQuery;
    }

    filtered = filterAndSortBarbers(filtered, searchFilters, filters.sortBy);
    setFilteredBarbers(filtered);
  }, [barbers, filters, searchQuery, selectedCategory]);

  // Actualizar URL con parámetros
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (filters.rating) params.set('rating', filters.rating.toString());
    if (filters.priceRange) params.set('priceRange', filters.priceRange.join(','));
    if (filters.serviceType) params.set('serviceType', filters.serviceType);
    if (filters.services.length > 0) params.set('services', filters.services.join(','));
    if (filters.available) params.set('available', 'true');
    if (filters.distance !== 20) params.set('distance', filters.distance.toString());
    if (filters.sortBy !== 'distance') params.set('sortBy', filters.sortBy);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);

    setSearchParams(params, { replace: true });
  }, [filters, searchQuery, selectedCategory, setSearchParams]);

  // Inicializar página
  useEffect(() => {
    const initializePage = async () => {
      const location = await getCurrentLocation();
      await loadBarbers(location);
    };

    initializePage();
  }, [getCurrentLocation, loadBarbers]);

  // Manejar cambio de filtros
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Manejar favoritos
  const handleFavoriteToggle = (barberId) => {
    // TODO: Implementar lógica de favoritos
    console.log('Toggle favorite:', barberId);
  };

  // Recargar datos
  const handleRefresh = () => {
    loadBarbers();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Título y navegación */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Barberos disponibles</h1>
              <p className="text-gray-400 mt-1">
                Encuentra el barbero perfecto cerca de ti
              </p>
            </div>

            <Link
              to="/map"
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Map className="w-4 h-4" />
              <span>Ver mapa</span>
            </Link>
          </div>

          {/* Buscador principal */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar barberos, servicios, ubicación..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(true)}
              className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg border border-gray-600 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:block">Filtros</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg border border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Categorías rápidas */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-300 hover:text-white border border-gray-600'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* Información de resultados */}
          <div className="flex items-center justify-between text-sm mt-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">
                {filteredBarbers.length} barbero{filteredBarbers.length !== 1 ? 's' : ''} encontrado{filteredBarbers.length !== 1 ? 's' : ''}
              </span>
              
              {userLocation && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>Radio: {filters.distance}km</span>
                </div>
              )}
            </div>

            {/* Filtros activos */}
            {(searchQuery || selectedCategory !== 'all' || Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setFilters({
                    rating: null,
                    priceRange: null,
                    serviceType: null,
                    services: [],
                    available: false,
                    distance: 20,
                    sortBy: 'distance'
                  });
                }}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <MapPin className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Error al cargar barberos</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <BarberList
            barbers={filteredBarbers}
            isLoading={isLoading}
            onFavoriteToggle={handleFavoriteToggle}
            onRefresh={handleRefresh}
            showLocation={true}
            emptyMessage={
              selectedCategory === 'all' 
                ? 'No hay barberos disponibles en tu área'
                : `No hay barberos en la categoría "${categories.find(c => c.id === selectedCategory)?.name}"`
            }
          />
        )}
      </div>

      {/* Modal de filtros */}
      {showFilters && (
        <MapFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilters(false)}
          barbersCount={filteredBarbers.length}
        />
      )}

      {/* Información adicional */}
      {!isLoading && filteredBarbers.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-white">
                ¿No encuentras lo que buscas?
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, distance: prev.distance + 10 }));
                  }}
                  className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                >
                  Ampliar búsqueda a {filters.distance + 10}km
                </button>
                
                <Link
                  to="/register?type=barber"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors"
                >
                  ¿Eres barbero? Únete
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListPage;
